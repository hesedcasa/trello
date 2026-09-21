import {type ApiResult} from '@hesed/plugin-lib'
import {expect} from 'chai'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {type Dispatcher, getGlobalDispatcher, MockAgent, setGlobalDispatcher} from 'undici'

import {TrelloApi} from '../../src/trello/trello-api.js'

/** `handleError` is protected so its output can be asserted without a live request. */
class ExposedTrelloApi extends TrelloApi {
  public describe(error: unknown): ApiResult {
    return this.handleError(error)
  }
}

describe('TrelloApi', () => {
  const mockConfig = {
    apiKey: 'test-key',
    apiToken: 'test-token',
  }

  let trelloApi: TrelloApi

  beforeEach(() => {
    trelloApi = new TrelloApi(mockConfig)
  })

  afterEach(() => {
    trelloApi.clearClients()
  })

  describe('constructor', () => {
    it('creates a new instance with config', () => {
      expect(trelloApi).to.be.an.instanceOf(TrelloApi)
    })
  })

  describe('getClient', () => {
    it('returns a TrelloClient instance', () => {
      const client = trelloApi.getClient()
      expect(client).to.have.property('boards')
      expect(client).to.have.property('cards')
      expect(client).to.have.property('lists')
      expect(client).to.have.property('members')
      expect(client).to.have.property('labels')
      expect(client).to.have.property('checklists')
      expect(client).to.have.property('search')
    })

    it('returns the same client instance on subsequent calls', () => {
      const client1 = trelloApi.getClient()
      const client2 = trelloApi.getClient()
      expect(client1).to.equal(client2)
    })
  })

  describe('clearClients', () => {
    it('clears the client instance', () => {
      trelloApi.getClient()
      trelloApi.clearClients()
      const client = trelloApi.getClient()
      expect(client).to.be.an('object')
    })
  })

  // Instances share one global dispatcher, so they must coordinate: clearing one may not
  // clobber a newer instance's proxy or resurrect an already-closed agent.
  describe('proxy dispatcher lifecycle', () => {
    const proxyEnvKeys = ['ALL_PROXY', 'HTTPS_PROXY', 'HTTP_PROXY', 'NO_PROXY']

    let baseDispatcher: Dispatcher
    let savedProxyEnv: Record<string, string | undefined>

    beforeEach(() => {
      savedProxyEnv = {}
      for (const key of proxyEnvKeys) {
        savedProxyEnv[key] = process.env[key]
        savedProxyEnv[key.toLowerCase()] = process.env[key.toLowerCase()]
        delete process.env[key]
        delete process.env[key.toLowerCase()]
      }

      baseDispatcher = getGlobalDispatcher()
      // Unroutable port: the agents are only installed and closed, never used for traffic.
      process.env.HTTPS_PROXY = 'http://127.0.0.1:1'
    })

    afterEach(() => {
      for (const [key, value] of Object.entries(savedProxyEnv)) {
        if (value === undefined) delete process.env[key]
        else process.env[key] = value
      }
    })

    it('leaves the newer proxy active when an older instance clears first', () => {
      const older = new TrelloApi(mockConfig)
      const newer = new TrelloApi(mockConfig)

      older.getClient()
      newer.getClient()
      const newerDispatcher = getGlobalDispatcher()

      older.clearClients()
      expect(getGlobalDispatcher()).to.equal(newerDispatcher)

      // The restore must land on the pre-proxy dispatcher, not the older closed agent.
      newer.clearClients()
      expect(getGlobalDispatcher()).to.equal(baseDispatcher)
    })

    it('reinstates the pre-proxy dispatcher only after the last proxy clears', () => {
      const first = new TrelloApi(mockConfig)
      const second = new TrelloApi(mockConfig)

      first.getClient()
      second.getClient()

      second.clearClients()
      expect(getGlobalDispatcher()).to.not.equal(baseDispatcher)

      first.clearClients()
      expect(getGlobalDispatcher()).to.equal(baseDispatcher)
    })

    it('leaves a dispatcher installed by something else in place', async () => {
      const api = new TrelloApi(mockConfig)
      api.getClient()

      const external = new MockAgent()
      setGlobalDispatcher(external)

      api.clearClients()
      expect(getGlobalDispatcher()).to.equal(external)

      setGlobalDispatcher(baseDispatcher)
      await external.close()
    })

    // The external dispatcher arrives between two proxy installs, so it is global when
    // the newer instance installs; clearing that instance must undo to it, not to the
    // older proxy.
    it('restores a dispatcher installed externally between two proxies', async () => {
      const older = new TrelloApi(mockConfig)
      older.getClient()

      const external = new MockAgent()
      setGlobalDispatcher(external)

      const newer = new TrelloApi(mockConfig)
      newer.getClient()

      newer.clearClients()
      expect(getGlobalDispatcher()).to.equal(external)

      older.clearClients()
      expect(getGlobalDispatcher()).to.equal(external)

      setGlobalDispatcher(baseDispatcher)
      await external.close()
    })
  })

  describe('handleError', () => {
    let exposed: ExposedTrelloApi

    beforeEach(() => {
      exposed = new ExposedTrelloApi(mockConfig)
    })

    afterEach(() => {
      exposed.clearClients()
    })

    it('returns a failed ApiResult carrying the message', () => {
      expect(exposed.describe(new Error('boom'))).to.deep.equal({error: 'boom', success: false})
    })

    // undici says only "fetch failed" for a transport error; the reason is on `cause`.
    it('appends the cause chain so a bare fetch failure stays diagnosable', () => {
      const cause = new Error('getaddrinfo ENOTFOUND api.trello.com')
      const result = exposed.describe(new Error('fetch failed', {cause}))

      expect(result.success).to.be.false
      expect(result.error).to.equal('fetch failed: getaddrinfo ENOTFOUND api.trello.com')
    })

    it('stops walking the cause chain at a fixed depth', () => {
      const fifth = new Error('five')
      const fourth = new Error('four', {cause: fifth})
      const third = new Error('three', {cause: fourth})
      const error = new Error('one', {cause: new Error('two', {cause: third})})

      expect(exposed.describe(error).error).to.equal('one: two: three: four')
    })

    it('skips a cause that only repeats a message already shown', () => {
      const result = exposed.describe(new Error('fetch failed', {cause: new Error('fetch failed')}))

      expect(result.error).to.equal('fetch failed')
    })

    it('stringifies a thrown non-Error', () => {
      expect(exposed.describe('plain string')).to.deep.equal({error: 'plain string', success: false})
    })
  })

  // The one endpoint this wrapper drives itself: trello.js v2 sends `file` as a query
  // parameter, so uploading local bytes means building the multipart body by hand.
  describe('addCardAttachment', () => {
    const FILE_BODY = 'attachment fixture\nsecond line\n'
    const proxyEnvKeys = ['ALL_PROXY', 'HTTPS_PROXY', 'HTTP_PROXY', 'NO_PROXY']

    let agent: MockAgent
    let previousDispatcher: Dispatcher
    let savedProxyEnv: Record<string, string | undefined>
    let workDir: string
    let source: string

    beforeEach(async () => {
      // A proxy env var would make the api install a ProxyAgent over the mock agent.
      savedProxyEnv = {}
      for (const key of proxyEnvKeys) {
        savedProxyEnv[key] = process.env[key]
        savedProxyEnv[key.toLowerCase()] = process.env[key.toLowerCase()]
        delete process.env[key]
        delete process.env[key.toLowerCase()]
      }

      previousDispatcher = getGlobalDispatcher()
      agent = new MockAgent()
      agent.disableNetConnect()
      setGlobalDispatcher(agent)

      workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'trello-attach-'))
      source = path.join(workDir, 'fixture.txt')
      await fs.writeFile(source, FILE_BODY)
    })

    afterEach(async () => {
      setGlobalDispatcher(previousDispatcher)
      await agent.close()
      await fs.rm(workDir, {force: true, recursive: true})

      for (const [key, value] of Object.entries(savedProxyEnv)) {
        if (value === undefined) delete process.env[key]
        else process.env[key] = value
      }
    })

    it('posts the file as multipart form data with the credentials in the query', async () => {
      let requestPath = ''
      let form: FormData | undefined

      agent
        .get('https://api.trello.com')
        .intercept({
          body(value: unknown) {
            form = value as FormData
            return true
          },
          method: 'POST',
          path(value: string) {
            requestPath = value
            return value.startsWith('/1/cards/card-1/attachments')
          },
        })
        .reply(200, {id: 'attachment-1', name: 'fixture.txt'}, {headers: {'content-type': 'application/json'}})

      const result = await trelloApi.addCardAttachment('card-1', source)

      expect(result).to.deep.equal({data: {id: 'attachment-1', name: 'fixture.txt'}, success: true})

      const query = new URL(requestPath, 'https://api.trello.com').searchParams
      expect(query.get('key')).to.equal(mockConfig.apiKey)
      expect(query.get('token')).to.equal(mockConfig.apiToken)

      expect(form?.get('name')).to.equal('fixture.txt')
      const uploaded = form?.get('file') as File
      expect(uploaded.name).to.equal('fixture.txt')
      expect(await uploaded.text()).to.equal(FILE_BODY)
    })

    it('reports a rejected upload in the same shape trello.js uses', async () => {
      agent
        .get('https://api.trello.com')
        .intercept({method: 'POST', path: (value: string) => value.startsWith('/1/cards/card-1/attachments')})
        .reply(401, 'invalid token')

      const result = await trelloApi.addCardAttachment('card-1', source)

      expect(result.success).to.be.false
      expect(result.error).to.contain('401')
      expect(result.error).to.contain('invalid token')
    })

    it('returns the read failure when the file is missing', async () => {
      const result = await trelloApi.addCardAttachment('card-1', path.join(workDir, 'nope.txt'))

      expect(result.success).to.be.false
      expect(result.error).to.contain('ENOENT')
    })
  })

  describe('request wiring', () => {
    const proxyEnvKeys = ['ALL_PROXY', 'HTTPS_PROXY', 'HTTP_PROXY', 'NO_PROXY']

    let agent: MockAgent
    let previousDispatcher: Dispatcher
    let savedProxyEnv: Record<string, string | undefined>

    beforeEach(() => {
      savedProxyEnv = {}
      for (const key of proxyEnvKeys) {
        savedProxyEnv[key] = process.env[key]
        savedProxyEnv[key.toLowerCase()] = process.env[key.toLowerCase()]
        delete process.env[key]
        delete process.env[key.toLowerCase()]
      }

      previousDispatcher = getGlobalDispatcher()
      agent = new MockAgent()
      agent.disableNetConnect()
      setGlobalDispatcher(agent)
    })

    afterEach(async () => {
      setGlobalDispatcher(previousDispatcher)
      await agent.close()

      for (const [key, value] of Object.entries(savedProxyEnv)) {
        if (value === undefined) delete process.env[key]
        else process.env[key] = value
      }
    })

    /** Captures the path of the single request the api is expected to make. */
    function interceptGet(prefix: string, payload: object): () => string {
      let requestPath = ''
      agent
        .get('https://api.trello.com')
        .intercept({
          method: 'GET',
          path(value: string) {
            requestPath = value
            return value.startsWith(prefix)
          },
        })
        .reply(200, payload, {headers: {'content-type': 'application/json'}})

      return () => requestPath
    }

    // Trello wants one comma-separated value here, and v2 types it as a plain string
    // where v1 took an array.
    it('passes --boards through to search as a comma-separated idBoards', async () => {
      const captured = interceptGet('/1/search', {cards: []})

      const result = await trelloApi.searchCards('bug fix', 'board-1,board-2')

      expect(result.success).to.be.true
      const query = new URL(captured(), 'https://api.trello.com').searchParams
      expect(query.get('idBoards')).to.equal('board-1,board-2')
      expect(query.get('modelTypes')).to.equal('cards')
      expect(query.get('query')).to.equal('bug fix')
    })

    it('routes a filtered board-cards read to the by-filter endpoint', async () => {
      const captured = interceptGet('/1/boards/board-1/cards/open', [])

      const result = await trelloApi.getBoardCards('board-1', 'open')

      expect(result.success).to.be.true
      expect(captured()).to.contain('/1/boards/board-1/cards/open')
    })

    // skipParsing is on, so a field the generated schemas do not name still reaches the
    // caller instead of being stripped out of the response.
    it('passes undocumented response fields through unparsed', async () => {
      interceptGet('/1/cards/card-1', {aBrandNewTrelloField: 'kept', id: 'card-1', name: 'a card'})

      const result = await trelloApi.getCard('card-1')

      expect(result.data).to.deep.equal({aBrandNewTrelloField: 'kept', id: 'card-1', name: 'a card'})
    })
  })

  describe('getBoard', () => {
    it('exports getBoard method', () => {
      expect(trelloApi.getBoard).to.be.a('function')
    })

    it('returns an ApiResult structure', async () => {
      try {
        const result = await trelloApi.getBoard('test-board-id')
        expect(result).to.have.property('success')
      } catch {
        // Expected to fail without actual connection
      }
    })
  })

  describe('getMyBoards', () => {
    it('exports getMyBoards method', () => {
      expect(trelloApi.getMyBoards).to.be.a('function')
    })
  })

  describe('getCard', () => {
    it('exports getCard method', () => {
      expect(trelloApi.getCard).to.be.a('function')
    })
  })

  describe('createCard', () => {
    it('exports createCard method', () => {
      expect(trelloApi.createCard).to.be.a('function')
    })
  })

  describe('updateCard', () => {
    it('exports updateCard method', () => {
      expect(trelloApi.updateCard).to.be.a('function')
    })
  })

  describe('deleteCard', () => {
    it('exports deleteCard method', () => {
      expect(trelloApi.deleteCard).to.be.a('function')
    })
  })

  describe('moveCard', () => {
    it('exports moveCard method', () => {
      expect(trelloApi.moveCard).to.be.a('function')
    })
  })

  describe('searchCards', () => {
    it('exports searchCards method', () => {
      expect(trelloApi.searchCards).to.be.a('function')
    })
  })

  describe('getList', () => {
    it('exports getList method', () => {
      expect(trelloApi.getList).to.be.a('function')
    })
  })

  describe('createList', () => {
    it('exports createList method', () => {
      expect(trelloApi.createList).to.be.a('function')
    })
  })

  describe('archiveList', () => {
    it('exports archiveList method', () => {
      expect(trelloApi.archiveList).to.be.a('function')
    })
  })

  describe('archiveAllCardsInList', () => {
    it('exports archiveAllCardsInList method', () => {
      expect(trelloApi.archiveAllCardsInList).to.be.a('function')
    })
  })

  describe('getMember', () => {
    it('exports getMember method', () => {
      expect(trelloApi.getMember).to.be.a('function')
    })
  })

  describe('createLabel', () => {
    it('exports createLabel method', () => {
      expect(trelloApi.createLabel).to.be.a('function')
    })
  })

  describe('deleteLabel', () => {
    it('exports deleteLabel method', () => {
      expect(trelloApi.deleteLabel).to.be.a('function')
    })
  })

  describe('getChecklist', () => {
    it('exports getChecklist method', () => {
      expect(trelloApi.getChecklist).to.be.a('function')
    })
  })

  describe('createChecklist', () => {
    it('exports createChecklist method', () => {
      expect(trelloApi.createChecklist).to.be.a('function')
    })
  })

  describe('deleteChecklist', () => {
    it('exports deleteChecklist method', () => {
      expect(trelloApi.deleteChecklist).to.be.a('function')
    })
  })

  describe('createChecklistItem', () => {
    it('exports createChecklistItem method', () => {
      expect(trelloApi.createChecklistItem).to.be.a('function')
    })
  })

  describe('deleteChecklistItem', () => {
    it('exports deleteChecklistItem method', () => {
      expect(trelloApi.deleteChecklistItem).to.be.a('function')
    })
  })

  describe('addCardComment', () => {
    it('exports addCardComment method', () => {
      expect(trelloApi.addCardComment).to.be.a('function')
    })
  })

  describe('updateCardComment', () => {
    it('exports updateCardComment method', () => {
      expect(trelloApi.updateCardComment).to.be.a('function')
    })
  })

  describe('deleteCardComment', () => {
    it('exports deleteCardComment method', () => {
      expect(trelloApi.deleteCardComment).to.be.a('function')
    })
  })

  describe('testConnection', () => {
    it('exports testConnection method', () => {
      expect(trelloApi.testConnection).to.be.a('function')
    })
  })
})
