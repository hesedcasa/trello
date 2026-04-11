/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('board:members', () => {
  let BoardMembers: any
  let mockReadConfig: any
  let mockGetBoardMembers: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockReadConfig = async () => ({
      auth: {apiKey: 'test-key', apiToken: 'test-token'},
    })

    mockGetBoardMembers = async () => ({
      data: [{fullName: 'Test User', id: 'member1'}],
      success: true,
    })

    mockClearClients = () => {}

    BoardMembers = await esmock('../../../../src/commands/trello/board/members.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getBoardMembers: mockGetBoardMembers,
      },
    })
  })

  it('retrieves members for a board', async () => {
    const command = new BoardMembers.default(['board123'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
    expect(jsonOutput.data).to.be.an('array')
  })

  it('exits early when config is not available', async () => {
    mockReadConfig = async () => null

    BoardMembers = await esmock('../../../../src/commands/trello/board/members.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getBoardMembers: mockGetBoardMembers,
      },
    })

    const command = new BoardMembers.default(['board123'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()
    expect(jsonOutput).to.be.null
  })
})
