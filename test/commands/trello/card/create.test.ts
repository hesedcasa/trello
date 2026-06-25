/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('card:create', () => {
  let CardCreate: any
  let mockCreateProfileManager: any
  let mockCreateCard: any
  let mockClearClients: any

  beforeEach(async () => {
    mockCreateProfileManager = () => ({
      loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'}),
    })

    mockCreateCard = async () => ({
      data: {id: 'newcard1', name: 'New Card'},
      success: true,
    })

    mockClearClients = () => {}

    CardCreate = await esmock('../../../../src/commands/trello/card/create.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        createCard: mockCreateCard,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })
  })

  it('creates a card with required args', async () => {
    const command = new CardCreate.default(['list123', 'New Card'], createMockConfig())
    const result = await command.run()

    expect(result).to.not.be.null
    expect(result.success).to.be.true
    expect(result.data).to.have.property('id', 'newcard1')
  })

  it('exits early when config is not available', async () => {
    CardCreate = await esmock('../../../../src/commands/trello/card/create.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        createCard: mockCreateCard,
      },
      '@hesed/plugin-lib': {
        createProfileManager: () => ({loadAuthConfig: async () => null}),
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new CardCreate.default(['list123', 'New Card'], createMockConfig())
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

    CardCreate = await esmock('../../../../src/commands/trello/card/create.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        createCard: async () => ({data: {}, success: true}),
      },
      '@hesed/plugin-lib': {
        createProfileManager(_config: any, profile: string | undefined) {
          capturedProfile = profile
          return {loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'})}
        },
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new CardCreate.default(['list123', 'New Card', '--profile', 'work'], createMockConfig())
    await command.run()

    expect(capturedProfile).to.equal('work')
  })
})
