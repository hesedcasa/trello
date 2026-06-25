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

  beforeEach(async () => {
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
    const result = await command.run()

    expect(result.success).to.be.true
    expect(result.data).to.be.an('array')
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
    let error: unknown

    try {
      await command.run()
    } catch (error_) {
      error = error_
    }

    expect(error).to.exist
  })

  it('passes profile flag to createProfileManager', async () => {
    let capturedProfile: string | undefined

    BoardMembers = await esmock('../../../../src/commands/trello/board/members.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getBoardMembers: async () => ({data: [], success: true}),
      },
      '@hesed/plugin-lib': {
        createProfileManager(_config: any, profile: string | undefined) {
          capturedProfile = profile
          return {loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'})}
        },
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new BoardMembers.default(['board123', '--profile', 'work'], createMockConfig())
    await command.run()

    expect(capturedProfile).to.equal('work')
  })
})
