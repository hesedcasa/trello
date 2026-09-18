import {Buffer} from 'node:buffer'
import {randomBytes} from 'node:crypto'

import {requireEnv} from './helpers.js'

/**
 * One id per mocha process, so concurrent runs never delete each other's
 * fixtures.
 *
 * E2E_RUN_ID overrides it so a *separate* process can address this run's
 * fixtures by board name — `scripts/e2e.sh` and the CI workflow both set it,
 * which is what lets their post-run sweep reclaim fixtures a killed mocha
 * never got to clean up.
 */
export const RUN_ID = process.env.E2E_RUN_ID || randomBytes(4).toString('hex')
/** When this process started — embedded in the board name, see RUN_BOARD_NAME. */
const RUN_EPOCH = Date.now()
/**
 * Carried by every fixture board ever created, so a crashed run can be
 * reclaimed later: the stale sweep only ever touches boards whose name starts
 * with this prefix, which bounds its blast radius structurally — Trello has
 * no project to scope a query to.
 *
 * The trailing epoch is the age the stale sweep reclaims by. Trello reports
 * neither `dateLastActivity` nor `created` reliably for boards created
 * through the API (pinned by probing: both come back empty from the
 * member-boards listing), so the name is the only durable timestamp a
 * fixture board carries.
 */
export const BOARD_PREFIX = '[e2e-cli]'
export const RUN_BOARD_NAME = `${BOARD_PREFIX} run ${RUN_ID} ${RUN_EPOCH}`
/**
 * The complete naming contract a board must satisfy before any destructive
 * lookup will admit it: a literal `run` separator, a run id, and a trailing
 * epoch. A bare prefix is not enough — a board that merely starts with
 * `[e2e-cli]` (say, a user's own `[e2e-cli] project 1`) must never be
 * mistaken for a fixture the sweep may delete cards from and close.
 */
export const RUN_BOARD_PATTERN = /^\[e2e-cli\] run \S+ \d+$/v

const API_BASE = 'https://api.trello.com/1'

/** The three lists seedBoard() creates inside the run board. */
export type SeedLists = {doing: string; done: string; todo: string}

type FixtureBoard = {id: string; name: string}

type TrelloResponse = {body: unknown; status: number}

/**
 * The creation epoch embedded in a fixture board's name.
 *
 * @param name The board name.
 * @returns The epoch millis, or undefined when the name carries none —
 *   treated as brand new by the sweep, never as infinitely old.
 */
export function boardEpoch(name: string): number | undefined {
  const epoch = Number(name.split(' ').at(-1))
  return Number.isFinite(epoch) && epoch > 0 ? epoch : undefined
}

/**
 * Cards created by this process, as a fallback for `cleanupRun`.
 *
 * The run board's own card list is the real backstop — Trello lists a board's
 * cards directly, with no search-index lag — but the tracking set covers a
 * card whose board lookup is skipped, and keeps the fixtures self-test able
 * to exercise both paths.
 */
const createdCards = new Set<string>()

/** The board seedBoard() created for this process, cached for cleanup. */
let runBoard: undefined | {boardId: string; lists: SeedLists}

/**
 * Forgets the cached run board and tracked cards.
 *
 * Used by the fixtures self-test, which seeds and cleans up repeatedly in one
 * process; production entry points (e2e.sh, the CI workflow) never call it.
 */
export function resetRunState(): void {
  runBoard = undefined
  createdCards.clear()
}

async function call(method: string, endpoint: string, params: Record<string, string> = {}): Promise<TrelloResponse> {
  const {apiKey, apiToken} = requireEnv()

  const url = new URL(API_BASE + endpoint)
  url.searchParams.set('key', apiKey)
  url.searchParams.set('token', apiToken)
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value)
  }

  const response = await fetch(url, {method})

  // Trello answers some failures (a 404 on a card, most notably) with a
  // plain-text body, so only parse when a JSON content type says it is JSON.
  const text = await response.text()
  const contentType = response.headers.get('content-type') ?? ''
  const body = text && contentType.includes('application/json') ? JSON.parse(text) : text || null
  return {body, status: response.status}
}

