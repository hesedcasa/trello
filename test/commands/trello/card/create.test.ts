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
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

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
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput).to.not.be.null
    expect(jsonOutput.success).to.be.true
    expect(jsonOutput.data).to.have.property('id', 'newcard1')
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
