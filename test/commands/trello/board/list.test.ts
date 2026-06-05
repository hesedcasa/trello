/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('board:list', () => {
  let BoardList: any
  let mockCreateProfileManager: any
  let mockGetMyBoards: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockCreateProfileManager = () => ({
      loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'}),
    })

    mockGetMyBoards = async () => ({
      data: [
        {id: 'board1', name: 'Board One'},
        {id: 'board2', name: 'Board Two'},
      ],
      success: true,
    })

    mockClearClients = () => {}

    BoardList = await esmock('../../../../src/commands/trello/board/list.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getMyBoards: mockGetMyBoards,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })
  })

  it('lists all boards', async () => {
    const command = new BoardList.default([], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
    expect(jsonOutput.data).to.be.an('array')
    expect(jsonOutput.data).to.have.lengthOf(2)
  })

  it('exits early when config is not available', async () => {
    BoardList = await esmock('../../../../src/commands/trello/board/list.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getMyBoards: mockGetMyBoards,
      },
      '@hesed/plugin-lib': {
        createProfileManager: () => ({loadAuthConfig: async () => null}),
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new BoardList.default([], createMockConfig())
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

    BoardList = await esmock('../../../../src/commands/trello/board/list.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getMyBoards: async () => ({data: [], success: true}),
      },
      '@hesed/plugin-lib': {
        createProfileManager(_config: any, profile: string | undefined) {
          capturedProfile = profile
          return {loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'})}
        },
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new BoardList.default(['--profile', 'work'], createMockConfig())
    command.logJson = () => {}
    await command.run()

    expect(capturedProfile).to.equal('work')
  })
})
