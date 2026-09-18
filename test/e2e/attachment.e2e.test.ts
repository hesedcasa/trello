import {expect} from 'chai'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import {cleanupRun, fetchAttachmentBody, RUN_ID, seedBoard, seedCard} from './fixtures.js'
import {createConfigDir, removeConfigDir, requireEnv, runCli, runCliJson} from './helpers.js'

const FILE_BODY = 'e2e attachment fixture\nsecond line\n'

type Attachment = {id: string; name?: string; url?: string}
type Comment = {data: {text: string}; id: string}

describe('e2e: attachments', () => {
  let configDir: string
  let workDir: string
  let cardId: string

  before(async () => {
    configDir = await createConfigDir()
    workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'trello-e2e-files-'))
    const seeded = await seedBoard()
    cardId = await seedCard(seeded.lists.todo, `[e2e ${RUN_ID}] attachment host`)
  })

  // allSettled + finally: a failed delete must not skip the backstop sweep,
  // the token-bearing config dir, or the temp file directory.
  after(async () => {
    try {
      await cleanupRun()
    } finally {
      await removeConfigDir(configDir)
      await fs.rm(workDir, {force: true, recursive: true})
    }
  })

  /** The attachment metadata, read straight from the REST API. */
  async function listAttachmentsViaApi(): Promise<Attachment[]> {
    const {apiKey, apiToken} = requireEnv()
    const response = await fetch(
      `https://api.trello.com/1/cards/${cardId}/attachments?key=${encodeURIComponent(apiKey)}&token=${encodeURIComponent(apiToken)}`,
    )
    return (await response.json()) as Attachment[]
  }

  it('uploads a file whose bytes come back intact', async () => {
    const source = path.join(workDir, 'fixture.txt')
    await fs.writeFile(source, FILE_BODY)

    const uploaded = await runCliJson<{data: Attachment; success: boolean}>(
      ['trello', 'card', 'attach', cardId, source],
      configDir,
    )
    expect(uploaded.success).to.be.true
    const attachmentId = uploaded.data.id
    expect(attachmentId).to.be.a('string').and.not.empty

    // Byte-for-byte through the attachment's pre-signed url — the oracle
    // read, independent of the CLI's upload code path.
    const attachments = await listAttachmentsViaApi()
    const attachment = attachments.find((candidate) => candidate.id === attachmentId)
    expect(attachment, 'uploaded attachment missing from the card').to.exist
    expect(attachment!.name).to.equal('fixture.txt')

    const body = await fetchAttachmentBody(cardId, attachmentId, attachment!.name!)
    expect(body.toString('utf8')).to.equal(FILE_BODY)
  })

  it('posts the --comment alongside the upload', async () => {
    const source = path.join(workDir, 'second.txt')
    await fs.writeFile(source, FILE_BODY)

    const uploaded = await runCliJson<{data: {comment: Comment}; success: boolean}>(
      ['trello', 'card', 'attach', cardId, source, '--comment', 'see attached'],
      configDir,
    )
    expect(uploaded.success).to.be.true

    const comments = await runCliJson<{data: Comment[]; success: boolean}>(['trello', 'card', 'comments', cardId], configDir)
    // The command prepends the flag text to the attachment links it posts, so
    // assert on containment within the joined texts, not array membership.
    expect(comments.data.map((comment) => comment.data.text).join('\n')).to.contain('see attached')
  })

  it('fails cleanly when the file does not exist', async () => {
    // Pinned as observed: the attach command verifies readability up front
    // and returns an ENOENT ApiResult — exit stays 0.
    const {code, stdout} = await runCli(['trello', 'card', 'attach', cardId, path.join(workDir, 'nope.txt')], configDir)
    expect(code).to.equal(0)

    const payload = JSON.parse(stdout) as {error: string; success: boolean}
    expect(payload.success).to.be.false
    expect(payload.error).to.contain('ENOENT')
  })
})