/**
 * Creates the run board with three lists, via the REST API directly.
 *
 * Fixtures are never created through the CLI: they are the oracle the CLI is
 * checked against, so they must not share its code path.
 *
 * The board is created private, without the default lists and default labels
 * Trello seeds new boards with, so empty-result assertions have a stable
 * target and the label tests start from a known state.
 *
 * @returns The board id and its three list ids (cached; one board per process).
 */
export async function seedBoard(): Promise<{boardId: string; lists: SeedLists}> {
  if (runBoard) {
    return runBoard
  }

  const created = await call('POST', '/boards', {
    defaultLabels: 'false',
    defaultLists: 'false',
    name: RUN_BOARD_NAME,
    prefs_permissionLevel: 'private',
  })
  if (created.status !== 200 || !created.body || typeof (created.body as {id?: string}).id !== 'string') {
    throw new Error(`seedBoard failed: ${created.status} ${JSON.stringify(created.body)}`)
  }

  const boardId = (created.body as {id: string}).id
  const names: Array<[keyof SeedLists, string]> = [
    ['todo', 'To Do'],
    ['doing', 'Doing'],
    ['done', 'Done'],
  ]
  const lists = {} as SeedLists
  for (const [key, name] of names) {
    // eslint-disable-next-line no-await-in-loop -- creation order fixes list order
    const list = await call('POST', '/lists', {idBoard: boardId, name})
    if (list.status !== 200 || !list.body || typeof (list.body as {id?: string}).id !== 'string') {
      throw new Error(`seedBoard list "${name}" failed: ${list.status} ${JSON.stringify(list.body)}`)
    }

    lists[key] = (list.body as {id: string}).id
  }

  runBoard = {boardId, lists}
  return runBoard
}

/**
 * Creates a fixture card via the REST API directly.
 *
 * @param listId The list to create the card in.
 * @param name The exact card name (unique names make search assertions safe).
 * @param overrides Extra query params, e.g. `{desc: '...'}`.
 * @returns The created card id.
 */
export async function seedCard(listId: string, name: string, overrides: Record<string, string> = {}): Promise<string> {
  const {body, status} = await call('POST', '/cards', {idList: listId, name, ...overrides})
  if (status !== 200 || !body || typeof (body as {id?: string}).id !== 'string') {
    throw new Error(`seedCard "${name}" failed: ${status} ${JSON.stringify(body)}`)
  }

  const {id} = (body as {id: string})
  createdCards.add(id)
  return id
}

/**
 * Reads a card's HTTP status straight from the REST API.
 *
 * Trello answers a deleted card id with 404 on this endpoint right away —
 * there is no search index in the path, so no polling is needed.
 *
 * @param cardId The card id.
 * @returns The status code: 200 while the card exists, 404 once it is gone.
 */
export async function cardHttpStatus(cardId: string): Promise<number> {
  const {status} = await call('GET', `/cards/${cardId}`, {fields: 'name'})
  return status
}

/**
 * Deletes a card, tolerating one that is already gone.
 *
 * @param cardId The card id.
 */
export async function deleteCard(cardId: string): Promise<void> {
  const {status} = await call('DELETE', `/cards/${cardId}`)
  if (status !== 200 && status !== 404) {
    throw new Error(`deleteCard ${cardId} failed: ${status}`)
  }

  createdCards.delete(cardId)
}

/**
 * Deletes every card in `keys`, tolerating individual failures until all
 * deletions have been attempted, then throwing if any actually failed.
 *
 * Promise.all would abandon the remaining deletions on the first rejection;
 * allSettled ensures a single stuck card never masks failures to delete the
 * rest.
 *
 * @param cardIds The card ids to delete.
 */
async function deleteAllCards(cardIds: Iterable<string>): Promise<void> {
  const ids = [...new Set(cardIds)]
  const results = await Promise.allSettled(ids.map((cardId) => deleteCard(cardId)))
  const failures = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected')
  if (failures.length > 0) {
    throw new Error(
      `deleteAllCards: ${failures.length}/${ids.length} deletion(s) failed: ` +
        failures.map((f) => String(f.reason)).join('; '),
    )
  }
}

