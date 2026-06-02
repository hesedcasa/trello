/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('card:move', () => {
  let CardMove: any
  let mockCreateProfileManager: any
  let mockMoveCard: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockCreateProfileManager = () => ({
      loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'}),
    })

    mockMoveCard = async () => ({
      data: {id: 'card123', idList: 'list456'},
      success: true,
    })

    mockClearClients = () => {}

    CardMove = await esmock('../../../../src/commands/trello/card/move.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        moveCard: mockMoveCard,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })
  })

  it('moves a card to another list', async () => {
    const command = new CardMove.default(['card123', 'list456'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
    expect(jsonOutput.data).to.have.property('idList', 'list456')
  })

  it('moves a card across boards with --board flag', async () => {
    const command = new CardMove.default(['card123', 'list456', '--board', 'board789'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
  })

  it('exits early when config is not available', async () => {
    CardMove = await esmock('../../../../src/commands/trello/card/move.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        moveCard: mockMoveCard,
      },
      '@hesed/plugin-lib': {
        createProfileManager: () => ({loadAuthConfig: async () => null}),
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new CardMove.default(['card123', 'list456'], createMockConfig())
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
