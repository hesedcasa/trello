/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('card:update', () => {
  let CardUpdate: any
  let mockCreateProfileManager: any
  let mockUpdateCard: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockCreateProfileManager = () => ({
      loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'}),
    })

    mockUpdateCard = async () => ({
      data: {id: 'card123', name: 'Updated name'},
      success: true,
    })

    mockClearClients = () => {}

    CardUpdate = await esmock('../../../../src/commands/trello/card/update.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        updateCard: mockUpdateCard,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })
  })

  it('updates a card with fields', async () => {
    const command = new CardUpdate.default(['card123', '--fields', 'name=Updated name'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
  })

  it('handles fields with equals signs in values', async () => {
    const command = new CardUpdate.default(['card123', '--fields', 'desc=some=text=here'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
  })

  it('exits early when config is not available', async () => {
    CardUpdate = await esmock('../../../../src/commands/trello/card/update.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        updateCard: mockUpdateCard,
      },
      '@hesed/plugin-lib': {
        createProfileManager: () => ({loadAuthConfig: async () => null}),
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new CardUpdate.default(['card123', '--fields', 'name=test'], createMockConfig())
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
