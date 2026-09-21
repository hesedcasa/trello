# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build          # Compile TypeScript (outputs to dist/)
npm test               # Run all tests (mocha) + lint
npm run test:coverage  # Run tests with coverage (50% minimum threshold)
npm run lint           # ESLint only
npm run format         # ESLint fix + Prettier write
npm run find-deadcode  # ts-prune (ignores run/default exports)
npm run pre-commit     # format + find-deadcode
```

Run a single test file:

```bash
npx mocha --forbid-only "test/commands/trello/card/create.test.ts"
```

## Architecture

This is an OCLIF v4 CLI (`trello` binary) organized into three layers:

**Commands** (`src/commands/trello/<resource>/<action>.ts`) — OCLIF `Command` subclasses. Each command:

1. Reads auth config via `readConfig()` from `src/config.ts`
2. Calls a function from `src/trello/trello-client.ts`
3. Calls `clearClients()` after the API call
4. Outputs via `this.logJson(result)` (default) or `this.log(formatAsToon(result))` with `--toon` flag

**Client layer** (`src/trello/trello-client.ts`) — Module-level singleton `TrelloApi` instance. Exports plain async functions (e.g. `getCard`, `createCard`) that lazily init the singleton via `initTrello()`. `clearClients()` tears it down between invocations.

**API wrapper** (`src/trello/trello-api.ts`) — `TrelloApi` class wrapping the client `trello.js` v2's `createTrelloClient()` returns. All methods return `ApiResult` (`{success, data?, error?}`). Errors are caught and returned (never thrown) via `handleError()`, which appends the `cause` chain because undici reports every transport failure as a bare `fetch failed`.

Three things about the v2 client are load-bearing:

- **`skipParsing: true`.** v2 validates responses with Zod and strips every key its generated schemas do not name. This CLI prints whatever Trello returns, so parsing is off: no stripped fields, no `Date` coercion, and no `ZodError` when the spec lags the API.
- **Attachments are uploaded by hand.** v2's `createCardAttachment` sends `file` as a query parameter, so it can only attach a url. `addCardAttachment` posts the multipart body itself against `https://api.trello.com/1/cards/<id>/attachments`, and mirrors v2's `Request failed: <status> <statusText> - <body>` wording so the CLI has one error shape.
- **The proxy is an undici dispatcher** (`src/proxy.ts`). v2 dropped axios for the global `fetch`, which ignores HTTP(S)\_PROXY, so `getClient()` installs a `ProxyAgent` via `setGlobalDispatcher` when `proxy-from-env` resolves one for `api.trello.com`; `clearClients()` restores the previous dispatcher and closes it so the CLI's keep-alive sockets do not hold the process open.

**Config** (`src/config.ts`) — Reads `trello-config.json` from the OCLIF `configDir` (platform config directory). File holds `{auth: {apiKey, apiToken}}`.

## Testing

Tests use Mocha + Chai + `esmock` for ESM module mocking. Pattern:

```ts
import esmock from 'esmock'
import {createMockConfig} from '../../../helpers/config-mock.js'

CardCreate = await esmock('../../../../src/commands/trello/card/create.js', {
  '../../../../src/config.js': {readConfig: mockReadConfig},
  '../../../../src/trello/trello-client.js': {createCard: mockCreateCard, clearClients: mockClearClients},
})
const command = new CardCreate.default(['arg1', 'arg2'], createMockConfig())
command.logJson = (output) => {
  /* capture */
}
await command.run()
```

`createMockConfig()` in `test/helpers/config-mock.ts` provides a minimal OCLIF `Config` stub.

## Key conventions

- All imports use `.js` extensions (ESM, `"type": "module"`)
- `topicSeparator` is a space, so commands are invoked as `trello card create` (not `trello:card:create`)
- `--json` flag is built into OCLIF (`enableJsonFlag = true`) on commands that return an `ApiResult`
- `--toon` flag formats output using `@toon-format/toon` (alternative human-readable table format)

## End-to-end tests

`test/e2e/**` runs the built `bin/run.js` as a real subprocess against the live Trello API. `npm run test:e2e` then reruns the same suite through the latest sdkck host CLI with the current build packed and installed as its plugin — the host switch (`E2E_HOST_CLI=sdkck` + `E2E_SDKCK_HOME`, set by `scripts/e2e.sh` and the CI workflow) lives in `test/e2e/helpers.ts`; the plugin must be installed before any `sdkck trello` call, or sdkck auto-installs the published release, and the tarball must be a `file:` URL (bare paths read as GitHub org/repo). It is excluded from `npm test` and needs credentials exported first, because nothing in this repo loads `.env`:

```bash
set -a; . ./.env; set +a
npm run test:e2e              # build, run, then sweep
npm run test:e2e -- --keep    # leave fixtures behind for inspection
npm run e2e:mocha             # run without rebuilding
npm run e2e:sweep             # close e2e boards idle for over an hour
```

`TRELLO_SECRET` in `.env` holds the API **token** (the 64-hex-char value from Trello's authorize flow) despite its name — the OAuth secret on the Power-Up admin page authenticates nothing and gets a 401.

`e2e:sweep` also deletes the _current_ run's fixtures when `E2E_RUN_ID` is set — `scripts/e2e.sh` and the CI workflow both set it, so a mocha killed before its `after` hooks ran (a job timeout, a local Ctrl-C) still gets cleaned up instead of waiting an hour for the stale sweep to reach it.

Five rules specific to this suite:

- **Never pass `--json` to a data command.** JSON is already the default (`BaseCommand.jsonEnabled()`); `--json` is not a declared flag and the command will fail to parse. (`auth test` is the exception — it comes from plugin-lib and prints text by default.)
- **Fixtures are created with raw `fetch` in `test/e2e/fixtures.ts`, never through the CLI** — they are the oracle the CLI is checked against.
- **Every fixture lives in the per-run board** named `[e2e-cli] run <id> <epoch>`. Trello has no project to scope queries to, so the full-name pattern (`RUN_BOARD_PATTERN` — literal `run`, an id, a trailing epoch) is the only blast-radius guard the sweep has — never widen `findFixtureBoards` past it. The trailing epoch is the sweep's age signal: Trello reports no usable timestamps for API-created boards, so the name is the only durable one.
- **Boards cannot be deleted via the API, only closed.** Cleanup deletes the run board's cards and closes the board; closed boards accumulate in the account. That is pinned as a known wart, not a bug to "fix" later.
- **Assert on exit codes, `success`, and the HTTP status substring** (e.g. `401` in "Request failed: 401 Unauthorized - ..."), not on full error message text — and note the pinned asymmetry: data commands exit **0** even when the payload is `success: false`; only `this.error` paths (`Missing authentication config.` → 1, failed `auth test` → 2) exit non-zero.

CI runs the suite on demand only (`.github/workflows/run-e2e-tests.yml`, `workflow_dispatch` from the default branch), not per PR: runs share one live Trello account, and fork PRs cannot read secrets. It stays "blocked" until `TRELLO_API_KEY` and `TRELLO_SECRET` are added in repo Settings → Secrets and variables → Actions.
