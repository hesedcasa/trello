import {expect} from 'chai'

import {cleanupRun, RUN_ID, seedBoard} from './fixtures.js'
import {createConfigDir, removeConfigDir, runCli, runCliJson} from './helpers.js'

type Card = {desc?: string; id: string; idList?: string; name: string}
type Comment = {data: {text: string}; id: string}
type Checklist = {checkItems: Array<{id: string; name: string}>; id: string}

describe('e2e: card lifecycle', () => {
  let configDir: string
  let boardId: string
  let lists: {doing: string; done: string; todo: string}

  before(async () => {
    configDir = await createConfigDir()
    const seeded = await seedBoard()
    boardId = seeded.boardId
    lists = seeded.lists
  })

  // Cards, lists and labels created through the CLI are not in the tracking
  // set, so cleanupRun's board scan is what reclaims them — it reads the
  // board directly, with no search-index lag to race.
  after(async () => {
    try {
      await cleanupRun()
    } finally {
      await removeConfigDir(configDir)
    }
  })

  async function createCard(name: string, desc?: string): Promise<string> {
    const args = ['trello', 'card', 'create', lists.todo, name]
    if (desc) {
      args.push('--desc', desc)
    }

    const payload = await runCliJson<{data: {id: string}; success: boolean}>(args, configDir)
    expect(payload.success).to.be.true
    return payload.data.id
  }

  async function getCard(cardId: string): Promise<Card> {
    const payload = await runCliJson<{data: Card; success: boolean}>(['trello', 'card', cardId], configDir)
    expect(payload.success).to.be.true
    return payload.data
  }

  it('creates a card and reads it back', async () => {
    const name = `[e2e ${RUN_ID}] lifecycle create`
    const cardId = await createCard(name)

    const card = await getCard(cardId)
    expect(card.id).to.equal(cardId)
    expect(card.name).to.equal(name)
  })

  it('updates the name and description', async () => {
    const cardId = await createCard(`[e2e ${RUN_ID}] lifecycle update`)
    const updatedName = `[e2e ${RUN_ID}] lifecycle updated`

    const {code} = await runCli(
      ['trello', 'card', 'update', cardId, '--fields', `name=${updatedName}`, '--fields', 'desc=updated description'],
      configDir,
    )
    expect(code).to.equal(0)

    const card = await getCard(cardId)
    expect(card.name).to.equal(updatedName)
    expect(card.desc).to.equal('updated description')
  })

  it('moves a card to another list', async () => {
    const cardId = await createCard(`[e2e ${RUN_ID}] lifecycle move`)

    const {code} = await runCli(['trello', 'card', 'move', cardId, lists.doing], configDir)
    expect(code).to.equal(0)

    const card = await getCard(cardId)
    expect(card.idList).to.equal(lists.doing)
  })

  it('adds, updates and deletes a comment', async () => {
    const cardId = await createCard(`[e2e ${RUN_ID}] lifecycle comments`)

    const added = await runCliJson<{data: Comment; success: boolean}>(['trello', 'comment', cardId, 'first'], configDir)
    expect(added.success).to.be.true
    const commentId = added.data.id

    const comments = await runCliJson<{data: Comment[]; success: boolean}>(
      ['trello', 'card', 'comments', cardId],
      configDir,
    )
    expect(comments.data.map((comment) => comment.id)).to.include(commentId)

    const {code: updateCode} = await runCli(
      ['trello', 'comment', 'update', cardId, commentId, 'edited body'],
      configDir,
    )
    expect(updateCode).to.equal(0)

    const afterUpdate = await runCliJson<{data: Comment[]}>(['trello', 'card', 'comments', cardId], configDir)
    expect(afterUpdate.data.find((comment) => comment.id === commentId)!.data.text).to.equal('edited body')

    const {code: deleteCode} = await runCli(['trello', 'comment', 'delete', cardId, commentId], configDir)
    expect(deleteCode).to.equal(0)

    const afterDelete = await runCliJson<{data: Comment[]}>(['trello', 'card', 'comments', cardId], configDir)
    expect(afterDelete.data.map((comment) => comment.id)).to.not.include(commentId)
  })

  it('creates a checklist, manages its items, then deletes it', async () => {
    const cardId = await createCard(`[e2e ${RUN_ID}] lifecycle checklist`)

    const created = await runCliJson<{data: Checklist; success: boolean}>(
      ['trello', 'checklist', 'create', cardId, 'Steps'],
      configDir,
    )
    expect(created.success).to.be.true
    const checklistId = created.data.id

    const item = await runCliJson<{data: {id: string}; success: boolean}>(
      ['trello', 'checklist', 'add-item', checklistId, 'item one'],
      configDir,
    )
    expect(item.success).to.be.true
    const itemId = item.data.id

    const fetched = await runCliJson<{data: Checklist}>(['trello', 'checklist', checklistId], configDir)
    expect(fetched.data.checkItems.map((checkItem) => checkItem.id)).to.include(itemId)

    const {code: deleteItemCode} = await runCli(['trello', 'checklist', 'delete-item', checklistId, itemId], configDir)
    expect(deleteItemCode).to.equal(0)

    const afterItemDelete = await runCliJson<{data: Checklist}>(['trello', 'checklist', checklistId], configDir)
    expect(afterItemDelete.data.checkItems.map((checkItem) => checkItem.id)).to.not.include(itemId)

    const {code: deleteCode} = await runCli(['trello', 'checklist', 'delete', checklistId], configDir)
    expect(deleteCode).to.equal(0)
  })

  it('creates a label, lists it, then deletes it', async () => {
    const labelName = `[e2e ${RUN_ID}] label`

    const created = await runCliJson<{data: {id: string}; success: boolean}>(
      ['trello', 'label', 'create', boardId, labelName, 'green'],
      configDir,
    )
    expect(created.success).to.be.true
    const labelId = created.data.id

    const listed = await runCliJson<{data: Array<{id: string}>; success: boolean}>(
      ['trello', 'label', boardId],
      configDir,
    )
    expect(listed.data.map((label) => label.id)).to.include(labelId)

    const {code} = await runCli(['trello', 'label', 'delete', labelId], configDir)
    expect(code).to.equal(0)

    const afterDelete = await runCliJson<{data: Array<{id: string}>}>(['trello', 'label', boardId], configDir)
    expect(afterDelete.data.map((label) => label.id)).to.not.include(labelId)
  })

  it('creates a list through the CLI, archives it, and reads it back closed', async () => {
    const created = await runCliJson<{data: {id: string}; success: boolean}>(
      ['trello', 'list', 'create', boardId, `[e2e ${RUN_ID}] extra list`],
      configDir,
    )
    expect(created.success).to.be.true
    const listId = created.data.id

    const beforeArchive = await runCliJson<{data: Array<{id: string}>; success: boolean}>(
      ['trello', 'board', 'lists', boardId],
      configDir,
    )
    expect(beforeArchive.data.map((list) => list.id)).to.include(listId)

    const {code} = await runCli(['trello', 'list', 'archive', listId], configDir)
    expect(code).to.equal(0)

    // Board lists default to open lists only, so the archived list dropping
    // out of that view is the archive taking effect...
    const afterArchive = await runCliJson<{data: Array<{id: string}>}>(['trello', 'board', 'lists', boardId], configDir)
    expect(afterArchive.data.map((list) => list.id)).to.not.include(listId)

    // ...while the list itself is still readable, now closed.
    const fetched = await runCliJson<{data: {closed: boolean}; success: boolean}>(['trello', 'list', listId], configDir)
    expect(fetched.success).to.be.true
    expect(fetched.data.closed).to.be.true
  })

  it('deletes the card, after which reading it fails', async () => {
    const cardId = await createCard(`[e2e ${RUN_ID}] lifecycle delete`)

    const {code} = await runCli(['trello', 'card', 'delete', cardId], configDir)
    expect(code).to.equal(0)

    // Pinned as observed: the trello data commands exit 0 even for a failed
    // read — success:false plus the HTTP status in the error is the whole
    // failure contract.
    const {code: readCode, stdout} = await runCli(['trello', 'card', cardId], configDir)
    expect(readCode).to.equal(0)

    const payload = JSON.parse(stdout) as {error: string; success: boolean}
    expect(payload.success).to.be.false
    expect(payload.error).to.contain('404')
  })
})
