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

  beforeEach(async () => {
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
    const result = await command.run()

    expect(result.success).to.be.true
    expect(result.data).to.be.an('array')
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
    let error: unknown

    try {
      await command.run()
    } catch (error_) {
      error = error_
    }

    expect(error).to.exist
  })

  it('passes profile flag to createProfileManager', async () => {
    let capturedProfile: string | undefined

    CardSearch = await esmock('../../../../src/commands/trello/card/search.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        searchCards: async () => ({data: [], success: true}),
      },
      '@hesed/plugin-lib': {
        createProfileManager(_config: any, profile: string | undefined) {
          capturedProfile = profile
          return {loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'})}
        },
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new CardSearch.default(['bug fix', '--profile', 'work'], createMockConfig())
    await command.run()

    expect(capturedProfile).to.equal('work')
  })
})
