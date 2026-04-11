/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('board:lists', () => {
  let BoardLists: any
  let mockReadConfig: any
  let mockGetBoardLists: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockReadConfig = async () => ({
      auth: {apiKey: 'test-key', apiToken: 'test-token'},
    })

    mockGetBoardLists = async () => ({
      data: [{id: 'list1', name: 'To Do'}],
      success: true,
    })

    mockClearClients = () => {}

    BoardLists = await esmock('../../../../src/commands/trello/board/lists.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getBoardLists: mockGetBoardLists,
      },
    })
  })

  it('retrieves lists for a board', async () => {
    const command = new BoardLists.default(['board123'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
    expect(jsonOutput.data).to.be.an('array')
  })

  it('exits early when config is not available', async () => {
    mockReadConfig = async () => null

    BoardLists = await esmock('../../../../src/commands/trello/board/lists.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getBoardLists: mockGetBoardLists,
      },
    })

    const command = new BoardLists.default(['board123'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()
    expect(jsonOutput).to.be.null
  })
})
