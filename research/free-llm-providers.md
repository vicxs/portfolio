# Free LLM providers under a hard $0 cap

Research for [#32](https://github.com/vicxs/portfolio/issues/32), part of the map [#31](https://github.com/vicxs/portfolio/issues/31) (Ask Victor). It feeds [#38](https://github.com/vicxs/portfolio/issues/38), which picks the model and provider.

- **Checked:** 2026-09-26.
- **Sources:** primary only (official docs, pricing pages, rate-limit pages, terms, changelogs). Each claim links to its source.
- **Marked estimates:** figures labelled *(est.)* are my own arithmetic, not provider numbers.
- **Marked gaps:** anything labelled **Unverified** could not be confirmed on a primary page.

**Question.** Which providers and models can run Ask Victor for $0, with no card on file that could ever be charged? How do they compare on free quota, what happens at exhaustion, tool calling, English and Spanish, latency and streaming, terms, and free-tier stability?

---

## TL;DR

- **Primary: Cloudflare Workers AI on the Workers Free plan.**
  - Once the free 10,000 neurons/day are used up, calls fail with `429 / 3036`. They are never billed.
  - It runs inside the same Worker, with no API key and no outbound hop.
  - Cloudflare doesn't train on customer content.
  - Several models on the Free plan support function calling and Spanish.
  - Capacity is roughly **40–260 agent turns/day** *(est.)*, depending on the model.
- **Fallback: Mistral "Free mode"**, with Mistral Small 4.
  - No card needed. It includes **$10/month of API credit**, roughly **12,000 turns/month** on Small 4 *(est.)*.
  - Mistral is an EU company with strong Spanish.
  - Tool calling is native.
  - Training on your data can be switched off (one toggle).
  - With pay-as-you-go off and no card, requests simply stop when the credit runs out.
  - **Condition:** check the Free-mode rate limits and allowed models in the Mistral Admin Panel. They are shown only after login.
  - **Backup fallback if Mistral fails that check:** Groq Free with `openai/gpt-oss-120b`. Its limits are verified, but tight (~36 turns/day).
- **Rejected:**
  - **Gemini free tier:** its terms forbid serving users in the EEA, Switzerland or the UK from the free tier.
  - **Cerebras:** it has no free tier any more; a card is required before the API works.
  - **OpenRouter `:free`:** allowed, but capped at 50 requests/day, and the free catalog changes all the time. Keep it only as a last resort.
- **Design implications:**
  - Put a single OpenAI-shaped chat-completions adapter in front of both providers. Every provider in this list has swapped out free models within months.
  - Keep a **daily budget counter in the Worker** set below every provider quota. Abuse then burns our counter first, and the UI degrades to "offer a contact request / come back tomorrow".
  - Don't let CI evals share the production quota blindly.

## Comparison

| | **Cloudflare Workers AI** | **Mistral Free mode** | **Groq Free** | **OpenRouter `:free`** | **Gemini free tier** | **Cerebras** |
|---|---|---|---|---|---|---|
| Card needed | No¹ | No | No | No | No | **Yes** (verified payment method before API access) |
| Free quota | 10,000 neurons/day per account; 300 req/min | $10/month credit; RPS, TPM and tokens/month limits not published² | Per model: 30 RPM, 1K RPD, 8K TPM, 200K TPD | 20 req/min, **50 req/day** | Not published (AI Studio only); cut ~92% without notice in Dec 2025 | Trial only: $5 credit, expires in 30 days |
| At exhaustion | 429 / 3036, fails | 429; stops until next period if PAYG off | 429 with `retry-after` | 429 | 429 | 429; access stops |
| Can it ever charge? | Only if you move to Workers Paid or buy AI Gateway credits | Only if you enable PAYG with a payment method | Only if you upgrade to Developer (card) | Only if you buy credits or turn on auto-recharge | Only if you link a billing account | Card on file (prepaid, auto-recharge off by default) |
| Tool calling | Yes, on Llama 3.3 70B, Llama 4 Scout, Mistral Small 3.1, gpt-oss, GLM-4.7-Flash, Qwen3, Gemma 4, … | Yes (Small 4, Medium 3.5, Large 3); `tool_choice`, parallel calls | Yes, all models; gpt-oss has no parallel calls | Yes, 18 of 21 free models | Yes | Yes (strict mode, parallel calls) |
| Spanish | Official on Llama 3.3/4 and Mistral Small 3.1; Gemma 4 covers 140+ languages | Official "strong expected performance" | gpt-oss MMMLU ES ~85%, but trained on a "mostly English" dataset | Depends on the model (Gemma 4: 140+ languages) | Good (no current official list) | gpt-oss |
| Latency / streaming | SSE; no official speed figures | SSE | SSE; ~500 tok/s (120b) | SSE; free endpoints "may have higher latency" | SSE; thinking on by default | SSE; ~3000 tok/s |
| Trains on inputs | **No** | Yes by default in Free mode; **opt-out** toggle | **No** | Depends on the upstream provider; can be blocked | Yes on free tier (EEA developers exempt) | No |
| Public-facing use | Allowed | Allowed by the terms; docs call Free mode "evaluation and prototyping" | Allowed; AUP names employment as high-risk | Allowed | **Forbidden for EEA/CH/UK users on free** | Allowed |
| Stability | Moved 3 models to Paid-only in Jul 2026; catalog cleaned out in May 2026 | Free tier since Sep 2024; no sudden cuts found | Removed ~10 free models in 2026, some with 17–30 days' notice | "Changes frequently"; 70+ models pulled | Cut without notice (Dec 2025) | Free tier removed in 2026 |

¹ No primary page says "no credit card required" for Workers Free, but the account can only be billed after an upgrade to Workers Paid. See the Cloudflare section.
² The limits are shown only in Admin Panel › API › Limits after login.

---

## 1. Cloudflare Workers AI

### Free quota
- **Daily allocation:** "10,000 Neurons per day at no charge". It is shared across all models in the account and resets at 00:00 UTC. [pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- **Per-minute limit:** 300 req/min by default for text generation. "Beta models may have lower limits." [limits](https://developers.cloudflare.com/workers-ai/platform/limits/)

### What happens at exhaustion
- **Free plan:** "further operations will fail with an error". [pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- **Error returned:** `429`, code `3036` "Account limited: You have used up your daily free allocation of 10,000 neurons…". [errors](https://developers.cloudflare.com/workers-ai/platform/errors/)
- **Other errors to handle:**
  - `429 / 3040` "Out of capacity", which is transient.
  - `403 / 5035` "Model requires Workers Paid plan".
- **History:** the hard stop on Free has been documented since GA in April 2024 ("Workers Free customers will encounter a hard rate limit after 10,000 neurons in 24 hours"). [blog](https://blog.cloudflare.com/workers-ai-ga-huggingface-loras-python-support/)

### Can it ever charge?
No, as long as the account meets both conditions:
- It stays on **Workers Free**. Workers Paid starts at $5/month, then $0.011 per 1,000 neurons. [workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- It never buys **prepaid AI Gateway (Unified Billing) credits**. [AI Gateway pricing](https://developers.cloudflare.com/ai-gateway/reference/pricing/)

The guarantee comes from the plan, not from having no card. A card saved on the Cloudflare account for something else (a domain, say) doesn't turn on Workers AI billing, as far as the docs show. **Unverified:** a primary-page sentence saying Workers Free needs no card.

### Paid-only models (off limits)
- **The list:** `kimi-k2.6`, `kimi-k2.7-code`, `glm-5.2`, `glm-5.3`, `glm-5.3-flash`, `deepseek-v4-flash-0731`, `deepseek-v4-pro-0813`.
- **How the list grew:**
  - On 2026-07-28, Cloudflare moved Kimi K2.6/K2.7 and GLM-5.2 off Free "so we can prioritize capacity". [changelog](https://developers.cloudflare.com/changelog/post/2026-07-28-models-require-workers-paid/)
  - The August 2026 launches (DeepSeek V4, GLM-5.3) were Paid-only from the start. [changelog](https://developers.cloudflare.com/changelog/product/workers-ai/)

### Function-calling models available on Free
Each model page lists "Function calling: Yes". Neuron prices per 1M tokens come from the [pricing page](https://developers.cloudflare.com/workers-ai/platform/pricing/).

| Model | Context | Neurons/M in | Neurons/M out | Turns/day *(est.)* |
|---|---|---|---|---|
| [`@cf/meta/llama-3.3-70b-instruct-fp8-fast`](https://developers.cloudflare.com/workers-ai/models/llama-3.3-70b-instruct-fp8-fast/) | 24K | 26,668 | 204,805 | ~42 |
| [`@cf/meta/llama-4-scout-17b-16e-instruct`](https://developers.cloudflare.com/workers-ai/models/llama-4-scout-17b-16e-instruct/) | 131K | 24,545 | 77,273 | ~62 |
| [`@cf/mistralai/mistral-small-3.1-24b-instruct`](https://developers.cloudflare.com/workers-ai/models/mistral-small-3.1-24b-instruct/) | 128K | 31,876 | 50,488 | ~54 |
| [`@cf/openai/gpt-oss-120b`](https://developers.cloudflare.com/workers-ai/models/gpt-oss-120b/) | 128K | 31,818 | 68,182 | ~52 (fewer once reasoning tokens count) |
| [`@cf/openai/gpt-oss-20b`](https://developers.cloudflare.com/workers-ai/models/gpt-oss-20b/) | 128K | 18,182 | 27,273 | ~95 |
| [`@cf/google/gemma-4-26b-a4b-it`](https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/) | 256K | 9,091 | 27,273 | ~169 |
| [`@cf/zai-org/glm-4.7-flash`](https://developers.cloudflare.com/workers-ai/models/glm-4.7-flash/) | 131K | 5,500 | 36,400 | ~219 |
| [`@cf/qwen/qwen3-30b-a3b-fp8`](https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/) | 32K | 4,625 | 30,475 | ~260 |
| [`@cf/qwen/qwen3.8-27b`](https://developers.cloudflare.com/workers-ai/models/qwen3.8-27b/) | 262K | 40,909 | 290,909 | ~28 |
| [`@cf/nvidia/nemotron-3-120b-a12b`](https://developers.cloudflare.com/workers-ai/models/nemotron-3-120b-a12b/) | 256K | 45,455 | 136,364 | ~34 |

*(est.)* One user turn is taken as 2 LLM calls (a tool call, then the answer), each with about 2,500 input and 250 output tokens. A bigger "about" file or longer threads scale input tokens and cut these numbers.

### Tool-calling reliability
- **What the docs cover:** "traditional" function calling, and "embedded" calling via `@cloudflare/ai-utils` `runWithTools`. They name no recommended current model. [function calling](https://developers.cloudflare.com/workers-ai/features/function-calling/)
- **Fixes on 2026-02-17:**
  - Multi-turn tool round-trips "now work correctly". The binding had been rejecting `tool_call_id` values it generated itself.
  - gpt-oss gained the Chat Completions format.
  - [changelog](https://developers.cloudflare.com/workers-ai/changelog/), [OpenAI compatibility](https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/)
- **JSON mode** isn't guaranteed and doesn't stream. [JSON mode](https://developers.cloudflare.com/workers-ai/features/json-mode/)

### Spanish
From the official model cards:
- **Llama 3.3 70B:** Spanish is one of 8 supported languages. [card](https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct)
- **Llama 4 Scout:** one of 12. [card](https://huggingface.co/meta-llama/Llama-4-Scout-17B-16E-Instruct)
- **Mistral Small 3.1:** Spanish is listed, and the card calls it "excellent at function / tool calling". [card](https://huggingface.co/mistralai/Mistral-Small-3.1-24B-Instruct-2503)
- **Gemma 4:** "over 140 languages". [card](https://ai.google.dev/gemma/docs/core/model_card_4)
- **GLM-4.7-Flash:** "multi-turn tool calling across 100+ languages". [page](https://developers.cloudflare.com/workers-ai/models/glm-4.7-flash/)
- **gpt-oss:** trained on a "mostly English, text-only dataset" ([OpenAI](https://openai.com/index/introducing-gpt-oss/); read from a search snippet because the page blocked fetching).

### Latency and streaming
- All the models above stream over SSE (`stream: true`).
- `rejectIfBusy` (2026-09-17) makes a request fail fast when capacity is short, instead of queueing. That suits a fallback design. [changelog](https://developers.cloudflare.com/changelog/product/workers-ai/)
- Cloudflare publishes no latency figures.

### Terms and data
- **Training:** "Cloudflare does not use your Customer Content to (1) train any AI models … or (2) improve any Cloudflare or third-party services". [data usage](https://developers.cloudflare.com/workers-ai/platform/data-usage/)
- **Public-facing use:** no restriction found. Third-party model licenses, such as Meta's Llama license, still apply. [service-specific terms](https://www.cloudflare.com/service-specific-terms-developer-platform/)

### AI Gateway (free on all plans)
- **Rate limiting:** fixed or sliding window, returning 429. It adds a second abuse throttle. [rate limiting](https://developers.cloudflare.com/ai-gateway/features/rate-limiting/)
- **Caching:** exact-match only, TTL from 60 s to 1 month. **Unverified:** whether streamed responses are cached. [caching](https://developers.cloudflare.com/ai-gateway/features/caching/)
- **Analytics** are included.
- **Logs:** Free-plan gateways created before 2026-09-24 are capped at 100k logs in total. Newer ones follow Workers Logs pricing. [pricing](https://developers.cloudflare.com/ai-gateway/reference/pricing/)

### Stability
- **Catalog refresh on 2026-05-08:** Llama 3/3.1 8B, Llama 3.1 70B, Mistral 7B, Gemma 3 12B, Hermes 2 Pro, Kimi K2.5 and others were deprecated by 2026-05-30. [changelog](https://developers.cloudflare.com/workers-ai/changelog/)
- **Paid-only moves:** see the 2026-07-28 changelog above.
- **The core promise has held since 2024:** 10k neurons/day free, hard stop on Free.

---

## 2. Mistral Free mode (La Plateforme / Mistral Studio)

### Requirements
- **No card:** "Free mode: API access is enabled by default with no credit card required. Usage and rate limits apply." [quickstart](https://docs.mistral.ai/getting-started/quickstarts/studio/activate-and-generate-api-key)
- **Contradiction:** the [Additional Product Terms](https://legal.mistral.ai/terms/additional-terms) (effective 2026-09-25) mention "a valid method of payment" for a Customer Account. The docs say no card; treat the docs as describing Free mode.
- **Unverified:** whether phone verification is needed.

### Free quota
- **Included credit:** "$10/mo in API credits" on the Free plan. [pricing](https://mistral.ai/pricing)
- **Shared allowance:** the credit "is shared across Studio, the API, and Vibe Code". Other Mistral use on the same account eats into the chatbot's budget. [subscriptions](https://docs.mistral.ai/admin/billing-usage/subscriptions)
- **Rate limits:** RPS, tokens/minute and tokens/month, set per organization.
  - "Free mode (the default) has the lowest limits, intended for evaluation and prototyping." [help](https://help.mistral.ai/en/articles/698531-why-am-i-hitting-api-rate-limits-and-how-do-i-increase-them)
  - **Unverified:** the numbers, which are shown only in Admin Panel › API › Limits. [usage limits](https://docs.mistral.ai/admin/billing-usage/usage-limits)
- **Capacity *(est.)*:**
  - [Mistral Small 4](https://docs.mistral.ai/models/mistral-small-4-0-26-03) costs $0.15/$0.60 per 1M tokens. A turn of about 4K in and 300 out costs about $0.0008, so $10 is ~12,000 turns/month.
  - [Medium 3.5](https://docs.mistral.ai/models/mistral-medium-3-5-26-04) costs $1.50/$7.50, so $10 is ~1,200 turns/month.

### What happens at exhaustion, and can it charge?
- **Rate limit hit:** 429.
- **Credit used up:** "If pay-as-you-go is enabled, additional usage is billed per token. If it is not enabled, usage can stop until the next billing period." [subscriptions](https://docs.mistral.ai/admin/billing-usage/subscriptions)
- **No payment method:** `402 Payment Required: No payment method on account`. [errors](https://docs.mistral.ai/getting-started/quickstarts/developer/first-api-request)
- **State that guarantees $0:** Free mode, pay-as-you-go off, no payment method on file.

### Tool calling, Spanish, streaming
- **Tool calling:** Small 4 and Medium 3.5 support function calling and structured outputs. `tool_choice` takes auto/any/none, and `parallel_tool_calls` can be set. [function calling](https://docs.mistral.ai/capabilities/function_calling)
- **Unverified:** which models Free mode allows.
- **Spanish:** "strong expected performance". [languages](https://docs.mistral.ai/resources/languages)
- **Streaming:** SSE, ending with `data: [DONE]`. [chat API](https://docs.mistral.ai/api/endpoint/chat)
- **Latency:** Small 4 has `reasoning_effort: "none"` for fast replies, and Mistral claims 40% lower end-to-end time than Small 3. No absolute numbers are published. [announcement](https://mistral.ai/news/mistral-small-4/)

### Terms and training
- **Free mode may train:** "we may use your data (input and output) to train our artificial intelligence models. You have the right to opt out". [help](https://help.mistral.ai/en/articles/347617-do-you-use-my-user-data-to-train-your-artificial-intelligence-models)
- **How to opt out:** Admin › Privacy › "Anonymous improvement data". [opt-out](https://help.mistral.ai/en/articles/455207-can-i-opt-out-of-my-input-or-output-data-being-used-for-training)
- **Always trained on:** Labs and Preview models are trained on regardless of opt-out (Commercial ToS §4.2(d)), so avoid `labs-*` models. [ToS](https://legal.mistral.ai/terms/commercial-terms-of-service)
- **Public-facing use:** the ToS defines a "Customer Offering" made available to third parties, so serving the public is covered. No ToS clause limits Free mode to prototyping; that framing appears only in the docs and help center.
- **Suspension:** Mistral may suspend at its "business judgment".

### Stability
- The free tier has existed since [September 2024](https://mistral.ai/news/september-24-release/) as "Experiment" and is now "Free mode" with $10/month credit.
- No sudden cuts were found. Small 3.2 and Medium 3.1 were retired in July/August 2026, each with a successor. [models](https://docs.mistral.ai/models)

---

## 3. Groq (GroqCloud Free)

### Free quota
Per model, at the organization level. [rate limits](https://console.groq.com/docs/rate-limits)

| Model | RPM | RPD | TPM | TPD |
|---|---|---|---|---|
| `openai/gpt-oss-120b` | 30 | 1K | 8K | 200K |
| `openai/gpt-oss-20b` | 30 | 1K | 8K | 200K |
| `qwen/qwen3.8-27b` (Preview) | 30 | 1K | 8K | 200K |

- **Cached tokens don't count** toward the limits. Prompt caching is on for gpt-oss.
- **Capacity *(est.)*:** about 1 turn/minute and ~36 turns/day, more with caching.
- **No Llama chat models** are on the free table any more.

### What happens at exhaustion, and can it charge?
- **At exhaustion:** 429 with `retry-after` and `x-ratelimit-*` headers.
- **Card:** a payment method is needed only to upgrade to Developer, which then bills progressively and charges the card automatically. [billing FAQ](https://console.groq.com/docs/billing-faqs)
- **State that guarantees $0:** Free plan, no payment method.

### Tool calling and speed
- **Tool calling:** "All models hosted on Groq support tool use". gpt-oss has **no parallel tool calls**. [tool use](https://console.groq.com/docs/tool-use)
- **Speed:** gpt-oss-120b runs at ~500 tok/s, and responses stream over SSE. [models](https://console.groq.com/docs/models)

### Spanish
- **gpt-oss-120b:** MMMLU 81.3% averaged over 81+ languages. [card](https://console.groq.com/docs/model/openai/gpt-oss-120b)
- **Preview models:** "may be discontinued without notice".

### Terms and data
- **Training:** "Groq is not permitted to use Inputs or Outputs for training". [services agreement](https://console.groq.com/docs/legal/services-agreement)
- **Retention:** nothing is retained by default; logs may be kept up to 30 days for abuse monitoring. [your data](https://console.groq.com/docs/your-data)
- **Public-facing use:** allowed; you may serve "End Users".
- **Employment is named as high-risk:** the [AI policy](https://console.groq.com/docs/legal/ai-policy) lists it as a high-risk domain that needs human oversight. Ask Victor answers questions and makes no hiring decision, but this is worth noting.

### Stability
Poor. Per the [deprecations page](https://console.groq.com/docs/deprecations), 2026 removals include:
- **Feb–Apr:** Llama Guard 4, Llama 4 Maverick and Kimi K2, with 17–23 days' notice.
- **Jun–Aug:** Qwen3 32B, Llama 4 Scout, Llama 3.1 8B and Llama 3.3 70B, all taken off Free and Developer.
- **Sep:** Compound and Compound Mini.

---

## 4. OpenRouter `:free`

### Free quota
[limits](https://openrouter.ai/docs/api_reference/limits)
- **Base limits:** 20 req/min and **50 req/day** for accounts that have bought less than $10 of credit in total. Buying $10 raises this to 1,000/day, but needs a card.
- **Multiple accounts:** the ToS forbids them for getting around limits. [terms](https://openrouter.ai/terms)

### What happens at exhaustion, and can it charge?
- **At exhaustion:** 429. If it happens mid-stream, the error arrives as an SSE event with `finish_reason: "error"` after a 200 status.
- **Charging:** only through credit purchases or opt-in auto-recharge. [FAQ](https://openrouter.ai/docs/faq)
- **Negative balance:** returns 402, "including for free models".
- **Hardening:** new accounts get a small free allowance. So only ever send `:free` model IDs, and restrict the key with [Guardrails](https://openrouter.ai/docs/guides/features/guardrails).

### Tool-capable free models
- **Count:** 18 of 21 as of 2026-09-26 (live `/api/v1/models`).
- **Declared non-training endpoints:**
  - `google/gemma-4-31b-it:free` and `google/gemma-4-26b-a4b-it:free` (served by Google AI Studio, prompts kept 55 days)
  - `qwen/qwen3.8-27b:free`
- **Upstream trains on inputs:** the NVIDIA Nemotron, Thinking Machines, Poolside and Liquid free endpoints. With "allow training" off, OpenRouter won't route to them and the request errors. [provider logging](https://openrouter.ai/docs/guides/privacy/provider-logging)
- **Per-request control:** `provider.data_collection: "deny"`. [provider selection](https://openrouter.ai/docs/guides/routing/provider-selection)

### Stability
- The docs say "Free model availability changes frequently". [free router](https://openrouter.ai/docs/guides/routing/routers/free-router)
- The FAQ calls free models "usually not suitable for production use".
- OpenRouter's own blog counts 70+ models pulled. [blog](https://openrouter.ai/blog/tutorials/keep-your-agent-running-when-models-disappear/)

### Terms
- Embedding the service in your own products is allowed (§5.1).
- You are liable for your end users following each model's terms. [terms](https://openrouter.ai/terms)

---

## 5. Google Gemini API free tier. Rejected

- **Why rejected: the EEA clause.** From the [terms](https://ai.google.dev/gemini-api/terms), effective 2026-03-23: "**You may use only Paid Services when making API Clients available to users in the European Economic Area, Switzerland, or the United Kingdom.**"
  - Ask Victor serves recruiters in Spain and the EU, so the free tier is ruled out whatever the quota.
  - The EEA carve-out ("Paid Services" data terms apply to EEA developers on free quota) only covers how Google uses the developer's data. It doesn't lift the rule on serving EEA users.
  - The terms also say users must be 18+, and the service is "for professional or business purposes, not for consumer use".
- **Other facts, for completeness:**
  - **Free models:** Gemini 3.8 Flash and 3.5 Flash-Lite are free. New projects can't use 2.5. [pricing](https://ai.google.dev/gemini-api/docs/pricing), [models](https://ai.google.dev/gemini-api/docs/models)
  - **Limits:** per-model numbers are no longer published; they show in AI Studio only. [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
  - **At exhaustion:** 429, and no charge without a linked billing account. [billing](https://ai.google.dev/gemini-api/docs/billing)
  - **Training:** the free tier trains on inputs, and humans may review them.
- **Stability:** Flash free quota was cut from 250 to 20 RPD with no notice in December 2025. Google said the free tier is for testing and they "need to act quickly". [Google forum](https://discuss.ai.google.dev/t/do-they-really-think-we-wouldnt-notice-a-92-free-tier-quota/111262)
- **Regions:** requests from unsupported regions fail with "User location is not supported". This is a Worker egress risk.

## 6. Cerebras. Rejected

- **No free tier:**
  - "New accounts receive $5 in free credits **after adding a verified payment method**. These credits expire 30 days after they're granted."
  - "If you skip adding a payment method at sign-up, Playground and API access remain inactive."
  - "Is there a permanently free tier? **No.**"
  - Source: [rate limits / FAQ](https://inference-docs.cerebras.ai/support/rate-limits)
- **For reference:**
  - **Models:** only `gpt-oss-120b` (~3000 tok/s) and `qwen-3.8-27b` remain on shared inference. [models](https://inference-docs.cerebras.ai/models/overview)
  - **Tool calling:** strong. [tool use](https://inference-docs.cerebras.ai/capabilities/tool-use)
  - **Training:** none on inputs. [terms](https://cloud.cerebras.ai/terms)
- **History:** the no-card free tier was still described in mid-2026 and has since been removed. **Unverified:** the exact date.

---

## Recommendation for #38

### Primary: Workers AI through the Worker's `AI` binding
- **Account state:** stay on Workers Free, with no AI Gateway credits.
- **Model shortlist for the eval set to decide between:**
  - **`@cf/mistralai/mistral-small-3.1-24b-instruct`:** official Spanish support, a card that stresses tool calling, ~54 turns/day.
  - **`@cf/google/gemma-4-26b-a4b-it`:** 140+ languages, ~169 turns/day.
  - **`@cf/meta/llama-3.3-70b-instruct-fp8-fast`:** official Spanish support, the strongest general model, but only ~42 turns/day and a 24K context.
  - Avoid gpt-oss as the primary; its training data is mostly English.

### Fallback: Mistral Free mode with `mistral-small-2603` (Small 4)
- **When to switch:** Workers AI returns `3036` (daily allocation used), `3040` (out of capacity) or `5035` (model moved to Paid).
- **Account setup:** no payment method, pay-as-you-go off, "Anonymous improvement data" off, no `labs-*` models.
- **Before building:** Victor checks Admin Panel › API › Limits and confirms Small 4 is allowed in Free mode.
- **If it isn't:** use Groq Free with `openai/gpt-oss-120b`.

### Guard rails that make $0 hold under abuse
1. **A Worker-side daily budget** (per-visitor and global), kept in a Durable Object or KV counter and set below the smallest provider quota. When it runs out, the agent returns "unknown / leave a contact request" instead of calling a model.
2. **AI Gateway rate limiting** as a second layer; it is free.
3. **One adapter shaped like OpenAI chat completions**, so a model or provider swap is a config change. Every provider here removed or repriced free models in 2026.
4. **CI evals run against a separate provider or account, or a small nightly sample.** Otherwise they spend the same 10k neurons/day that visitors rely on.

## Open items (unverified)

- A primary-page statement that Workers Free or Groq Free needs no card. Both are strongly implied by the billing docs.
- Mistral Free-mode rate limits, the models Free mode allows, and whether phone verification is needed.
- Gemini per-model free limits (a moot point given the EEA clause).
- Whether AI Gateway caches streamed responses.
- Official Spanish statements for Qwen 3.8 and Nemotron.
- The date Cerebras dropped its free tier.
