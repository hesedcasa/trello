/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('board:get', () => {
  let BoardGet: any
  let mockCreateProfileManager: any
  let mockGetBoard: any
  let mockClearClients: any
  let logOutput: string[]

  beforeEach(async () => {
    logOutput = []

    mockCreateProfileManager = () => ({
      loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'}),
    })

    mockGetBoard = async (_config: any, boardId: string) => ({
      data: {
        id: boardId,
        name: 'Test Board',
        url: 'https://trello.com/b/test',
      },
      success: true,
    })

    mockClearClients = () => {}

    BoardGet = await esmock('../../../../src/commands/trello/board/index.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getBoard: mockGetBoard,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })
  })

  it('retrieves board with valid board ID', async () => {
    const command = new BoardGet.default(['board123'], createMockConfig())
    const result = await command.run()

    expect(result).to.not.be.null
    expect(result.success).to.be.true
    expect(result.data).to.have.property('id', 'board123')
    expect(result.data).to.have.property('name', 'Test Board')
  })

  it('formats output as TOON when --toon flag is provided', async () => {
    const command = new BoardGet.default(['board123', '--toon'], createMockConfig())
    command.log = (output: string) => {
      logOutput.push(output)
    }

    await command.run()

    expect(logOutput.length).to.be.greaterThan(0)
    expect(logOutput.join('\n')).to.include('board123')
  })

  it('handles API errors gracefully', async () => {
    BoardGet = await esmock('../../../../src/commands/trello/board/index.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getBoard: async () => ({error: 'Board not found', success: false}),
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new BoardGet.default(['INVALID'], createMockConfig())
    const result = await command.run()

    expect(result.success).to.be.false
    expect(result.error).to.include('Board not found')
  })

  it('exits early when config is not available', async () => {
    BoardGet = await esmock('../../../../src/commands/trello/board/index.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getBoard: mockGetBoard,
      },
      '@hesed/plugin-lib': {
        createProfileManager: () => ({loadAuthConfig: async () => null}),
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new BoardGet.default(['board123'], createMockConfig())
    let error: unknown

    try {
      await command.run()
    } catch (error_) {
      error = error_
    }

    expect(error).to.exist
  })

  it('calls clearClients after execution', async () => {
    let clearClientsCalled = false

    BoardGet = await esmock('../../../../src/commands/trello/board/index.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients() {
          clearClientsCalled = true
        },
        getBoard: mockGetBoard,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new BoardGet.default(['board123'], createMockConfig())
    await command.run()
    expect(clearClientsCalled).to.be.true
  })

  it('passes profile flag to createProfileManager', async () => {
    let capturedProfile: string | undefined

    BoardGet = await esmock('../../../../src/commands/trello/board/index.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getBoard: async () => ({data: {}, success: true}),
      },
      '@hesed/plugin-lib': {
        createProfileManager(_config: any, profile: string | undefined) {
          capturedProfile = profile
          return {loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'})}
        },
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new BoardGet.default(['board123', '--profile', 'work'], createMockConfig())
    await command.run()

    expect(capturedProfile).to.equal('work')
  })
})
