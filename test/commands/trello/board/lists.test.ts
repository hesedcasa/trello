/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('board:lists', () => {
  let BoardLists: any
  let mockCreateProfileManager: any
  let mockGetBoardLists: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockCreateProfileManager = () => ({
      loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'}),
    })

    mockGetBoardLists = async () => ({
      data: [{id: 'list1', name: 'To Do'}],
      success: true,
    })

    mockClearClients = () => {}

    BoardLists = await esmock('../../../../src/commands/trello/board/lists.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getBoardLists: mockGetBoardLists,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
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
    BoardLists = await esmock('../../../../src/commands/trello/board/lists.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getBoardLists: mockGetBoardLists,
      },
      '@hesed/plugin-lib': {
        createProfileManager: () => ({loadAuthConfig: async () => null}),
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new BoardLists.default(['board123'], createMockConfig())
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

  it('passes profile flag to createProfileManager', async () => {
    let capturedProfile: string | undefined

    BoardLists = await esmock('../../../../src/commands/trello/board/lists.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getBoardLists: async () => ({data: [], success: true}),
      },
      '@hesed/plugin-lib': {
        createProfileManager(_config: any, profile: string | undefined) {
          capturedProfile = profile
          return {loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'})}
        },
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new BoardLists.default(['board123', '--profile', 'work'], createMockConfig())
    command.logJson = () => {}
    await command.run()

    expect(capturedProfile).to.equal('work')
  })
})
