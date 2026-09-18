import {expect} from 'chai'

import {cleanupRun, RUN_ID, seedBoard} from './fixtures.js'
import {createConfigDir, removeConfigDir, runCliJson} from './helpers.js'

type Card = {desc?: string; name: string}
type Comment = {data: {text: string}; id: string}

describe('e2e: content fidelity', () => {
  let configDir: string
  let todo: string

  before(async () => {
    configDir = await createConfigDir()
    todo = (await seedBoard()).lists.todo
  })

  after(async () => {
    try {
      await cleanupRun()
    } finally {
      await removeConfigDir(configDir)
    }
  })

  async function createCard(name: string, desc?: string): Promise<{card: Card; cardId: string}> {
    const args = ['trello', 'card', 'create', todo, name]
    if (desc) {
      args.push('--desc', desc)
    }

    const created = await runCliJson<{data: {id: string}; success: boolean}>(args, configDir)
    expect(created.success).to.be.true

    const fetched = await runCliJson<{data: Card; success: boolean}>(['trello', 'card', created.data.id], configDir)
    expect(fetched.success).to.be.true
    return {card: fetched.data, cardId: created.data.id}
  }

  // Trello does no markup transformation, so the whole contract is: what was
  // sent comes back byte-identical.
  it('preserves special characters in the description verbatim', async () => {
    const desc = String.raw`a=b & c<d> "quotes" \backslash`

    const {card} = await createCard(`[e2e ${RUN_ID}] content special`, desc)
    expect(card.desc).to.equal(desc)
  })

  it('preserves unicode and emoji in the name', async () => {
    const name = `[e2e ${RUN_ID}] 🎸 café ñ`

    const {card} = await createCard(name)
    expect(card.name).to.equal(name)
  })

  it('preserves comment text verbatim', async () => {
    const {cardId} = await createCard(`[e2e ${RUN_ID}] content comment`)
    const text = 'plain comment text'

    const added = await runCliJson<{data: {id: string}; success: boolean}>(['trello', 'comment', cardId, text], configDir)
    expect(added.success).to.be.true

    const comments = await runCliJson<{data: Comment[]; success: boolean}>(['trello', 'card', 'comments', cardId], configDir)
    const comment = comments.data.find((candidate) => candidate.id === added.data.id)
    expect(comment, 'comment missing from the card').to.exist
    expect(comment!.data.text).to.equal(text)
  })
})
