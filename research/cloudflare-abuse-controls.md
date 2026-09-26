# Abuse controls for Ask Victor on Cloudflare's free plan

Research for [#33](https://github.com/vicxs/portfolio/issues/33) (map [#31](https://github.com/vicxs/portfolio/issues/31)).
Sources checked on 2026-09-26. Every number below comes from the linked page on that date; Cloudflare's free-plan limits change, so re-check them before building.

**Question.** What does Cloudflare's free plan offer to protect a public LLM endpoint on a Worker from abuse, and what are the limits of each piece? What does current primary guidance say about prompt injection and off-topic misuse, and where can IP-free transcripts live?

---

## TL;DR

- **Bot gate: Turnstile, verified in the Worker.** It is free, has no cap on challenges or siteverify calls, and gives 20 widgets with 10 hostnames each. A token lasts 300 s and can be verified only once. So verify one token when a session starts, then issue a short-lived signed session token. Every rate limit keys on that session token, so no IP is ever needed. Pre-clearance exists on Free, but it only helps if you also put WAF *challenge* rules in front of the endpoint. Skip it.
- **Per-session limits: the Workers Rate Limiting binding.** It is GA and has no separate price. Periods are only 10 s or 60 s, it counts per Cloudflare location, and it is "permissive, eventually consistent". Use it to stop bursts, not to account for usage.
- **Coarse flood guard: the one WAF rate-limiting rule Free allows.** It counts by IP only, over 10 s, with a 10 s timeout, and can match on path. Cloudflare does the counting, so we still store no IPs. WAF phases run before the request reaches the Worker (which on a Custom Domain acts as the origin), so blocked floods never use Worker quota.
- **Global daily budget: an atomic counter in a strongly consistent store.** D1 (single primary, `UPDATE … RETURNING`) and a single Durable Object both work. KV is eventually consistent (up to 60 s or more) and allows 1 write per second per key, so it cannot be a counter. Use D1 if it also holds the transcripts (one store). Cap the budget well below the account-wide **100,000 Worker requests/day**, because the `contacto` form Worker shares that quota.
- **Transcripts: D1.** Free gives 5 GB per account, 500 MB per database, 100k rows written and 5M rows read per day. A daily Cron Trigger enforces the 30-day retention. KV has native TTL but only 1,000 writes/day. **R2 is out**: turning it on requires a payment method on file, even for the free tier, which breaks the hard-$0 rule.
- **Hard limits the design must fit:** 10 ms CPU per request (waiting on the LLM or storage doesn't count), 50 subrequests per request, 128 MB memory. The zone allows 100 MB request bodies, so **the Worker must enforce its own small body cap**.
- **Contact tool:** bind `send_email` with `destination_address` fixed to Victor's address. Then no prompt can redirect the email. Sends to verified destination addresses are free and don't count toward sending limits.
- **Prompt injection (OWASP Top 10 for LLM Apps, 2026 edition, Aug 2026):** "no reliable prevention mechanism exists today". The defence has to be architectural: limit what the agent can reach. Ask Victor reads only public data and has one outward action, an email with a fixed recipient that the visitor must confirm. That puts it in the [untrusted input + external communication] class. The mitigations that carry the load are the fixed recipient, the human confirmation, per-session and daily send caps, output token and step limits, plain-text rendering, and adaptive red-team evals in CI.

---

## 1. Turnstile

| Fact | Value | Source |
|---|---|---|
| Price (Free plan) | Free, "Unlimited challenges (traffic or verification requests)" | [Turnstile plans][ts-plans] |
| Widgets / hostnames | Up to 20 widgets, 10 hostnames per widget | [Turnstile plans][ts-plans] |
| Widget types | All (Managed, Non-interactive, Invisible) on Free | [Turnstile plans][ts-plans], [Widget types][ts-widget] |
| Pre-clearance | Available on Free | [Turnstile plans][ts-plans] |
| Ephemeral IDs (fraud linkage across IPs) | Enterprise only | [Turnstile plans][ts-plans] |
| Analytics lookback | 7 days | [Turnstile plans][ts-plans] |
| Needs other Cloudflare services? | No, "can be used independently" | [Turnstile plans][ts-plans] |

**Modes** ([Widget types][ts-widget]):
- *Managed* (recommended): picks a non-interactive or checkbox challenge based on risk.
- *Non-interactive*: shows a spinner, never asks the visitor to do anything.
- *Invisible*: shows nothing. If you use it, you **must reference Cloudflare's Turnstile Privacy Addendum in your privacy policy**. Ask Victor already has a privacy note in the box, which is a natural place for that reference.

**Verifying from a Worker** ([Server-side validation][ts-siteverify]):
- Send `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` with `secret` and `response`. `remoteip` is optional; leave it out to stay IP-free. `idempotency_key` is optional and makes retries safe.
- A token is at most 2048 characters, **valid for 300 s**, and **can be validated once**.
- The response includes `success`, `hostname`, `action`, `cdata`, `challenge_ts` and `error-codes`. Cloudflare's guidance: validate `hostname` and `action`, validate on every request, never trust the client alone, keep the secret server-side.
- Each siteverify call is one subrequest (the budget is 50 per request, §5).

**Consequence for the design.** A single-use 5-minute token doesn't fit a multi-turn chat. The practical pattern:
1. Get a Turnstile token when the visitor first submits a question. Use Managed or Invisible mode with a fixed `action`, e.g. `ask`.
2. The Worker verifies it and checks `hostname ∈ {victoresteban.com, www…}` and `action`.
3. The Worker returns a short-lived session token: an HMAC over a random id and an expiry, signed with a Worker secret.
4. Every later turn presents the session token. It is the key for per-session rate limits and turn caps, which avoids IP keys entirely. The HMAC is our own design choice, not a Cloudflare feature.

**Pre-clearance** ([Clearance][cf-clearance], [Pre-clearance configuration][ts-preclear]):
- Pre-clearance additionally issues a `cf_clearance` cookie. That cookie lets the visitor skip **WAF challenge** actions on the same zone, "including API requests".
- It requires the widget hostname to be a zone in your account that also holds the WAF rule, and the cookie lasts for the zone's Challenge Passage setting.
- Cloudflare also recommends a rate-limiting rule keyed on the `cf_clearance` value, and Free can't do that (its only counting characteristic is IP; §3).
- For Ask Victor this adds cookies, credentialed CORS and a WAF challenge rule, and prevents nothing that siteverify in the Worker doesn't already stop. **Not recommended.**

## 2. Workers Rate Limiting binding

Source: [Rate Limiting binding][rl-binding]; GA on 2025-09-19 per the [changelog][rl-ga].

- Config: a `[[ratelimits]]` entry with `name`, `namespace_id` (an integer written as a string, unique per account) and `simple = { limit, period }`. **`period` must be 10 or 60 seconds.** Requires Wrangler ≥ 4.36.0.
- API: `await env.X.limit({ key })` returns `{ success }`. The key can be any string.
- **Locality:** "For each unique key … there is a unique limit per Cloudflare location."
- **Accuracy:** "permissive, eventually consistent, and intentionally designed to not be used as an accurate accounting system." Counters are cached on the machine and synced in the background, so a call adds no meaningful latency.
- Cloudflare advises against keying on IPs ("many users may share a single IP … privacy-enabling proxies") and recommends stable ids such as user or session ids. That matches the session-token pattern in §1.
- Bindings that share a `namespace_id` share counters, even across Workers.
- No dashboard view: log 429s or emit events to Analytics Engine.
- **Plan and price:** the binding page and the Workers pricing page don't mention a plan restriction or a price, and the feature is GA. I found no explicit statement that it is on Free. Confirm with a `wrangler deploy` on the free account when building; the fallback is a DO or D1 counter.

**Fit.** Good for "N turns per session per minute" and "N contact sends per session per minute". It can't express "per day", and because it is per location and eventually consistent it can't be the global budget.

## 3. WAF rules on the Free plan

**Rate-limiting rules** ([Rate limiting rules][waf-rl], availability table):

| Free plan | Value |
|---|---|
| Rules | **1** |
| Fields in the rule expression | Path, Verified Bot |
| Counting characteristic | **IP only** |
| Counting period | **10 s** |
| Mitigation timeout | **10 s** |
| Custom counting expression | No |

**Custom rules** ([Custom rules][waf-custom]): 5 rules on Free, all actions except Log, no regex.

**Order of evaluation:** `http_request_firewall_custom` and then `http_ratelimit` run among the request phases ([Phases list][phases]). A Worker on a Custom Domain "is treated as an origin" ([Custom Domains][custom-domains]), so blocked requests never invoke the Worker and never count against its 100k/day. This is inferred from those two pages; confirm it in the dashboard analytics after deploying.

**Fit:**
- *Rate-limiting rule:* one path-scoped burst guard, e.g. more than 20 requests per 10 s from one IP to the agent's path, block for 10 s. It resists short floods, not slow sustained abuse. Cloudflare counts the IPs; we store none.
- *Custom rules:* cheap pre-filters that save Worker invocations, e.g. block anything that isn't `POST`/`OPTIONS` on the agent path, or block requests without the expected `Origin`. The `Origin` check is only a filter (§6).
- **Don't** use *Managed Challenge* on the API path: a `fetch()` can't show a challenge page, unless you adopt pre-clearance (§1).
- **Bot Fight Mode** (Free) "may challenge API … traffic" and "cannot be bypassed or skipped using WAF custom rules" ([Bot Fight Mode][bfm]). Leave it off on the zone, or at least test the agent endpoint with it on.
- Set `workers_dev = false` (as `workers/contacto/` already does) and `preview_urls = false` ([Wrangler configuration][wrangler-config]). The `*.workers.dev` and preview URLs don't pass through the zone's WAF rules.

## 4. Global daily budget

The budget has to be a *hard cap*, as OWASP LLM06:2026 puts it: "non-overridable budget ceilings … that halt inference when exceeded, rather than alerting thresholds" ([OWASP LLM Top 10 2026][owasp-2026], LLM06 #2). That needs an atomic read-modify-write.

| Store | Consistency | Free-plan limits | Verdict |
|---|---|---|---|
| **KV** | Eventually consistent: "up to 60 seconds or more" to reach other locations; **1 write/s to the same key**; "not ideal for … atomic operations" ([How KV works][kv-how], [KV limits][kv-limits]) | 100k reads/day, **1,000 writes/day**, 1 GB ([KV limits][kv-limits]) | **No** for counters |
| **D1** | Without read replication, every query goes to one primary instance ([Read replication][d1-rr]). SQLite applies one statement atomically, so `UPDATE budget SET used = used + ?1 WHERE day = ?2 AND used + ?1 <= ?3 RETURNING used` is race-free | 5M rows read/day, **100k rows written/day**, 500 MB/DB, 10 DBs, 5 GB/account, 50 queries per invocation ([D1 limits][d1-limits], [D1 pricing][d1-pricing]) | **Yes**, and it's the same store as the transcripts |
| **Durable Object** (SQLite-backed) | Globally unique, single-threaded instance with "transactional, and strongly consistent storage" ([What are DOs][do-what]) | Free is SQLite-backed only; **100k requests/day**, 13,000 GB-s/day, 5M rows read and 100k rows written per day, 5 GB total ([DO pricing][do-pricing], [DO limits][do-limits]) | **Yes**, and purpose-built, but it's one more moving part |

When any D1 or DO free limit is exceeded, "further operations of that type will fail with an error", and daily limits reset at 00:00 UTC ([DO pricing][do-pricing], [Workers pricing][w-pricing]). The failure mode is an error, never a bill. The Worker must treat a storage error as "budget exhausted" (fail closed) and show the graceful "unavailable, contact Victor" state.

**What to meter:** turns per day, plus tokens per day once the model is chosen (LLM06 #1: "tokens-per-minute, tokens-per-day, and estimated cost per request"). The model's free quota will almost certainly be the tightest limit; for comparison, Workers AI's free allocation is 10,000 Neurons/day ([Workers AI pricing][wai-pricing]). Set the cap below that quota, so the agent degrades on our terms instead of hitting the provider's error.

**Account-wide ceiling:** Workers Free allows **100,000 requests/day for the whole account**, resetting at midnight UTC. Past that, the Worker returns Error 1027 ("fail closed") or is bypassed ("fail open"), depending on the route setting ([Workers limits][w-limits]). `contacto` shares this quota, so an Ask Victor flood could take the contact form down. The WAF guard (§3) and the Turnstile gate protect it. Every request the Worker itself rejects still counts. The front end must handle a non-JSON 1027 page gracefully.

**Optional backstop:** AI Gateway's rate limiting and caching are free on all plans. It supports fixed or sliding windows, applied per gateway ([AI Gateway pricing][aig-pricing], [AI Gateway rate limiting][aig-rl]). It could act as a provider-side cap. Gateway logging would keep a second copy of prompts, though, so disable it or bring it under the same 30-day, IP-free rule.

## 5. Workers free-tier limits that shape the design

From [Workers limits][w-limits] (last updated 2026-09-05):

| Limit | Free | Design implication |
|---|---|---|
| Requests | 100,000/day per account (shared with `contacto`) | See §4 |
| CPU time | **10 ms** per HTTP request (an isolate tolerates occasional overruns) | Waiting on `fetch`/KV/D1 **doesn't count**. Streaming the LLM response through is fine. Avoid heavy JSON or schema work (the docs also recommend Zod ≥ 4.5.0 for memory) |
| Subrequests | **50** per invocation (1,000 to internal services) | Each agent step costs 1 LLM call plus tool, storage and siteverify calls. Cap steps per turn (LLM06 #9 "agentic circuit breakers") |
| Simultaneous waiting connections | 6 | Not a constraint for a sequential loop |
| Memory | 128 MB per isolate | Keep the knowledge context small |
| Duration | No wall-clock limit for HTTP; `waitUntil` ≤ 30 s after the response | Write transcripts in `ctx.waitUntil()` |
| Request body | **100 MB** (zone plan), else 413 | The zone limit is far too generous. **The Worker must reject bodies over a few KB** (check `Content-Length`, then read with a byte cap) and cap question length in characters (LLM06 #1 "input size validation") |
| URL / headers | 16 KB URL, 128 KB headers | — |
| Cron Triggers | 5 per account, 10 ms CPU each | One daily purge job is enough |

## 6. CORS and origin checks

- Browsers don't let scripts set `Origin` ([forbidden request header][mdn-forbidden]), but any non-browser client can send whatever `Origin` it likes. OWASP: "Don't rely only on the Origin header for Access Control checks … may be spoofed outside the browser" ([OWASP HTML5 Security Cheat Sheet][owasp-html5]).
- So an allowlist check is a cheap filter against casual cross-site embedding, not access control. Reply with an exact `Access-Control-Allow-Origin` taken from an allowlist, never `*` and never an echoed `Origin` (same source). Answer preflight `OPTIONS` requests too, and reuse the `ALLOWED_ORIGINS` pattern from `workers/contacto/src/`.
- The actual access control is the Turnstile-backed session token (§1) plus the rate limits.

## 7. The contact-request tool

From [Email Service send bindings][es-bindings] and [Email Service limits][es-limits]:
- `send_email` can be pinned with **`destination_address`**: "The binding can only send to the single destination address configured here." It can also be pinned with `allowed_sender_addresses`. Pinning puts the recipient in configuration, not in anything the model can influence (OWASP LLM01 #4, LLM03 #4, #7).
- "Sends to verified destination addresses are always free: they do not count toward your monthly quota or your daily sending limits, on any plan, including when only Email Routing is configured."
- Content limits for verified destinations: 50 recipients, 998-character subject, 25 MiB message, 16 KB of headers.
- Remaining risks are spam to Victor's inbox and header injection through the visitor's email or name (Reply-To). Mitigations:
  - The visitor must press Send, and the card shows the exact message (OWASP LLM01 #7).
  - Validate the email address and strip CR/LF in trusted code (LLM10 #1, #2).
  - Cap sends per session (e.g. 1–2) and per day (e.g. 10–20) with the D1 counter.
  - Verify a fresh Turnstile token for the send action itself (`action: "contact"`).

## 8. Prompt injection and off-topic misuse: current guidance

The primary source is the **OWASP Top 10 for LLM Applications 2026**, published 2026-08-03 ([resource page][owasp-2026-page], [PDF][owasp-2026]). The 2026 list:

1. LLM01 Prompt Injection
2. LLM02 Sensitive Information Disclosure
3. LLM03 Excessive Agency
4. LLM04 Supply Chain
5. LLM05 Data and Model Poisoning
6. LLM06 Unbounded Consumption
7. LLM07 Misinformation
8. LLM08 Hidden Context Exposure (covers what the 2025 list called System Prompt Leakage)
9. LLM09 Vector and Embedding Weaknesses
10. LLM10 Improper Output Handling

OWASP's own announcement notes that Excessive Agency rose to #3 on incident data ([announcement][owasp-2026-news]).

**Core position (LLM01):** "Prompt injection is intrinsic to current generative AI … no reliable prevention mechanism exists today … Defense is therefore architectural rather than interceptive". Design on the assumption that the instruction boundary will be bypassed, and limit what a fooled model can do.

**Where Ask Victor sits.** LLM01 #8 is Meta's "Rule of Two":
- (A) untrusted input: **yes**, public visitors.
- (B) sensitive data: **no**. The knowledge is the public portfolio and the public "about" file, and the map already treats everything the agent says as public.
- (C) state change or external communication: **yes, but narrow**. One email, fixed recipient, visitor-confirmed.

[A, C] "need an explicit residual-risk assessment". The residual risks are spam to one inbox and embarrassing off-topic text, and both are bounded below.

**Mitigations that apply to a small, tool-using agent** (OWASP 2026 item numbers in brackets):

| Risk | Mitigation for Ask Victor |
|---|---|
| Role override, off-topic use (LLM01 #1) | System prompt with declarative allow/deny rules ("answer only about Victor…"). OWASP calls this "a partial control only". Back it with the deterministic limits below |
| Excessive agency (LLM03 #1–#4, #6, #7, #9) | Minimal, fixed tools: lookup over bundled data, CV link, contact draft, unknown. No URL fetch, no open-ended tools. Strict argument schemas validated in code. The send happens only on the visitor's click. Rate-limit tool calls |
| Tool/structured output (LLM01 #2, LLM07 #6) | A strict output schema (answer, source line, action) validated in code before rendering; reject or retry on violation |
| Invisible-Unicode smuggling (LLM01 #5) | Strip tag-block U+E0000–E007F, variation selectors U+FE00–FE0F and zero-width U+200B/C/D and U+2060 on input and before rendering |
| Unbounded consumption (LLM06 #1, #2, #5, #9; scenario #8) | Input size cap. `max_tokens` cap. Max agent steps per turn. **Max turns per session**, because re-sending the growing context makes each turn cost more. Hard daily budget (§4). Graceful degradation |
| Hidden context exposure (LLM08 #1–#3) | Assume the system prompt is public (the repo is public anyway). No secrets in the prompt. No reliance on it for authorisation |
| Improper output handling (LLM10 #3, #6, #9) | Render model output as text, never raw HTML. **Don't auto-render Markdown images or link previews** (an exfiltration channel). Keep a strict CSP. Only the known CV links become clickable |
| Misinformation (LLM07 #1, #6, #9) | Ground answers in the portfolio data. Treat "unknown" as a required result instead of a guess (already decided on the map). Source line on every answer |
| Sensitive info (LLM02) | IP-free transcripts, 30-day purge, a privacy note. Don't log visitor emails beyond the send |
| Testing (LLM01 #11) | Put adaptive red-team prompts (injection, off-topic, jailbreaks in EN/ES and encodings) in the CI golden set. OWASP says static attack-success numbers mislead, so test against attackers who know the defence |

## 9. Where IP-free transcripts can live

| Store | Free limits | Retention mechanism | Fit |
|---|---|---|---|
| **D1** | 5 GB/account, 500 MB/DB, 100k rows written/day, 5M rows read/day ([D1 limits][d1-limits], [D1 pricing][d1-pricing]) | Daily Cron Trigger: `DELETE … WHERE created_at < now − 30 d`. Deletes count as rows written; index the timestamp. 7-day Time Travel on Free means deleted rows stay recoverable for about 7 days | **Recommended.** Queryable for review, and the same store as the budget counter. Rough size: 500 turns/day × ~4 KB ≈ 60 MB over 30 days |
| **KV** | 1,000 writes/day, 1 GB, 25 MiB per value ([KV limits][kv-limits]) | Native `expirationTtl` (≥ 60 s); expired keys are deleted and no longer billed ([KV write][kv-write]) | Works only if you write once per conversation; the 1k writes/day would cap conversations. Can't be queried |
| **R2** | 10 GB-month, 1M Class A and 10M Class B operations/month ([R2 pricing][r2-pricing]); lifecycle rules delete objects after N days, usually within 24 h ([R2 lifecycles][r2-lifecycle]) | Lifecycle rule | **Excluded.** Turning R2 on requires a payment method even for the free tier. Community-sourced, not stated on the R2 docs pages ([forum thread][r2-card-1], [forum thread][r2-card-2]). This conflicts with the "no card on file" rule |
| **DO SQLite** | Same row quotas as D1, 5 GB ([DO pricing][do-pricing]) | Alarm-based purge (at-least-once, one alarm per object) ([Alarms][do-alarms]) | Possible, but D1 is simpler for a queryable log |

Stay IP-free by never reading `CF-Connecting-IP` into a transcript and not passing `remoteip` to siteverify. Workers Logs and AI Gateway logs, if enabled, need the same review.

---

## Recommended control stack (in request order)

1. **Zone:** `workers_dev = false`, `preview_urls = false`. Bot Fight Mode off, or tested. One WAF rate-limiting rule on the agent path (IP, 10 s). Custom rules blocking wrong methods, wrong paths and foreign `Origin`.
2. **Worker entry:** exact-origin CORS; body-size and question-length caps.
3. **Session:** a Turnstile token (Managed or Invisible, `action` fixed) verified once through siteverify, checking hostname and action → an HMAC session token with an expiry.
4. **Per session:** the Rate Limiting binding (turns per 60 s, sends per 60 s), plus a max turns per session stored with the session.
5. **Global:** a D1 atomic counter for turns and tokens per UTC day, and contact sends per day. Fail closed with graceful copy. The cap sits well below the model's free quota and the 100k/day account limit.
6. **Agent loop:** minimal tools with schema-validated arguments; max steps per turn; `max_tokens`; invisible-Unicode stripping; schema-validated output; text-only rendering.
7. **Contact:** `send_email` pinned with `destination_address`; the visitor confirms the exact message; a fresh Turnstile token (`action: contact`); email validation and CR/LF stripping.
8. **Storage:** IP-free transcript rows in D1 written through `waitUntil`; a daily cron purge after 30 days.
9. **CI:** golden set plus adaptive injection and off-topic evals.

## Open items to verify during the build

- The Rate Limiting binding deploys on the free account (§2).
- WAF-blocked requests don't appear as Worker invocations (§3).
- The fail-open/closed behaviour for a **Custom Domain** Worker at the 100k/day limit (the docs describe the toggle for routes) (§4).

---

## Sources

[ts-plans]: https://developers.cloudflare.com/turnstile/plans/
[ts-widget]: https://developers.cloudflare.com/turnstile/concepts/widget/
[ts-siteverify]: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
[ts-preclear]: https://developers.cloudflare.com/turnstile/additional-configuration/hostname-management/pre-clearance/
[cf-clearance]: https://developers.cloudflare.com/cloudflare-challenges/concepts/clearance/
[rl-binding]: https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
[rl-ga]: https://developers.cloudflare.com/changelog/post/2025-09-19-ratelimit-workers-ga/
[waf-rl]: https://developers.cloudflare.com/waf/rate-limiting-rules/
[waf-custom]: https://developers.cloudflare.com/waf/custom-rules/
[phases]: https://developers.cloudflare.com/ruleset-engine/reference/phases-list/
[custom-domains]: https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
[bfm]: https://developers.cloudflare.com/bots/get-started/bot-fight-mode/
[wrangler-config]: https://developers.cloudflare.com/workers/wrangler/configuration/
[w-limits]: https://developers.cloudflare.com/workers/platform/limits/
[w-pricing]: https://developers.cloudflare.com/workers/platform/pricing/
[kv-how]: https://developers.cloudflare.com/kv/concepts/how-kv-works/
[kv-limits]: https://developers.cloudflare.com/kv/platform/limits/
[kv-write]: https://developers.cloudflare.com/kv/api/write-key-value-pairs/
[d1-limits]: https://developers.cloudflare.com/d1/platform/limits/
[d1-pricing]: https://developers.cloudflare.com/d1/platform/pricing/
[d1-rr]: https://developers.cloudflare.com/d1/best-practices/read-replication/
[do-what]: https://developers.cloudflare.com/durable-objects/concepts/what-are-durable-objects/
[do-pricing]: https://developers.cloudflare.com/durable-objects/platform/pricing/
[do-limits]: https://developers.cloudflare.com/durable-objects/platform/limits/
[do-alarms]: https://developers.cloudflare.com/durable-objects/api/alarms/
[r2-pricing]: https://developers.cloudflare.com/r2/pricing/
[r2-lifecycle]: https://developers.cloudflare.com/r2/buckets/object-lifecycles/
[r2-card-1]: https://community.cloudflare.com/t/if-i-want-to-use-cloudflare-r2-i-have-to-link-a-payment-method-i-suggest-not-doin/887578
[r2-card-2]: https://community.cloudflare.com/t/why-using-r2-free-tier-involves-giving-card-info/945179
[wai-pricing]: https://developers.cloudflare.com/workers-ai/platform/pricing/
[aig-pricing]: https://developers.cloudflare.com/ai-gateway/reference/pricing/
[aig-rl]: https://developers.cloudflare.com/ai-gateway/features/rate-limiting/
[es-bindings]: https://developers.cloudflare.com/email-service/configuration/send-bindings/
[es-limits]: https://developers.cloudflare.com/email-service/platform/limits/
[mdn-forbidden]: https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_request_header
[owasp-html5]: https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html
[owasp-2026-page]: https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/
[owasp-2026]: https://genai.owasp.org/download/56857/?tmstv=1785822482
[owasp-2026-news]: https://genai.owasp.org/2026/09/01/owasp-genai-security-project-unveils-2026-top-10-for-llm-applications-new-agent-control-standard-and-sponsors-as-community-tops-30000-members/

- Cloudflare Turnstile: [plans][ts-plans] · [widget types][ts-widget] · [server-side validation][ts-siteverify] · [pre-clearance configuration][ts-preclear] · [clearance][cf-clearance]
- Workers: [limits][w-limits] · [pricing][w-pricing] · [Rate Limiting binding][rl-binding] · [GA changelog][rl-ga] · [Custom Domains][custom-domains] · [Wrangler configuration][wrangler-config]
- WAF & bots: [rate limiting rules][waf-rl] · [custom rules][waf-custom] · [phases list][phases] · [Bot Fight Mode][bfm]
- Storage: [KV how it works][kv-how] · [KV limits][kv-limits] · [KV write/expiration][kv-write] · [D1 limits][d1-limits] · [D1 pricing][d1-pricing] · [D1 read replication][d1-rr] · [DO overview][do-what] · [DO pricing][do-pricing] · [DO limits][do-limits] · [DO alarms][do-alarms] · [R2 pricing][r2-pricing] · [R2 lifecycles][r2-lifecycle]
- R2 payment-method requirement (community, lower trust): [thread 1][r2-card-1] · [thread 2][r2-card-2]
- AI: [Workers AI pricing][wai-pricing] · [AI Gateway pricing][aig-pricing] · [AI Gateway rate limiting][aig-rl]
- Email: [send bindings][es-bindings] · [Email Service limits][es-limits]
- Web/OWASP: [MDN forbidden request header][mdn-forbidden] · [OWASP HTML5 Security Cheat Sheet][owasp-html5] · [OWASP LLM Top 10 2026 page][owasp-2026-page] · [PDF][owasp-2026] · [announcement][owasp-2026-news]
