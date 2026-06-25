/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('card:get', () => {
  let CardGet: any
  let mockCreateProfileManager: any
  let mockGetCard: any
  let mockClearClients: any

  beforeEach(async () => {
    mockCreateProfileManager = () => ({
      loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'}),
    })

    mockGetCard = async (_config: any, cardId: string) => ({
      data: {
        desc: 'Test Description',
        id: cardId,
        name: 'Test Card',
      },
      success: true,
    })

    mockClearClients = () => {}

    CardGet = await esmock('../../../../src/commands/trello/card/get.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getCard: mockGetCard,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })
  })

  it('retrieves card with valid card ID', async () => {
    const command = new CardGet.default(['card123'], createMockConfig())
    const result = await command.run()

    expect(result).to.not.be.null
    expect(result.success).to.be.true
    expect(result.data).to.have.property('id', 'card123')
    expect(result.data).to.have.property('name', 'Test Card')
  })

  it('handles API errors gracefully', async () => {
    CardGet = await esmock('../../../../src/commands/trello/card/get.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getCard: async () => ({error: 'Card not found', success: false}),
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new CardGet.default(['INVALID'], createMockConfig())
    const result = await command.run()

    expect(result.success).to.be.false
  })

  it('calls clearClients after execution', async () => {
    let clearClientsCalled = false

    CardGet = await esmock('../../../../src/commands/trello/card/get.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients() {
          clearClientsCalled = true
        },
        getCard: mockGetCard,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new CardGet.default(['card123'], createMockConfig())
    await command.run()
    expect(clearClientsCalled).to.be.true
  })

  it('passes profile flag to createProfileManager', async () => {
    let capturedProfile: string | undefined

    CardGet = await esmock('../../../../src/commands/trello/card/get.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getCard: async () => ({data: {}, success: true}),
      },
      '@hesed/plugin-lib': {
        createProfileManager(_config: any, profile: string | undefined) {
          capturedProfile = profile
          return {loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'})}
        },
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new CardGet.default(['card123', '--profile', 'work'], createMockConfig())
    await command.run()

    expect(capturedProfile).to.equal('work')
  })
})
