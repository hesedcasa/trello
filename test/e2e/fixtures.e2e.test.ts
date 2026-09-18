import {expect} from 'chai'

import {boardClosed, boardEpoch, cardHttpStatus, cleanupRun, deleteCard, findFixtureBoards, isRunBoardName, resetRunState, RUN_BOARD_NAME, RUN_BOARD_PATTERN, RUN_ID, seedBoard, seedCard, sweepStale} from './fixtures.js'

describe('e2e: fixtures', () => {
  after(async () => {
    await cleanupRun()
  })

  it('seeds a board that is findable by its run name, then cleans it up', async () => {
    const {boardId} = await seedBoard()
    expect(boardId).to.be.a('string').and.not.empty

    const found = await findFixtureBoards()
    expect(found.map((board) => board.id)).to.include(boardId)

    await cleanupRun()

    // Closing — not deleting — is Trello's terminal state for a board, so
    // "cleaned up" means the board reports closed:true, not a 404.
    expect(await boardClosed(boardId), 'run board should be closed after cleanup').to.be.true
  })

  it('cleans up a card created moments earlier', async () => {
    // No search involved: cleanup must reclaim a just-created card through
    // the board scan and the created-card tracking alone, since Trello's
    // search index lags creation and a search-based cleanup would race.
    const {lists} = await seedBoard()
    const cardId = await seedCard(lists.todo, `[e2e ${RUN_ID}] fixture card`)
    await cleanupRun()

    const status = await cardHttpStatus(cardId)
    expect(status, `${cardId} should be gone, got HTTP ${status}`).to.equal(404)
  })

  it('tolerates deleting a card twice', async () => {
    const {lists} = await seedBoard()
    const cardId = await seedCard(lists.todo, `[e2e ${RUN_ID}] delete twice`)
    await deleteCard(cardId)
    await deleteCard(cardId)
  })

  it('leaves a fresh run board alone when sweeping', async () => {
    const {boardId} = await seedBoard()

    // The run board was created seconds ago, so the stale sweep — which is
    // safe to run while a suite is in flight — must not touch it.
    await sweepStale()

    expect(await boardClosed(boardId), 'sweep closed a fresh run board').to.be.false
  })

  // Pure-function checks of the naming contract the stale sweep reclaims by:
  // a trailing epoch millis is the board's age, and anything else reads as
  // brand new. Synthetic values, so no clock or live-board dependence.
  it('parses the epoch embedded in fixture board names', () => {
    expect(boardEpoch('[e2e-cli] run ab12 1726000000000')).to.equal(1_726_000_000_000)
    expect(boardEpoch('[e2e-cli] run ab12')).to.be.undefined
    expect(boardEpoch('[e2e-cli] run ab12 notanumber')).to.be.undefined
    expect(boardEpoch('[e2e-cli] run ab12 0')).to.be.undefined
    expect(boardEpoch('[e2e-cli] run ab12 -5')).to.be.undefined
  })

  // The sweep's blast-radius boundary: a board must match the *complete*
  // naming contract, so a user board that merely starts with the prefix —
  // "[e2e-cli] project 1", the motivating case — is never admitted.
  it('admits only full run-board names to destructive cleanup', () => {
    expect(RUN_BOARD_PATTERN.test(`[e2e-cli] run ${RUN_ID} 1726000000000`)).to.be.true
    expect(RUN_BOARD_PATTERN.test(RUN_BOARD_NAME)).to.be.true
    expect(RUN_BOARD_PATTERN.test('[e2e-cli] project 1')).to.be.false
    expect(RUN_BOARD_PATTERN.test('[e2e-cli] run ab12')).to.be.false
    expect(RUN_BOARD_PATTERN.test('[e2e-cli] run ab12 notanumber')).to.be.false
    expect(RUN_BOARD_PATTERN.test('[e2e-cli] run ab12 1726000000000 extra')).to.be.false
    expect(RUN_BOARD_PATTERN.test('my [e2e-cli] run ab12 1726000000000')).to.be.false
  })

  // Cleanup addresses a run's boards by run id, at any epoch: the epoch is
  // per process, so the sweep process can never reconstruct the exact name
  // the mocha process created its board under — an exact-name match would
  // orphan every interrupted run. A different epoch must still match; a
  // different run id, or a non-fixture name, must not.
  it('admits a run\'s boards to cleanup by run id, at any epoch', () => {
    expect(isRunBoardName(`[e2e-cli] run ${RUN_ID} 1726000000000`, RUN_ID)).to.be.true
    expect(isRunBoardName(`[e2e-cli] run ${RUN_ID} 1`, RUN_ID)).to.be.true
    expect(isRunBoardName(RUN_BOARD_NAME, RUN_ID)).to.be.true
    expect(isRunBoardName('[e2e-cli] run otherrun 1726000000000', RUN_ID)).to.be.false
    expect(isRunBoardName(`[e2e-cli] run ${RUN_ID}`, RUN_ID)).to.be.false
    expect(isRunBoardName('[e2e-cli] project 1', RUN_ID)).to.be.false
    // A run id with regex metacharacters matches only itself.
    expect(isRunBoardName('[e2e-cli] run .*+ 123', '.*+')).to.be.true
    expect(isRunBoardName('[e2e-cli] run x 123', '.*+')).to.be.false
  })

  it('seeds a fresh board after the previous one was cleaned up', async () => {
    // seedBoard caches per process, and cleanupRun resets that cache — a
    // suite that cleans up mid-file must not be left creating cards on a
    // closed board.
    const first = await seedBoard()
    await cleanupRun()
    resetRunState()

    const second = await seedBoard()
    expect(second.boardId).to.not.equal(first.boardId)
  })
})
