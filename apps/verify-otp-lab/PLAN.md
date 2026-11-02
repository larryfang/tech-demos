# Verify OTP Lab — PLAN

## Goal
Walk one phone number through a real Sinch Verification flow (SMS PIN or flashcall) in a step-by-step UI — initiate → challenge → report → verified — with every request/response coming from the live Sinch Verification API.

## Stack
- Scaffold: `bunx create-next-app` (App Router, TypeScript, Tailwind), Bun runtime
- UI: shadcn/ui (button, card, input, label, badge, alert, tabs)
- Integration: official Sinch JS SDK `@sinch/sdk-core` (`verification.verifications.startSms` / `startFlashCall`, `reportSmsById` / `reportFlashCallById`, `verificationStatus.getById`), authenticated with `SINCH_APPLICATION_KEY` + `SINCH_APPLICATION_SECRET` from env

## Tasks
1. Open the lab → see a four-step rail (Initiate → Challenge → Report → Verified) and a credentials badge showing whether `SINCH_*` env vars are configured.
2. Without credentials → every step renders, but Start is blocked by a clear "credentials required" state telling the user exactly which env vars to set; no fake responses anywhere.
3. With credentials: enter an E.164 number, pick SMS or flashcall, Start → real `startSms`/`startFlashCall` call returns a verification ID shown in the UI.
4. Challenge step shows what to expect (SMS PIN vs. incoming-call CLI); enter the code/CLI and Report → real `reportSmsById`/`reportFlashCallById` result (SUCCESSFUL/FAIL) drives the step rail.
5. Check Status button → real `verificationStatus.getById` response rendered as the raw JSON the API returned.
6. README documents env vars, run steps, and what works without credentials.

## Decisions & risks
- Next.js API routes hold the key/secret and call Sinch; the browser never sees credentials.
- No mock/dry-run path at all: without credentials the UI shows a "credentials required" state — never fabricated API output.
- Raw API responses are displayed verbatim in an inspector panel so the demo provably shows the real integration.
- `bunfig.toml` with `minimumReleaseAge = 259200` is created before `bun install`.
- Risk: flashcall availability varies by country/account; surfacing the real API error verbatim is the fallback.
