import {expect} from 'chai'

import {cleanupRun, RUN_BOARD_NAME, RUN_ID, seedBoard, seedCard, waitForSearchable} from './fixtures.js'
import {createConfigDir, removeConfigDir, requireEnv, runCliJson, runCliOk} from './helpers.js'

type Board = {id: string; name: string}
type Card = {id: string; name: string}

// Suite timeout, not just the mocha default: the before hook can legitimately
// spend ~90s waiting for Trello's search index to expose the seeded card, and
// the default 120s would leave too little headroom on a slow day.
describe('e2e: read paths', function (this: Mocha.Suite) {
  this.timeout(300_000)
  let configDir: string
  let boardId: string
  let lists: {doing: string; done: string; todo: string}
  let cardOneId: string
  let cardTwoId: string
  let meId: string

  const CARD_ONE_NAME = `[e2e ${RUN_ID}] read one`
  const CARD_TWO_NAME = `[e2e ${RUN_ID}] read two`

  before(async () => {
    configDir = await createConfigDir()
    const seeded = await seedBoard()
    boardId = seeded.boardId
    lists = seeded.lists
    cardOneId = await seedCard(lists.todo, CARD_ONE_NAME)
    cardTwoId = await seedCard(lists.todo, CARD_TWO_NAME)
    await waitForSearchable(CARD_ONE_NAME)

    // The authenticated member, fetched directly: the identity every
    // membership assertion below is checked against.
    const {apiKey, apiToken} = requireEnv()
    const response = await fetch(
      `https://api.trello.com/1/members/me?fields=id&key=${encodeURIComponent(apiKey)}&token=${encodeURIComponent(apiToken)}`,
    )
    meId = ((await response.json()) as {id: string}).id
  })

  after(async () => {
    try {
      await cleanupRun()
    } finally {
      await removeConfigDir(configDir)
    }
  })

  it('lists boards and includes the run board', async () => {
    const payload = await runCliJson<{data: Board[]; success: boolean}>(['trello', 'board', 'list'], configDir)
    expect(payload.success).to.be.true

    const runBoard = payload.data.find((board) => board.id === boardId)
    expect(runBoard, 'run board missing from board list').to.exist
    expect(runBoard!.name).to.equal(RUN_BOARD_NAME)
  })

  it('gets a single board by id', async () => {
    const payload = await runCliJson<{data: Board; success: boolean}>(['trello', 'board', boardId], configDir)
    expect(payload.success).to.be.true
    expect(payload.data.id).to.equal(boardId)
    expect(payload.data.name).to.equal(RUN_BOARD_NAME)
  })

  it('lists the seeded lists on the board', async () => {
    const payload = await runCliJson<{data: Array<{id: string; name: string}>; success: boolean}>(
      ['trello', 'board', 'lists', boardId],
      configDir,
    )
    expect(payload.success).to.be.true

    const names = payload.data.map((list) => list.name)
    expect(names).to.include.members(['To Do', 'Doing', 'Done'])
    expect(payload.data.map((list) => list.id)).to.include.members([lists.todo, lists.doing, lists.done])
  })

  it('lists the board cards', async () => {
    const payload = await runCliJson<{data: Card[]; success: boolean}>(['trello', 'board', 'cards', boardId], configDir)
    expect(payload.success).to.be.true
    expect(payload.data.map((card) => card.id)).to.include.members([cardOneId, cardTwoId])
  })

  it('lists the cards of a single list', async () => {
    const payload = await runCliJson<{data: Card[]; success: boolean}>(['trello', 'list', 'cards', lists.todo], configDir)
    expect(payload.success).to.be.true
    expect(payload.data.map((card) => card.id)).to.include.members([cardOneId, cardTwoId])
  })

  it('lists the board members', async () => {
    const payload = await runCliJson<{data: Array<{id: string}>; success: boolean}>(
      ['trello', 'board', 'members', boardId],
      configDir,
    )
    expect(payload.success).to.be.true
    expect(payload.data.map((member) => member.id)).to.include(meId)
  })

  it('gets the authenticated member', async () => {
    const payload = await runCliJson<{data: {id: string; username: string}; success: boolean}>(
      ['trello', 'member'],
      configDir,
    )
    expect(payload.success).to.be.true
    expect(payload.data.id).to.equal(meId)
  })

  it('starts the run board with an empty label list', async () => {
    // seedBoard opts out of Trello's default labels, so the empty array here
    // is a stable target — and proof the board really is ours.
    const payload = await runCliJson<{data: unknown[]; success: boolean}>(['trello', 'label', boardId], configDir)
    expect(payload.success).to.be.true
    expect(payload.data).to.deep.equal([])
  })

  it('finds a seeded card by search once the index exposes it', async () => {
    const payload = await runCliJson<{data: {cards: Card[]}; success: boolean}>(
      ['trello', 'card', 'search', CARD_TWO_NAME],
      configDir,
    )
    expect(payload.success).to.be.true
    expect(payload.data.cards.map((card) => card.id)).to.include(cardTwoId)
  })

  it('emits TOON rather than JSON under --toon', async () => {
    const {stdout} = await runCliOk(['trello', 'board', 'list', '--toon'], configDir)
    expect(() => JSON.parse(stdout)).to.throw()
    expect(stdout).to.contain('success: true')
    expect(stdout).to.contain(RUN_ID)
  })
})
