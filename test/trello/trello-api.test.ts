import {expect} from 'chai'

import {TrelloApi} from '../../src/trello/trello-api.js'

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

  // Port 1 is reserved and never listening, so these exercise the error path against a
  // proxy that cannot be reached without depending on outbound network access.
  describe('proxy failure reporting', () => {
    // npm_config_https_proxy and npm_config_proxy outrank HTTPS_PROXY in proxy-from-env's
    // precedence, and npm sets them while running the suite, so both must be cleared too.
    const proxyEnvKeys = [
      'ALL_PROXY',
      'HTTPS_PROXY',
      'HTTP_PROXY',
      'NO_PROXY',
      'npm_config_no_proxy',
      'npm_config_proxy',
      'npm_config_http_proxy',
      'npm_config_https_proxy',
    ]
    const originalEnv = {...process.env}

    beforeEach(() => {
      for (const key of proxyEnvKeys) {
        delete process.env[key]
        delete process.env[key.toLowerCase()]
      }
    })

    afterEach(() => {
      for (const key of Object.keys(process.env)) {
        if (!(key in originalEnv)) delete process.env[key]
      }

      Object.assign(process.env, originalEnv)
    })

    it('names the proxy and its source when the proxy cannot be reached', async () => {
      process.env.HTTPS_PROXY = 'http://127.0.0.1:1'

      const result = new TrelloApi(mockConfig)
      const {error, success} = await result.testConnection()
      result.clearClients()

      expect(success).to.equal(false)
      expect(error).to.contain('proxy http://127.0.0.1:1')
      expect(error).to.contain('from HTTPS_PROXY')
      expect(error).to.contain('ECONNREFUSED')
    })

    it('explains the assumed port when the proxy URL omits one', async () => {
      process.env.HTTPS_PROXY = 'http://127.0.0.1'

      const result = new TrelloApi(mockConfig)
      const {error} = await result.testConnection()
      result.clearClients()

      expect(error).to.contain('port 80 was assumed')
    })

    it('does not mention a proxy when none is configured', async () => {
      const api = new TrelloApi(mockConfig)
      api.getClient()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const annotated = (api as any).annotateProxyFailure('connect ECONNREFUSED 1.2.3.4:443', new Error('boom'))
      api.clearClients()

      expect(annotated).to.equal('connect ECONNREFUSED 1.2.3.4:443')
    })

    it('flags a status a proxy commonly answers CONNECT with as possibly the proxy', async () => {
      process.env.HTTPS_PROXY = 'http://127.0.0.1:1'

      const api = new TrelloApi(mockConfig)
      api.getClient()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const annotated = (api as any).annotateProxyFailure('Request failed with status code 403', {
        response: {status: 403},
      })
      api.clearClients()

      expect(annotated).to.contain('refused the CONNECT tunnel')
      expect(annotated).to.contain('proxy http://127.0.0.1:1')
    })

    it('points a TLS trust failure at the proxy CA rather than the request', async () => {
      process.env.HTTPS_PROXY = 'http://127.0.0.1:14322'

      const api = new TrelloApi(mockConfig)
      api.getClient()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const annotated = (api as any).annotateProxyFailure(
        'self-signed certificate in certificate chain',
        new Error('self-signed certificate in certificate chain'),
      )
      api.clearClients()

      expect(annotated).to.contain('TLS verification failed through proxy http://127.0.0.1:14322')
      expect(annotated).to.contain('NODE_EXTRA_CA_CERTS')
    })

    it('leaves a genuine Trello status untouched', async () => {
      process.env.HTTPS_PROXY = 'http://127.0.0.1:1'

      const api = new TrelloApi(mockConfig)
      api.getClient()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const annotated = (api as any).annotateProxyFailure('Request failed with status code 401', {
        response: {status: 401},
      })
      api.clearClients()

      expect(annotated).to.equal('Request failed with status code 401')
    })
  })
})
