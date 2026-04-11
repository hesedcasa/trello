/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('board:cards', () => {
  let BoardCards: any
  let mockReadConfig: any
  let mockGetBoardCards: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockReadConfig = async () => ({
      auth: {apiKey: 'test-key', apiToken: 'test-token'},
    })

    mockGetBoardCards = async () => ({
      data: [{id: 'card1', name: 'Card One'}],
      success: true,
    })

    mockClearClients = () => {}

    BoardCards = await esmock('../../../../src/commands/trello/board/cards.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getBoardCards: mockGetBoardCards,
      },
    })
  })

  it('retrieves cards for a board', async () => {
    const command = new BoardCards.default(['board123'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
    expect(jsonOutput.data).to.be.an('array')
  })

  it('formats output as TOON when --toon flag is provided', async () => {
    let toonOutput = ''
    const command = new BoardCards.default(['board123', '--toon'], createMockConfig())
    command.logJson = () => {}
    command.log = (output: string) => {
      toonOutput = output
    }

    await command.run()

    expect(toonOutput).to.include('card1')
  })

  it('exits early when config is not available', async () => {
    mockReadConfig = async () => null

    BoardCards = await esmock('../../../../src/commands/trello/board/cards.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getBoardCards: mockGetBoardCards,
      },
    })

    const command = new BoardCards.default(['board123'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()
    expect(jsonOutput).to.be.null
  })
})
