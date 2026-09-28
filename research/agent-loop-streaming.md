# Agent loop and streaming on Workers

Research for [#34](https://github.com/vicxs/portfolio/issues/34), part of the map [#31](https://github.com/vicxs/portfolio/issues/31) (Ask Victor). It builds on [#32](https://github.com/vicxs/portfolio/issues/32) (providers), [#33](https://github.com/vicxs/portfolio/issues/33) (abuse controls), [#35](https://github.com/vicxs/portfolio/issues/35) (evals) and [#36](https://github.com/vicxs/portfolio/issues/36) (knowledge), and feeds [#38](https://github.com/vicxs/portfolio/issues/38).

- **Checked:** 2026-09-28.
- **Sources:** primary only: official docs, changelogs, READMEs, the npm registry, and the published package code. Each claim links to its source.
- **Measured:** bundle sizes and CPU figures labelled *(measured)* come from my own builds and benchmark, described in [Method](#method). They are not Cloudflare numbers.
- **Marked gaps:** anything labelled **Unverified** could not be confirmed on a primary page or by measurement.

**Question.** How should Ask Victor's agent loop and streaming be built on a Cloudflare Worker, feeding the portfolio's Vite + TypeScript + React 18 frontend? Compare (1) a hand-rolled tool-calling loop, (2) the Vercel AI SDK (`ai`) on Workers and (3) Cloudflare's Agents SDK on tool-calling ergonomics, multi-provider support, streaming protocol to the browser, bundle size and Worker CPU limits, testability, and maturity. Recommend one.

---

## TL;DR

- **Recommendation: a hand-rolled loop with no runtime dependencies**, in the same style as `workers/contacto/`.
  - **One OpenAI-shaped adapter**, `chat(request) → stream of chat-completion chunks`. It has three backends: the Workers AI `AI` binding, then Mistral and Groq through `fetch` to their `/v1/chat/completions` endpoints.
  - **A pure `runTurn()` function**, capped at 2 model calls. It returns the structured agent result that #35's scorers check and that the engineer disclosure shows.
  - **A small SSE protocol of our own**, read in the browser with `fetch()` and a stream reader. It adds no client dependency.
- **Why:**
  - **CPU.** Workers Free allows **10 ms of CPU per request**. Streaming a 2-step turn with ~250 answer tokens used **~1.5 ms hand-rolled vs ~12–14 ms through the AI SDK** *(measured, Node proxy)*. The AI SDK's cost grows by about 40 µs per streamed token, so it goes over 10 ms at around 200 tokens. The hand-rolled loop has a 4× margin or more.
  - **The loop is small.** Knowledge is all in the prompt and there's no lookup tool (#36). Every tool is therefore a UI action (CV, contact card, unknown), so a turn is at most 2 model calls. That doesn't justify a framework.
  - **Evals.** #35's replay tier needs the real loop to run in Node against committed recordings. A hand-rolled adapter *is* that recording seam.
  - **Dependencies.** The AI SDK has shipped a major version about every 6 months (v5 Jul 2025, v6 Dec 2025, v7 Jun 2026). Each one changed the provider spec (V2 → V3 → V4) that `workers-ai-provider` implements.
- **Runner-up: AI SDK core + `workers-ai-provider`.**
  - It's the best ergonomics: tools, `stopWhen`, provider packages for Mistral and Groq, `MockLanguageModelV4`.
  - `workers-ai-provider` already absorbs the Workers AI binding's per-model quirks.
  - Switch to it if the loop grows (more tools, more steps) **and** the CPU measurement on a real deploy leaves headroom, or if the account ever moves to Workers Paid.
- **Rejected: Cloudflare Agents SDK** (`agents` + `@cloudflare/ai-chat`).
  - It's built for stateful agents on Durable Objects over WebSockets. Ask Victor is a stateless request/response agent with its own D1 transcripts.
  - Its React hook needs **React 19**; the site is on React 18.
  - It's pre-1.0, with a minor release every 1–3 weeks.
  - Its tests run in Vitest inside workerd, not `node:test`.
  - It runs the AI SDK inside, so it has the same CPU cost.
  - Its bundle is 1.7 MiB.
- **Do a spike before building:** record the real `env.AI.run(..., { stream: true, tools })` output for the three candidate models. What each model streams when it calls a tool (OpenAI `choices[].delta.tool_calls` or the legacy `response`/`tool_calls` shape) isn't documented. The recordings double as the first replay fixtures.

## Comparison

| | **Hand-rolled loop** | **AI SDK (`ai` 7) + `workers-ai-provider` 4** | **Agents SDK (`agents` 0.24 + `@cloudflare/ai-chat` 0.12)** |
|---|---|---|---|
| Tool-calling ergonomics | Our code: parse streamed `tool_calls`, run tools, cap steps. ~150 lines *(est.)* | `tool({ inputSchema, execute })`, `stopWhen: isStepCount(n)`, `prepareStep`, `repairToolCall`, typed errors | AI SDK tools, plus client tools, `needsApproval` and persisted history |
| Workers AI binding | Direct `env.AI.run`; we handle each model's output shape | `createWorkersAI({ binding: env.AI })`; the provider normalizes shapes, tool-call IDs and gpt-oss quirks | Same as the AI SDK column |
| Mistral / Groq | `fetch` to OpenAI-compatible `/v1/chat/completions` | `@ai-sdk/mistral`, `@ai-sdk/groq`, `@ai-sdk/openai-compatible` | Same as the AI SDK column |
| Streaming to the browser | Our SSE events over a `fetch` POST | UI message stream v1 (SSE) → `useChat` (`@ai-sdk/react`) | WebSocket (`CF_AGENT_*` messages) → `useAgentChat` |
| Worker bundle *(measured)* | **2.6 KiB** (1.4 KiB gzip) | 839 KiB (198 KiB gzip) | 1,726 KiB (422 KiB gzip) |
| CPU per 2-step, ~250-token turn *(measured, Node proxy)* | **~1.5 ms** median | ~12–14 ms median (limit on Free: 10 ms) | ≥ the AI SDK figure (not measured) |
| Browser JS for the chat hook *(measured)* | ~1–2 KB own parser *(est.)* | 57 KB gzip (`useChat` + transport) | 92 KB gzip (`useAgent` + `useAgentChat`) |
| React 18 | Yes | Yes (`@ai-sdk/react` peer `react ^18 \|\| ^19`) | **No:** `@cloudflare/ai-chat` peer `react ^19.0.0` |
| Runs the loop under `node:test` | Yes: inject a replaying `chat()` | Yes: `MockLanguageModelV4`, or a fake `env.AI` / `fetch` | No: Vitest + `@cloudflare/vitest-plugin` in workerd |
| Extra infrastructure | None | None | A SQLite Durable Object per conversation (Free: 100k requests/day, 20 WebSocket messages count as 1) |
| Maturity | Our code; the stable surface is OpenAI chat-completions | 30M downloads/week; majors every ~6 months (v5, v6, v7) | 2.1M downloads/week; 0.x, minors every 1–3 weeks |

---

## 1. Platform constraints (Workers Free)

### CPU time
- **Limit:** "CPU time per HTTP request | 10 ms" on Free (5 min on Paid). [limits](https://developers.cloudflare.com/workers/platform/limits/)
- **Waiting doesn't count:** "Waiting on network requests (such as `fetch()` calls, KV reads, or database queries) does **not** count toward CPU time." [limits](https://developers.cloudflare.com/workers/platform/limits/)
  - So the seconds spent waiting for model tokens are free. Only the JavaScript that parses, transforms and re-emits every chunk counts.
- **Enforcement:** "Each isolate has some built-in flexibility to allow for cases where your Worker infrequently runs over the configured limit. If your Worker starts hitting the limit consistently, its execution will be terminated". The client gets Error 1102 "Worker exceeded resource limits". [limits](https://developers.cloudflare.com/workers/platform/limits/)
  - An occasional cold-start overrun is tolerated. A loop that goes over on every long answer is not.
- **Durable Objects:** the DO FAQ says they "have the same per invocation CPU limits as any Workers do". The DO limits table lists "30 seconds (default)" per request without splitting by plan. [DO limits](https://developers.cloudflare.com/durable-objects/platform/limits/)
  - **Unverified:** whether a DO on Workers Free gets 10 ms or 30 s. This matters only for the Agents SDK.

### Duration and streaming
- **No duration limit:** "There is no hard limit on duration for HTTP-triggered Workers. As long as the client remains connected, the Worker can continue processing, making subrequests, and streaming a response body." [limits](https://developers.cloudflare.com/workers/platform/limits/)
- **After the response:** `ctx.waitUntil()` "can extend execution for up to 30 seconds after the response is sent or the client disconnects". It fits the D1 transcript write from #33. [limits](https://developers.cloudflare.com/workers/platform/limits/)

### Size, startup and subrequests
- **Worker size:** 64 MiB uncompressed on both plans. "There is no compressed size limit." [limits](https://developers.cloudflare.com/workers/platform/limits/)
  - Bundle size therefore doesn't block any option. It matters through startup time and CPU.
- **Startup:** "A Worker must parse and execute its global scope … within 1 second. Larger bundles and expensive initialization code in global scope increase startup time." [limits](https://developers.cloudflare.com/workers/platform/limits/)
- **Subrequests:** 50 per request on Free; 128 MB memory. [limits](https://developers.cloudflare.com/workers/platform/limits/)
  - A turn makes at most 2–3 model calls plus D1 and rate-limit calls.

### Workers AI in local dev and CI
- **No local model:** "There is no current local simulation for Workers AI". The binding always reaches the remote service. [development & testing](https://developers.cloudflare.com/workers/development-testing/)
  - Every `wrangler dev` call spends neurons. CI's replay tier must never touch the binding, which matches #35.

---

## 2. The Workers AI binding with tools and streaming

- **Tools on the binding:** "traditional" function calling passes `tools` to `env.AI.run`. The only helper the page recommends is `@cloudflare/ai-utils` `runWithTools`. [function calling](https://developers.cloudflare.com/workers-ai/features/function-calling/)
  - The page's only example model, `@hf/nousresearch/hermes-2-pro-mistral-7b`, was deprecated in May 2026 (#32). The page is stale.
  - `@cloudflare/ai-utils` 1.0.1 depends on `zod ^3` and `yaml`. [npm](https://www.npmjs.com/package/@cloudflare/ai-utils)
- **Streaming:** `stream: true` "Returns a stream of results as they are available", served as `text/event-stream`. [bindings](https://developers.cloudflare.com/workers-ai/configuration/bindings/)
- **Output shape is model-specific:**
  - The Mistral Small 3.1 page lists a synchronous output of `response`, `usage` and `tool_calls` (the legacy shape), and a streaming output as `text/event-stream`. [model page](https://developers.cloudflare.com/workers-ai/models/mistral-small-3.1-24b-instruct/)
  - Since 2026-02-17, `/ai/run` "dynamically detects your input format and accepts Chat Completions (`messages`), legacy Completions (`prompt`), or Responses API (`input`)". [changelog](https://developers.cloudflare.com/workers-ai/changelog/)
- **Tool-calling fixes on 2026-02-17** [changelog](https://developers.cloudflare.com/workers-ai/changelog/):
  - "The binding no longer rejects `tool_call_id` values that it generated itself".
  - Assistant messages with `content: null` and `tool_calls` are now accepted.
  - "Streaming responses now correctly report `finish_reason` only on the usage chunk".
  - `/v1/chat/completions` now reports `finish_reason: "tool_calls"` instead of a hard-coded `"stop"`.
- **OpenAI-compatible REST:** `/v1/chat/completions` also exists over REST with an API token (`…/accounts/{account_id}/ai/v1`). [OpenAI compatibility](https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/)
  - Inside the Worker the binding is the natural path: no token and no outbound hop (#32).
- **What `workers-ai-provider` handles** ([CHANGELOG](https://github.com/cloudflare/ai/blob/main/packages/workers-ai-provider/CHANGELOG.md); published code in [`workers-ai-provider@4.0.0`](https://www.npmjs.com/package/workers-ai-provider/v/4.0.0) `dist/index.mjs`). This is the work a hand-rolled adapter has to repeat for the models we use:
  - **Both output shapes:** `processToolCalls` reads `output.tool_calls` or `choices[0].message.tool_calls`, and the stream mapper handles `chunk.choices` and `chunk.response`.
  - **Non-streaming fallback:** "gpt-oss … doesn't support `/ai/run/` streaming and is retried non-streaming". When the binding returns an object instead of a stream, the provider fakes a stream from it.
  - **Leaked tool calls:** "forced tool calls that gpt-oss models leak as text" are salvaged (3.2.0).
  - **Tool-call IDs:** "Rewrite Workers AI tool call IDs … to avoid collisions across chat turns" (3.1.14); `sanitizeToolCallId()` works around the binding "rejecting its own IDs" (3.0.5).
  - **Forced tool choice:** sends `{ type: "function", function: { name } }` instead of `"required"` (3.2.0).
  - **Streaming:** it used to buffer tool calls; since 3.1.1 it streams them incrementally, and since 3.0.5 it streams token by token instead of all at once.
  - **Errors:** "Native Workers AI failures now surfaced as AI SDK `APICallError`s", which allows retry on capacity errors (3.3.0).
- **Takeaway:** the Workers AI binding is the least standard of the three providers. The hand-rolled adapter must normalize whatever the chosen model returns into OpenAI chunks. That is the main cost of option 1, and the reason for the spike in the TL;DR.

### Mistral and Groq
- **Groq:** OpenAI-compatible at `https://api.groq.com/openai/v1`. The unsupported fields (`logprobs`, `n>1`, `messages[].name` …) don't affect us. [Groq](https://console.groq.com/docs/openai)
- **Mistral:** `tools`, `tool_choice` (`"auto" | "any" | "none"`, where OpenAI says `"required"`) and `parallel_tool_calls`. Tool results are sent as `{ role: "tool", name, content, tool_call_id }`. [Mistral function calling](https://docs.mistral.ai/capabilities/function_calling)
  - With `tool_choice: "auto"` both speak the same chat-completions shape, so a hand-rolled adapter needs only a base URL, a key and a model name per provider.

---

## 3. Option 1: hand-rolled loop

### Shape
- **The adapter:** `chat({ messages, tools, max_tokens, signal })` returns an async iterator of OpenAI chat-completion chunks. There's one backend per provider:
  - Workers AI through `env.AI.run(model, { messages, tools, stream: true })`, normalized to OpenAI chunks.
  - Mistral and Groq through `fetch(baseURL + "/chat/completions")`.
- **Fallback:** try the providers in order on `429/3036`, `429/3040` and `403/5035` (#32), as long as nothing has been streamed to the visitor yet.
- **The loop:** `runTurn({ chat, system, history, question, emit })`.
  - Call the model. Stream text deltas to `emit`. Collect `tool_calls`.
  - With no lookup tool (#36), each tool is a **UI action**: `offer_cv{lang}`, `contact_request{draft}`, `unknown`. None needs its result read by the model.
  - A second call happens only if the model called a tool without writing any text. Hard cap: **2 model calls**, `max_tokens` on each (#33).
  - It returns the **agent result**: `{ kind, lang, text, sources[], toolCalls[], model, provider, latencyMs, usage }`.
- **Transport:** the Worker returns `text/event-stream` built from a `TransformStream`. Chunks follow the SSE format the spec defines (`data:` lines, a blank line dispatches). [HTML SSE](https://html.spec.whatwg.org/multipage/server-sent-events.html)

### Tool-calling ergonomics
- **What we write:**
  - Parsing `tool_calls` deltas by `index`, joining `function.arguments` fragments.
  - Validating tool input against a small hand-written schema (#33 requires schema-validated tools).
  - A step cap.
- **What we skip:** Zod, provider packages and AI SDK message conversion. Each piece is small, and the code is what the engineer disclosure explains.
- **The price:** we own the provider quirks listed in [section 2](#2-the-workers-ai-binding-with-tools-and-streaming).

### Streaming protocol
- **Our own event types**, sized for the UI:
  - `text` (delta)
  - `card` (CV / contact request)
  - `meta` (source line)
  - `result` (the final agent result, for the folded disclosure)
  - `error` (quota or failure, which lands in the graceful "contact Victor" state)
- **Why the final `result` event matters:** it carries the same object the eval scorers check. What an engineer sees in the disclosure is exactly what CI graded.
- **Browser side:** `fetch()` POST, then `response.body.getReader()` and a ~40-line SSE parser, lazy-loaded with the box.
  - `EventSource` doesn't fit: its constructor takes only `url` and `withCredentials`, so it can't send a POST body or the session token header. [MDN](https://developer.mozilla.org/en-US/docs/Web/API/EventSource/EventSource)

### Bundle and CPU *(measured)*
- **Bundle:** 2.6 KiB (1.4 KiB gzip) for a representative loop, adapter and SSE writer.
- **CPU per warm 2-step turn:**

  | Answer length | Median | p90 |
  |---|---|---|
  | 25 tokens | 0.3 ms | 1.3 ms |
  | 250 tokens | 1.5 ms | 3.4 ms |
  | 500 tokens | 2.5 ms | 5.0 ms |

### Testability
- **The adapter is the seam.** The replay tier (#35) swaps `chat` for a replayer that looks up a committed recording by a hash of the request and yields its chunks. If a recording is missing, the test fails.
- **Recording:** the live tier wraps the real adapter and writes the raw chunks.
- **What runs:** the same `runTurn` runs in Node (`node:test`) and in the Worker, as `workers/contacto/src/message.js` is tested today (`tests/contacto-worker.test.mjs`).
- **Recordings last:** they are raw provider output, so they survive any library upgrade.

### Maturity
- **The external contract:** only OpenAI chat-completions over SSE, plus the Workers AI binding.
- **The risk:** a model change on Workers AI can change the output shape. The replay tier won't catch this, because recordings are fixed. The scheduled live tier (#35) will.

---

## 4. Option 2: Vercel AI SDK on Workers

### Versions and cadence
- **Current:** `ai` 7.0.118, `@ai-sdk/react` 4.0.121, `workers-ai-provider` 4.0.0, `@ai-sdk/openai-compatible` 3.0.57, `@ai-sdk/mistral` 4.0.52, `@ai-sdk/groq` 4.0.50, all published on or after 2026-07-22. [npm: ai](https://www.npmjs.com/package/ai), [npm: workers-ai-provider](https://www.npmjs.com/package/workers-ai-provider)
- **Major releases** (from `npm view ai time`):
  - 4.0.0 on 2024-11-18
  - 5.0.0 on 2025-07-31
  - 6.0.0 on 2025-12-22
  - 7.0.0 on 2026-06-25
- **Each major changes the provider spec:**
  - `workers-ai-provider` 3.0.0 "Migrated to AI SDK v6". 4.0.0 "Add support for AI SDK 7 … breaking for AI SDK 6 users". [CHANGELOG](https://github.com/cloudflare/ai/blob/main/packages/workers-ai-provider/CHANGELOG.md)
  - The mocks follow: `MockLanguageModelV4` in v7. [testing](https://ai-sdk.dev/docs/ai-sdk-core/testing)
- **Dependencies:** `ai` pulls in `@ai-sdk/gateway`, `@ai-sdk/provider` and `@ai-sdk/provider-utils`, and needs `zod` as a peer that isn't optional. [npm: ai](https://www.npmjs.com/package/ai)
- **Usage:** 30.4M downloads/week (`ai`) and 386k (`workers-ai-provider`), week of 2026-09-21. [npm downloads API](https://api.npmjs.org/downloads/point/last-week/ai)

### Tool-calling ergonomics
- **Tools:** `tool({ description, inputSchema, execute })`. `inputSchema` accepts "A Zod schema … or a JSON schema" through `jsonSchema()`. [tools](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)
- **Steps:**
  - `stopWhen` enables multi-step calls. `streamText`/`generateText` default to `isStepCount(1)`; `ToolLoopAgent` defaults to `isStepCount(20)`. From the `ai@7.0.118` type declarations; `stepCountIs` is kept as an alias.
  - `prepareStep` runs before each step and can swap the model.
  - `repairToolCall` fixes invalid calls.
  - Errors are typed: `NoSuchToolError`, `InvalidToolInputError`, `ToolChoiceViolationError`. [tools](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)
- **UI tools:** a tool with no `execute` stops the loop and forwards the call to the client. That fits the contact-request card. [tools](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)

### Workers AI and multiple providers
- **Cloudflare's recommendation:** "Install the `workers-ai-provider` provider". [Cloudflare: AI SDK](https://developers.cloudflare.com/workers-ai/configuration/ai-sdk/)
  - `createWorkersAI({ binding: env.AI })` needs "no API keys". Tools and streaming are supported "on capable models". [README](https://github.com/cloudflare/ai/tree/main/packages/workers-ai-provider)
- **Mistral and Groq:** first-party provider packages exist (versions above), or use `@ai-sdk/openai-compatible` with a base URL.
- **Swapping models:** a provider change is a one-line model swap, and `prepareStep` or a try/catch handles the fallback.

### Streaming protocol
- **The UI message stream:** "uses Server-Sent Events (SSE) format". A custom backend must send `x-vercel-ai-ui-message-stream: v1`. The stream ends with `data: [DONE]`. [stream protocol](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol)
  - Part types include `start`, `text-start/delta/end`, `tool-input-start/delta/available`, `tool-output-available`, `source-url`, `data-*`, `start-step`/`finish-step` and `finish`.
  - The header is still `v1` in `ai@7.0.118` (`UI_MESSAGE_STREAM_HEADERS`), so the protocol has held since v5.
- **The client:** `useChat({ transport: new DefaultChatTransport({ api, headers, credentials, body }) })`. Messages are `UIMessage` objects with `parts`; status is `submitted`, `streaming`, `ready` or `error`. [chatbot](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot)
  - `@ai-sdk/react` 4.0.121 accepts `react ^18`. It depends on `ai`, `swr`, `throttleit` and `@ai-sdk/mcp`. [npm](https://www.npmjs.com/package/@ai-sdk/react)

### Bundle and CPU *(measured)*
- **Worker bundle:** 839 KiB (198 KiB gzip) for `streamText` + `workers-ai-provider` + `@ai-sdk/openai-compatible` + 3 tools + `toUIMessageStreamResponse`. It builds without `nodejs_compat`.
- **Startup:** importing the bundle took ~33 ms of CPU in Node, against 0.8 ms hand-rolled. It stays far below the 1 s startup limit.
  - **Unverified:** whether global-scope evaluation counts towards the first request's 10 ms.
- **CPU per warm 2-step turn:**

  | Answer length | Median | p90 |
  |---|---|---|
  | 25 tokens | 2.8 ms | 5.9 ms |
  | 250 tokens, Workers AI provider | 12.3–12.7 ms | 18 ms |
  | 250 tokens, OpenAI-compatible provider | 14.4 ms | 20 ms |
  | 500 tokens | 21.4 ms | 27.8 ms |

- **Where the time goes:** most of it is in `streamText` itself. Consuming `fullStream` without the UI stream conversion still took 8.5–11.4 ms.
- **The browser hook:** `useChat` + `DefaultChatTransport` is 57 KB gzip (React external). It would be lazy-loaded on a page gated at Lighthouse performance ≥ 0.9 (`lighthouserc.json`).

### Testability
- **Mocks:** `ai/test` exports `MockLanguageModelV4`, `mockValues` and `mockId`; `simulateReadableStream` comes from `ai`. [testing](https://ai-sdk.dev/docs/ai-sdk-core/testing)
  - The page doesn't name a test runner. The helpers are plain objects, and the benchmark ran the built Worker under plain Node.
- **Where to record:**
  - At the **provider I/O**: a fake `env.AI.run` and `fetch`, as in the benchmark. Recordings then survive AI SDK majors.
  - At the **`LanguageModelV4` stream parts**. Recordings then tie to the spec version and break on the next major.
- **Either works with #35**, but prefer the first.

---

## 5. Option 3: Cloudflare Agents SDK

- **What it is:** "Build AI-powered chat interfaces with `AIChatAgent` and `useAgentChat`. Messages are automatically persisted to SQLite, streams resume on disconnect, and tool calls work across server and client." [chat agents](https://developers.cloudflare.com/agents/api-reference/chat-agents/)
  - `onChatMessage()` is implemented with the AI SDK's `streamText(...).toUIMessageStreamResponse()`.
  - It needs a Durable Object binding plus a `new_sqlite_classes` migration.
- **Transport:** WebSocket, with typed JSON frames (`CF_AGENT_USE_CHAT_REQUEST`, `CF_AGENT_USE_CHAT_RESPONSE`). [chat agents](https://developers.cloudflare.com/agents/api-reference/chat-agents/)
  - The `@cloudflare/ai-chat` README describes only "real-time WebSocket delivery to all connected clients". [README](https://github.com/cloudflare/agents/tree/main/packages/ai-chat)
- **Free-plan fit:**
  - Only SQLite-backed DOs are on Free: 100k requests/day, 13,000 GB-s/day, 100k rows written/day, 5 GB. "If you exceed any one of the free tier limits, further operations of that type will fail with an error." [DO pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)
  - 20 incoming WebSocket messages bill as one request. Without hibernation, an open socket accrues duration the whole time. [DO pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)
  - This adds a second daily quota beside the 100k Worker requests that #33 already caps.
- **React:** `@cloudflare/ai-chat` 0.12.0 has `react ^19.0.0` as a peer, optional only for non-React use. The site uses React 18.3. [npm](https://www.npmjs.com/package/@cloudflare/ai-chat), `package.json`
  - For vanilla JS, `agents/chat/transport` exports a `WebSocketChatTransport`. [chat agents](https://developers.cloudflare.com/agents/api-reference/chat-agents/)
- **State overlaps with ours:**
  - It persists every message in the DO's SQLite (`maxPersistedMessages` caps it). [README](https://github.com/cloudflare/agents/tree/main/packages/ai-chat)
  - #33 already decided on IP-free transcripts in D1 with a 30-day purge. That would leave two stores of the same conversation, each with its own retention to enforce.
- **Testing:** "vitest@^4.1.0" and "@cloudflare/vitest-plugin", running like Workers and Durable Objects. [testing agents](https://developers.cloudflare.com/agents/getting-started/testing-your-agent/)
  - The page doesn't mention `node:test` or mocking models. The repo's test suite is `node --test tests/*.test.mjs`.
- **Maturity:**
  - `agents` 0.24.0 had 5 minor releases between 2026-07-28 and 2026-09-18. `@cloudflare/ai-chat` first shipped on 2025-12-29 and is at 0.12.0. [npm](https://www.npmjs.com/package/agents)
  - The repo has 5.7k stars and an `experimental/` folder with "no stability guarantees". [GitHub](https://github.com/cloudflare/agents)
  - Usage: 2.1M downloads/week (`agents`) and 402k (`@cloudflare/ai-chat`). [npm downloads API](https://api.npmjs.org/downloads/point/last-week/agents)
- **Bundle *(measured)*:** 1,726 KiB (422 KiB gzip) for a minimal `AIChatAgent` with one tool. Browser hooks: 92 KB gzip.
- **CPU:** not measured, because it needs workerd with Durable Objects. It runs `streamText` plus WebSocket framing and SQLite writes, so at least option 2's cost. Only the unverified DO CPU limit could change this.

---

## Method

Everything ran on Apple M1 Pro, Node 24.11.1, 2026-09-28, in a scratch directory outside the repo.

- **Bundles:** `wrangler@4.142.0 deploy --dry-run --minify`, reading "Total Upload", which is the uncompressed size the limit counts. [limits](https://developers.cloudflare.com/workers/platform/limits/)
  - Hand-rolled: a representative ~100-line loop, adapter and SSE writer.
  - AI SDK: `ai@7.0.118`, `workers-ai-provider@4.0.0`, `@ai-sdk/openai-compatible@3.0.57`.
  - Agents: `agents@0.24.0`, `@cloudflare/ai-chat@0.12.0`, with `nodejs_compat`.
- **CPU:** I imported each built bundle in Node and called its `fetch` handler with a fake `env.AI` (or a stubbed `fetch`). The fake replays OpenAI-shaped SSE in 64-byte pieces:
  - step 1: a streamed `offer_cv` tool call
  - step 2: N text-delta chunks
  
  I measured `process.cpuUsage()` over the whole turn, including reading the response, and took the median and p90 of 200 warm turns after 1 cold turn.
- **Browser hooks:** `esbuild --bundle --minify` with `react`/`react-dom` external, then gzip.
- **Limits of the method:**
  - This is a **proxy**. V8 in Node isn't workerd: Web Streams are native in workerd and JavaScript in Node, and Cloudflare's hardware differs.
  - Cold first turns (20–35 ms hand-rolled, 60–110 ms AI SDK) mostly reflect Node JIT and lazy initialization.
  - The **ratio** (~8×) and the **per-token slope** (~5 µs vs ~40 µs) are the robust findings, not the absolute numbers.
  - A real deploy reports CPU time per invocation in Workers metrics. Check it there before building.

---

## Recommendation for the build

### Choose: a hand-rolled loop, no runtime dependencies
- **Location:** `workers/ask/` (name to be settled when slicing), beside `workers/contacto/`, in plain modules that Node can import.
- **`adapter.js`:** `chat()` over the three providers.
  - Workers AI output is normalized to OpenAI chunks, handling both `choices[].delta` and legacy `response`/`tool_calls` shapes.
  - There's a non-streaming fallback for models that don't stream.
  - Tool-call IDs are sanitized.
  - Errors are mapped to `quota | capacity | paid-only | other` so the fallback can act on them.
  - Use `workers-ai-provider`'s changelog as a checklist of quirks.
- **`loop.js`:** `runTurn()`.
  - At most 2 model calls, with `max_tokens` on each.
  - Tool input is validated against hand-written schemas.
  - It returns the agent result.
- **`sse.js` + `index.js`:** CORS, Turnstile/session, the rate-limit and D1 cap order from #33, then the SSE response and a `waitUntil` transcript write.
- **Browser:** `fetch()` POST, a stream reader and a small SSE parser, in the lazily loaded box component. No new client dependency.

### For the build
- **The spike first:** with `wrangler dev` (it always uses the remote binding and spends neurons), record `env.AI.run(model, { messages, tools, stream: true })` for Mistral Small 3.1, Gemma 4 26B and Llama 3.3 70B.
  - Record one tool-call turn and one text turn in each language.
  - This settles the adapter's normalization and seeds the replay fixtures.
- **Measure real CPU:** after the first deploy, read CPU time per invocation for a long answer in Workers metrics.
  - If it's well under 10 ms and the loop has grown, the AI SDK becomes an option again.
- **Fall back before the first byte:** switch provider only before any text has been sent to the visitor. After that, a failure ends the answer with the `error` event.
- **Never trust client history:** the browser keeps the conversation for the session and re-sends it each turn.
  - The Worker accepts only `{ role: "user" | "assistant", text }` items and never tool messages from the client.
  - It caps the number of turns and characters (#33's max-turns cap).
  - Prompt injection through fake assistant turns is bounded by the architecture (#33).
- **CORS preflight:** a JSON POST with a session token triggers a preflight, and each preflight is another request to the Worker. Send `Access-Control-Max-Age: 7200`, the Chromium cap (Firefox caps at 86400; the default is 5 s). [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Max-Age)
- **Keep global scope trivial:** build the system prompt at build time, as #36 requires. Don't parse `data.ts` at startup.
- **Schema-validate the final `result` event** in both tiers. It's the contract between the Worker, the UI disclosure and the eval scorers.

---

## Open items (unverified)

- **Streaming tool calls from the binding:** the exact stream format `env.AI.run` returns when tools are passed with `stream: true` for each candidate model (OpenAI deltas or the legacy `response` shape, and whether `tool_calls` arrive incrementally or in one chunk). This is the one thing to settle before writing the adapter.
- **Real CPU on Workers:** the numbers above are a Node proxy. Workers metrics on a deploy will give the real figures.
- **Startup CPU:** whether global-scope evaluation on a cold isolate counts towards the first request's 10 ms.
- **DO CPU on Free:** whether Durable Objects on Workers Free get 10 ms or the "30 seconds (default)" in the DO limits table. It matters only if the Agents SDK were reconsidered.
- **Binding error shape:** how `env.AI.run` surfaces `3036`/`3040`/`5035` (error class, message or code property). The adapter's fallback depends on it; `workers-ai-provider`'s `normalizeBindingError` is a hint, not documentation.
- **Workers AI binding calls and subrequests:** whether they count toward the 50-per-request limit. This is not a practical constraint at 2–3 calls per turn.