/**
 * Every card on a board, including archived ones.
 *
 * A direct board read, not a search — there is no index lag to poll for.
 *
 * @param boardId The board id.
 * @returns The card ids.
 */
async function allBoardCards(boardId: string): Promise<string[]> {
  const {body, status} = await call('GET', `/boards/${boardId}/cards`, {fields: 'id', filter: 'all'})
  if (status !== 200) {
    throw new Error(`allBoardCards failed: ${status} ${JSON.stringify(body)}`)
  }

  return (Array.isArray(body) ? body : []).map((card) => (card as {id: string}).id)
}

/**
 * Closes a board, tolerating one that is already gone.
 *
 * Trello's API cannot delete boards — DELETE on a board is not supported and
 * close is as far as it goes — so closing is this suite's terminal state for
 * a board. Closed boards accumulate in the account; that is pinned as a known
 * wart rather than papered over.
 *
 * @param boardId The board id.
 */
export async function closeBoard(boardId: string): Promise<void> {
  const {status} = await call('PUT', `/boards/${boardId}`, {closed: 'true'})
  if (status !== 200 && status !== 404) {
    throw new Error(`closeBoard ${boardId} failed: ${status}`)
  }
}

/**
 * The open boards this account holds whose name matches the full run-board
 * naming contract (RUN_BOARD_PATTERN).
 *
 * This is the *only* destructive lookup, and it is name-scoped here —
 * structurally, once — the way the jira suite scopes its queries to one
 * project: `cleanupRun` and `sweepStale` are driven by ambient environment
 * variables with no other guard. The full-pattern match, not a bare prefix,
 * is the blast-radius boundary.
 *
 * Exported so the fixtures self-test can assert a seeded board is findable.
 *
 * @returns The matching boards with their ids and names.
 */
export async function findFixtureBoards(): Promise<FixtureBoard[]> {
  const {body, status} = await call('GET', '/members/me/boards', {
    fields: 'name',
    filter: 'open',
  })
  if (status !== 200) {
    throw new Error(`findFixtureBoards failed: ${status} ${JSON.stringify(body)}`)
  }

  return (Array.isArray(body) ? body : [])
    .map((board) => board as FixtureBoard)
    .filter((board) => RUN_BOARD_PATTERN.test(board.name))
}

/**
 * Reads whether a board is closed straight from the REST API.
 *
 * Closing — not deleting — is Trello's terminal state for a board, so this is
 * the existence check the fixtures self-test asserts on after cleanup.
 *
 * @param boardId The board id.
 * @returns True once the board is closed.
 */
export async function boardClosed(boardId: string): Promise<boolean> {
  const {body, status} = await call('GET', `/boards/${boardId}`, {fields: 'closed'})
  if (status !== 200) {
    throw new Error(`boardClosed failed: ${status} ${JSON.stringify(body)}`)
  }

  return Boolean((body as {closed?: boolean}).closed)
}

/**
 * Deletes every fixture created by this process, plus any open board named
 * exactly after this run.
 *
 * With E2E_RUN_ID set — the sweep-script and CI case — this process may never
 * have created anything, and the exact-name lookup is all it has to go on.
 * The board scan itself has no index lag, so nothing created through the CLI
 * (which the tracking set never saw) can be missed.
 */
export async function cleanupRun(): Promise<void> {
  const boardIds = new Set<string>()
  if (runBoard) {
    boardIds.add(runBoard.boardId)
  }

  for (const board of await findFixtureBoards()) {
    if (board.name === RUN_BOARD_NAME) {
      boardIds.add(board.id)
    }
  }

  const cardIds = [...createdCards]
  for (const boardId of boardIds) {
    // eslint-disable-next-line no-await-in-loop -- small, bounded, and cleanup runs after the suite anyway
    cardIds.push(...(await allBoardCards(boardId)))
  }

  await deleteAllCards(cardIds)
  for (const boardId of boardIds) {
    // eslint-disable-next-line no-await-in-loop -- see above
    await closeBoard(boardId)
  }

  resetRunState()
}

