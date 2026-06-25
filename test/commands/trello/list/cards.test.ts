/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('list:cards', () => {
  let ListCards: any
  let mockCreateProfileManager: any
  let mockGetListCards: any
  let mockClearClients: any

  beforeEach(async () => {
    mockCreateProfileManager = () => ({
      loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'}),
    })

    mockGetListCards = async () => ({
      data: [{id: 'card1', name: 'Card One'}],
      success: true,
    })

    mockClearClients = () => {}

    ListCards = await esmock('../../../../src/commands/trello/list/cards.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getListCards: mockGetListCards,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })
  })

  it('retrieves cards in a list', async () => {
    const command = new ListCards.default(['list123'], createMockConfig())
    const result = await command.run()

    expect(result.success).to.be.true
    expect(result.data).to.be.an('array')
  })

  it('exits early when config is not available', async () => {
    ListCards = await esmock('../../../../src/commands/trello/list/cards.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getListCards: mockGetListCards,
      },
      '@hesed/plugin-lib': {
        createProfileManager: () => ({loadAuthConfig: async () => null}),
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new ListCards.default(['list123'], createMockConfig())
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

    ListCards = await esmock('../../../../src/commands/trello/list/cards.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getListCards: async () => ({data: [], success: true}),
      },
      '@hesed/plugin-lib': {
        createProfileManager(_config: any, profile: string | undefined) {
          capturedProfile = profile
          return {loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'})}
        },
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new ListCards.default(['list123', '--profile', 'work'], createMockConfig())
    await command.run()

    expect(capturedProfile).to.equal('work')
  })
})
