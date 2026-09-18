import {expect} from 'chai'

import {cleanupRun, seedBoard} from './fixtures.js'
import {createConfigDir, redactSecret, removeConfigDir, runCli, runCliJson} from './helpers.js'

type Failure = {error: string; success: false}

describe('e2e: connection', () => {
  let configDir: string
  let boardId: string

  before(async () => {
    configDir = await createConfigDir()
    boardId = (await seedBoard()).boardId
  })

  // cleanupRun too, not just the config dir: this suite seeds the run board,
  // and a targeted run (`e2e:mocha -- --grep connection`) bypasses the
  // wrapper's sweep, so without this the board waits an hour for the stale
  // sweep instead of closing with the suite.
  after(async () => {
    try {
      await cleanupRun()
    } finally {
      await removeConfigDir(configDir)
    }
  })

  it('authenticates with the default profile', async () => {
    const {code} = await runCli(['trello', 'auth', 'test'], configDir)
    expect(code).to.equal(0)
  })

  // A synthetic secret, not the real API token: chai renders the actual
  // string in its failure message, so if this used the live token the one
  // circumstance where this test fails (a redaction regression) would print
  // the credential into the terminal and CI logs. redactSecret is a pure
  // string function, so a synthetic value proves the same property with zero
  // exposure.
  it('redacts a credential from captured output', () => {
    const secret = 'SEKRET-PLACEHOLDER-0001'
    const text = `some output embedding ${secret} in the middle of it`

    expect(redactSecret(text, secret)).to.not.include(secret)
  })

  it('leaves text untouched when there is no secret to redact', () => {
    const text = 'plain output with no secret in it'

    expect(redactSecret(text, undefined)).to.equal(text)
    expect(redactSecret(text, '')).to.equal(text)
  })

  it('fails auth test on a bad token', async () => {
    const {code} = await runCli(['trello', 'auth', 'test', '--profile', 'broken'], configDir)
    // Pinned as observed: oclif reports a failed auth test with exit code 2.
    expect(code).to.equal(2)
  })

  it('errors on an unknown profile rather than falling back to the default', async () => {
    const {code, stdout} = await runCli(['trello', 'board', 'list', '--profile', 'nosuch'], configDir)
    expect(code).to.equal(1)
    expect(JSON.parse(stdout)).to.deep.equal({error: 'Missing authentication config.'})
  })

  // Pinned as observed, and unlike the jira suite: the trello data commands
  // return a success:false ApiResult but still exit 0 — no command code path
  // turns an API failure into a non-zero exit. Asserting both halves pins the
  // full contract, so a future fix that raises the exit code becomes a
  // visible, deliberate change.
  it('reports success:false at exit 0 when the API rejects the token', async () => {
    const {code, stdout} = await runCli(['trello', 'board', 'list', '--profile', 'broken'], configDir)
    expect(code).to.equal(0)

    const payload = JSON.parse(stdout) as Failure
    expect(payload.success).to.be.false
    expect(payload.error).to.contain('401')
  })

  it('reports the HTTP status for a single missing resource under a bad token', async () => {
    const {code, stdout} = await runCli(['trello', 'board', boardId, '--profile', 'broken'], configDir)
    expect(code).to.equal(0)

    const payload = JSON.parse(stdout) as Failure
    expect(payload.success).to.be.false
    expect(payload.error).to.contain('401')
  })

  it('still lists boards for the default profile', async () => {
    const payload = await runCliJson<{data: Array<{id: string}>; success: boolean}>(['trello', 'board', 'list'], configDir)
    expect(payload.success).to.be.true
    expect(payload.data.map((board) => board.id)).to.include(boardId)
  })
})