/**
 * Reclaims fixtures left behind by a crashed run: deletes their cards and
 * closes every prefixed board older than an hour.
 *
 * Age comes from the epoch embedded in the board name (see RUN_BOARD_NAME) —
 * Trello's own timestamps are unreliable for API-created boards. The age
 * filter is what makes the sweep safe to run while another suite is in
 * flight: it can only ever reclaim boards no live run still owns, since a
 * run lasts minutes.
 *
 * @returns How many boards were closed.
 */
export async function sweepStale(): Promise<number> {
  const cutoff = Date.now() - 3_600_000
  const stale = (await findFixtureBoards()).filter((board) => {
    const epoch = boardEpoch(board.name)
    // A name with no parseable epoch is treated as brand new, so a fixture
    // is never reclaimed by a naming artefact.
    return epoch !== undefined && epoch <= cutoff
  })

  for (const board of stale) {
    // eslint-disable-next-line no-await-in-loop -- sequential reclamation keeps request bursts gentle
    await deleteAllCards(await allBoardCards(board.id))
    // eslint-disable-next-line no-await-in-loop -- see above
    await closeBoard(board.id)
  }

  return stale.length
}

/**
 * Reads an attachment's raw bytes from Trello's download endpoint.
 *
 * Pinned by probing: the attachment's `url` field (a trello.com page url)
 * rejects API credentials outright, and the download endpoint accepts only
 * header-form OAuth — key/token query params there still get a 401. With the
 * header it returns the stored bytes verbatim.
 *
 * @param cardId The id of the card holding the attachment.
 * @param attachmentId The attachment id.
 * @param name The attachment's file name, as stored.
 * @returns The file content.
 */
export async function fetchAttachmentBody(cardId: string, attachmentId: string, name: string): Promise<Buffer> {
  const {apiKey, apiToken} = requireEnv()

  const response = await fetch(`${API_BASE}/cards/${cardId}/attachments/${attachmentId}/download/${encodeURIComponent(name)}`, {
    headers: {authorization: `OAuth oauth_consumer_key="${apiKey}", oauth_token="${apiToken}"`},
  })
  if (!response.ok) {
    throw new Error(`fetchAttachmentBody failed: ${response.status}`)
  }

  return Buffer.from(await response.arrayBuffer())
}

/**
 * Polls search until a card with the exact name is findable, then returns it.
 *
 * Trello's search index is asynchronous and slow for fresh boards — measured
 * at roughly ninety seconds for a card on a board created moments earlier —
 * so a single search would race, and the deadline here must far exceed the
 * lag, not just it by a little. It polls, so a warm index costs one request.
 *
 * @param name The exact card name to wait for.
 * @returns The card id once the index exposes it.
 * @throws {Error} If the deadline passes first — a silent return here would
 *   let a `before` hook "succeed" and defer the real failure into a confusing
 *   assertion error later.
 */
export async function waitForSearchable(name: string): Promise<string> {
  const deadline = Date.now() + 240_000

  while (Date.now() < deadline) {
    // eslint-disable-next-line no-await-in-loop -- sequential polling is the point: each check must follow the previous wait
    const {body, status} = await call('GET', '/search', {cards: '50', modelTypes: 'cards', query: name})
    if (status !== 200) {
      throw new Error(`waitForSearchable failed: ${status} ${JSON.stringify(body)}`)
    }

    const cards = ((body as {cards?: Array<{id: string; name: string}>}).cards ?? []).filter(
      (card) => card.name === name,
    )
    if (cards.length > 0) {
      return cards[0]!.id
    }

    // eslint-disable-next-line no-await-in-loop -- see above
    await new Promise((resolve) => {
      setTimeout(resolve, 1000)
    })
  }

  throw new Error(`waitForSearchable: no card named "${name}" became searchable in time`)
}
