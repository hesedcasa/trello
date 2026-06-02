/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('card:search', () => {
  let CardSearch: any
  let mockCreateProfileManager: any
  let mockSearchCards: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockCreateProfileManager = () => ({
      loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'}),
    })

    mockSearchCards = async () => ({
      data: [{id: 'card1', name: 'Bug fix card'}],
      success: true,
    })

    mockClearClients = () => {}

    CardSearch = await esmock('../../../../src/commands/trello/card/search.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        searchCards: mockSearchCards,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })
  })

  it('searches for cards', async () => {
    const command = new CardSearch.default(['bug fix'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
    expect(jsonOutput.data).to.be.an('array')
  })

  it('exits early when config is not available', async () => {
    CardSearch = await esmock('../../../../src/commands/trello/card/search.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        searchCards: mockSearchCards,
      },
      '@hesed/plugin-lib': {
        createProfileManager: () => ({loadAuthConfig: async () => null}),
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new CardSearch.default(['bug fix'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    try {
      await command.run()
    } catch {
      // expected error from this.error()
    }

    expect(jsonOutput).to.be.null
  })
})
