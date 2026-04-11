/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('card:move', () => {
  let CardMove: any
  let mockReadConfig: any
  let mockMoveCard: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockReadConfig = async () => ({
      auth: {apiKey: 'test-key', apiToken: 'test-token'},
    })

    mockMoveCard = async () => ({
      data: {id: 'card123', idList: 'list456'},
      success: true,
    })

    mockClearClients = () => {}

    CardMove = await esmock('../../../../src/commands/trello/card/move.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        moveCard: mockMoveCard,
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
    mockReadConfig = async () => null

    CardMove = await esmock('../../../../src/commands/trello/card/move.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        moveCard: mockMoveCard,
      },
    })

    const command = new CardMove.default(['card123', 'list456'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()
    expect(jsonOutput).to.be.null
  })
})
