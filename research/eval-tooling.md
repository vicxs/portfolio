# Eval tooling for CI at $0

Research for [#35](https://github.com/vicxs/portfolio/issues/35), part of the Ask Victor map [#31](https://github.com/vicxs/portfolio/issues/31). Checked on 2026-09-26 against official docs, source code and npm metadata. Suite *contents* (categories, size, thresholds) belong to [#41](https://github.com/vicxs/portfolio/issues/41). This note covers the tooling and how to keep the suite from being flaky.

## Answer

**Use the plain Node test runner (`node:test`, already in the repo) with our own scorers, split into two tiers:**

1. **Replay tier: runs on every PR and blocks merges.** It feeds recorded model responses, committed to the repo, through the real agent loop and scores the structured result with code. It makes no network calls, so it can't be flaky and costs $0.
2. **Live tier: runs on a schedule and on manual dispatch, and does not block.** It calls the real free model with repeated trials, explicit pass thresholds, and a binary LLM judge only for the few criteria code can't check. When the provider runs out of free quota, the run is reported as skipped, not failed.

promptfoo is the strongest off-the-shelf option. It's worth a second look only if we later want its web viewer or red-team generators. Evalite is not a fit today (see comparison).

## Facts that shape the decision

- **Temperature 0 does not make runs repeatable.** Claude's docs: "even with temperature 0.0, the results will not be fully deterministic" ([glossary](https://platform.claude.com/docs/en/about-claude/glossary)). Thinking Machines Lab traced the root cause to server-side batching: "the primary reason nearly all LLM inference endpoints are nondeterministic is that the load (and thus batch-size) nondeterministically varies" ([Horace He, Sep 2025](https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/)). This applies to free endpoints as much as paid ones. So **any gate that calls a live model is flaky by construction.** The only way to get a flake-free gate is to replay recorded responses.
- **GitHub Models is gone.** "As of July 30, 2026, GitHub Models has been fully retired", including the inference API ([docs](https://docs.github.com/en/github-models/quickstart)). The old trick of a free judge through `GITHUB_TOKEN` with `models: read` no longer works.
- **Actions minutes are free for this repo:** "The use of standard GitHub-hosted runners is free: In public repositories" ([billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)).
- **Fork PRs get no secrets:** "With the exception of `GITHUB_TOKEN`, secrets are not passed to the runner when a workflow is triggered from a forked repository" ([secrets](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions)). A PR gate that needs an API key would fail for outside contributors. The replay tier needs no key.
- **The Actions cache is a poor place for recordings.** Entries not accessed "in over 7 days" are evicted, and a cache created in a PR "can only be restored by re-runs of the pull request" ([dependency caching](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching)). Recordings should be committed files, not cache entries.
- **Scheduled workflows have limits.** "In a public repository, scheduled workflows are automatically disabled when no repository activity has occurred in 60 days", and at peak times "some queued jobs may be dropped" ([events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)). The live tier needs `workflow_dispatch` as well, and a cron time off the hour.
- **Free judge candidates (the choice belongs to #32/#38):**
  - Cloudflare Workers AI: "10,000 Neurons per day at no charge". On the Free plan, "further operations will fail with an error" when the quota runs out, so there's no overage bill ([pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)). It can be called from CI over REST at `https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/...` ([REST](https://developers.cloudflare.com/workers-ai/get-started/rest-api/)).
  - The Gemini API free tier. Limits are shown per project in AI Studio ([rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)).
  - Either way, evals must not draw on the production agent's free quota. Use a separate key or account, or keep live runs small.

## Comparison

| | **promptfoo** | **Evalite** | **`node:test` + custom scorers** |
|---|---|---|---|
| Status | MIT, v0.123.1 (2026-09-18), very active, 25k stars. OpenAI acquired it in March 2026; it "will remain open source" and keep supporting many providers ([announcement](https://www.promptfoo.dev/blog/promptfoo-joining-openai/)). | MIT. v1 is still `1.0.0-beta.16` (last publish 2026-02-20, `latest` tag is 0.19.0 from Nov 2025). The `v1` branch was last pushed 2026-04-28 (npm, GitHub). | Built into Node, already used by `npm test`. |
| Footprint | 32 MB unpacked, 80 direct dependencies, needs Node ≥ 22.22 (npm). Tests live in YAML config beside the TS code. | Built on Vitest (a second test runner in this repo). Caching needs peer `ai ^6` (Vercel AI SDK), and persistent storage needs `better-sqlite3`, a native module (npm). | Nothing to add. `franc` (MIT, ESM) if we want text-based language detection. |
| Exact facts | `equals`, `contains`, `icontains`, `regex`, `contains-any/all`, `levenshtein`, all negatable with `not-` ([assertions](https://www.promptfoo.dev/docs/configuration/expected-outputs/)) | `exactMatch`, `contains`, `levenshtein` ([scorers](https://github.com/mattpocock/evalite/tree/v1/apps/evalite-docs/src/content/docs/api/scorers)) | Plain `assert` plus a normalizer (case, accents, whitespace). |
| Refusal detection | `is-refusal` matches a fixed **English** phrase list ("I'm sorry", "As an AI", ...), or a refusal flag if the provider reports one ([source](https://github.com/promptfoo/promptfoo/blob/main/src/redteam/util.ts)). This is wrong for Spanish answers and for a persona that declines politely. | None built in. | Assert on a structured result such as `kind: "declined"`, not on wording. |
| Language detection | None built in. Needs a `javascript` assertion. | None built in. | `franc(text, {only: ['eng','spa']})` turns detection into a two-way choice. Its default `minLength` is 10 characters ([readme](https://github.com/wooorm/franc)). Even better, assert a `lang` field the agent returns, and use franc as a cross-check. |
| Source-line grounding | `context-faithfulness` (LLM-graded) or `javascript` | `faithfulness` (LLM-graded) | Code: every cited source ID must exist in the knowledge base and must have come back from a tool call in the same turn. Use an LLM check only for "does the claim match the source". |
| Tool-call assertions | `tool-call-f1` compares tool names only, for OpenAI, Anthropic and Google native formats. `trajectory:tool-used` and `trajectory:tool-args-match` need OpenTelemetry spans ([deterministic](https://www.promptfoo.dev/docs/configuration/expected-outputs/deterministic/)). With a custom provider, you'd write `javascript` checks against `context.providerResponse` / `context.metadata` ([javascript](https://www.promptfoo.dev/docs/configuration/expected-outputs/javascript/)). | `toolCallAccuracy` checks name and arguments, with no LLM needed. | Assert directly on the agent loop's tool-call log. |
| LLM-as-judge | `llm-rubric`, `g-eval`, `factuality`. The grader can be any provider, including `cloudflare-ai:chat:<model>` ([llm-rubric](https://www.promptfoo.dev/docs/configuration/expected-outputs/model-graded/llm-rubric/), [cloudflare-ai](https://www.promptfoo.dev/docs/providers/cloudflare-ai/)). | LLM scorers take any AI SDK model. | About 40 lines: a binary pass/fail prompt that returns JSON with a reason. |
| Caching / recording | Disk cache in `~/.promptfoo/cache`, 14-day TTL, errors not cached, `--no-cache` ([caching](https://www.promptfoo.dev/docs/configuration/caching/)). This is a cost cache, not a committed, reviewable recording. | `wrapAISDKModel` caches AI SDK calls, in memory by default, or in SQLite for persistence ([ai-sdk](https://github.com/mattpocock/evalite/blob/v1/apps/evalite-docs/src/content/docs/api/ai-sdk.mdx)). | Committed JSON recordings keyed by a hash of the request. Adding a missing recording is an explicit step. |
| Repeats / thresholds | `--repeat N`. Per-test and assert-set `threshold`s. `PROMPTFOO_PASS_RATE_THRESHOLD`. Exits with code 100 on failure ([CLI](https://www.promptfoo.dev/docs/usage/command-line/)). | `trialCount`. `scoreThreshold` is the **average score across the whole run**, and the process exits 1 below it ([define-config](https://github.com/mattpocock/evalite/blob/v1/apps/evalite-docs/src/content/docs/api/define-config.mdx)). A single "must never" failure can hide inside a high average. | A thresholds policy we write ourselves, per case class (see below). |
| CI | `promptfoo/promptfoo-action@v1` compares before and after on PRs and comments with a link to the viewer ([action](https://www.promptfoo.dev/docs/integrations/github-action/)). Opt out of telemetry with `PROMPTFOO_DISABLE_TELEMETRY=1` ([telemetry](https://www.promptfoo.dev/docs/configuration/telemetry/)). | `evalite --threshold=N`, plus a static HTML export to upload as an artifact ([CI](https://github.com/mattpocock/evalite/blob/v1/apps/evalite-docs/src/content/docs/tips/run-evals-on-ci-cd.mdx)). | `node --test --test-reporter=junit` (built-in reporters: spec, tap, dot, junit, lcov). Snapshot assertions are experimental in Node 22 and stable from 23.4 ([node:test](https://nodejs.org/docs/latest-v22.x/api/test.html)). Write a Markdown table to `$GITHUB_STEP_SUMMARY`. |

**Why not promptfoo.** It's capable and actively maintained. But the checks Ask Victor needs most (Spanish and English refusals, the "unknown" result, CV and contact offers, source IDs from our own tools) would all be `javascript` assertions against a custom provider. That leaves promptfoo as a heavy, fast-moving pre-1.0 runner wrapped around our own scorers, configured in YAML. Its cache isn't a committed recording, so on its own it doesn't give a flake-free gate.

**Why not Evalite.** v1 is still in beta, and development has slowed (the last npm publish was in February 2026). Its caching depends on the Vercel AI SDK, and persistence needs a native SQLite module. The whole-run average threshold also works against a strict gate. Reconsider it only if #34 adopts the AI SDK and someone wants the local UI.

## How others keep LLM evals from being flaky (and what to adopt)

From Anthropic's [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) (Jan 2026) and Hamel Husain's [evals FAQ](https://hamel.dev/blog/posts/evals-faq/):

- **Prefer code graders; add an LLM judge only where code can't decide.** Code graders are "fast, cheap, objective, reproducible". Model graders are "non-deterministic ... requires calibration with human graders" (Anthropic). "Check whether you can test the condition with code assertions" first (Husain).
- **Separate regression evals from capability evals.** Regression evals "should have a nearly 100% pass rate", and a drop "signals that something is broken" (Anthropic). The PR gate is the regression set.
- **Run repeated trials and choose the metric on purpose.** pass@k means at least one of k trials succeeds. pass^k means all k succeed, which is the right bar "for customer-facing agents where users expect reliable behavior every time" (Anthropic).
- **Grade outcomes, not paths.** Checking a precise tool sequence is "too rigid and results in overly brittle tests" (Anthropic). Assert *that* the contact card or CV was offered, not the order of the lookups.
- **Use binary judges and calibrate them.** "Binary evaluations force clearer thinking and more consistent labeling" than Likert scales. Measure the judge's true-positive and true-negative rates against human labels on a held-out set (Husain). Give the judge a way out ("Unknown") so it doesn't hallucinate a verdict (Anthropic).
- **Isolate trials and read transcripts.** Shared state between runs "can cause correlated failures due to infrastructure flakiness", and "you won't know if your graders are working well unless you read the transcripts" (Anthropic).

## Recommended design (input for #41 and the build slices)

**Make the agent easy to test.** The agent loop should return a structured result alongside the text, something like `{ kind: answer | unknown | declined | contact_offer, lang, sources[], cvOffered, toolCalls[] }`. Most assertions then become exact checks on that object, and the text only needs light checks. This belongs in the tool-schema and persona decisions still open on #31.

**Replay tier (`npm test`, every push and PR, blocking):**

- The model sits behind a small adapter interface. In tests, a replay adapter looks up `recordings/<sha256(model, system-prompt version, messages, tools)>.json` and serves it. If there's no recording, the test fails with "re-record: npm run evals:record". It never falls back to calling the network silently.
- `npm run evals:record` runs locally or through `workflow_dispatch` with the key. It writes recordings, and the PR commits them. The diff of recorded answers is the human review of a prompt change.
- Scorers are code:
  - fact present, and forbidden claims absent
  - `lang` matches the question, cross-checked with franc (`only: eng, spa`)
  - every source ID exists in the knowledge base and came from a tool result
  - `kind` is `declined` or `unknown` where expected
  - a canary string in the system prompt never appears in the output (prompt injection)
  - no URLs, so the source line stays non-clickable
- Pass bar: 100%. It's deterministic, so any failure is real.

**Live tier (a separate `evals.yml`, cron off the hour plus `workflow_dispatch`, not required):**

- Run the same cases against the real free model with k = 3 trials, using a separate key from production.
- Thresholds by case class:
  - **must-never** cases (injection, off-topic, salary or availability guesses, leaking the canary) need pass^3, all three trials.
  - **should** cases (fact phrasing, offering the CV) need at least 2 of 3.
- An LLM judge runs only for voice (third person), faithfulness of the claim to the cited source, and draft quality of the contact message. It returns binary JSON with a reason and uses the free judge chosen in #32/#38. Calibrate it against a small hand-labeled set before trusting it.
- A 429 or quota error marks the case as *skipped (quota)* and never fails the run. Retrying until green is not allowed.
- Output goes to the job summary table plus a JSONL artifact. Failures that repeat get promoted into the replay set as new recordings.

**Don't:** call a live model in a required check, rely on temperature 0 for determinism, rely on English refusal phrase lists, or put recordings in the Actions cache.

## Open questions for other tickets

- #32/#38: which free model is the agent and which is the judge, and whether the judge can have its own quota.
- #34: the shape of the agent loop's structured result and tool log, which determines the replay adapter seam.
- #41: case classes, set size, and the exact per-class thresholds above.
