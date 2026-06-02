/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('board:members', () => {
  let BoardMembers: any
  let mockCreateProfileManager: any
  let mockGetBoardMembers: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockCreateProfileManager = () => ({
      loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'}),
    })

    mockGetBoardMembers = async () => ({
      data: [{fullName: 'Test User', id: 'member1'}],
      success: true,
    })

    mockClearClients = () => {}

    BoardMembers = await esmock('../../../../src/commands/trello/board/members.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getBoardMembers: mockGetBoardMembers,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
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
    BoardMembers = await esmock('../../../../src/commands/trello/board/members.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getBoardMembers: mockGetBoardMembers,
      },
      '@hesed/plugin-lib': {
        createProfileManager: () => ({loadAuthConfig: async () => null}),
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new BoardMembers.default(['board123'], createMockConfig())
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
