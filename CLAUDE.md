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

**API wrapper** (`src/trello/trello-api.ts`) — `TrelloApi` class wrapping the `trello.js` `TrelloClient`. All methods return `ApiResult` (`{success, data?, error?}`). Errors are caught and returned (never thrown) via `handleError()`.

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
command.logJson = (output) => { /* capture */ }
await command.run()
```

`createMockConfig()` in `test/helpers/config-mock.ts` provides a minimal OCLIF `Config` stub.

## Key conventions

- All imports use `.js` extensions (ESM, `"type": "module"`)
- `topicSeparator` is a space, so commands are invoked as `trello card create` (not `trello:card:create`)
- `--json` flag is built into OCLIF (`enableJsonFlag = true`) on commands that return an `ApiResult`
- `--toon` flag formats output using `@toon-format/toon` (alternative human-readable table format)
