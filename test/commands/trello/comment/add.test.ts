/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('comment:add', () => {
  let CommentAdd: any
  let mockCreateProfileManager: any
  let mockAddCardComment: any
  let mockClearClients: any

  beforeEach(async () => {
    mockCreateProfileManager = () => ({
      loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'}),
    })

    mockAddCardComment = async () => ({
      data: {id: 'action1', type: 'commentCard'},
      success: true,
    })

    mockClearClients = () => {}

    CommentAdd = await esmock('../../../../src/commands/trello/comment/add.js', {
      '../../../../src/trello/trello-client.js': {
        addCardComment: mockAddCardComment,
        clearClients: mockClearClients,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })
  })

  it('adds a comment to a card', async () => {
    const command = new CommentAdd.default(['card123', 'Test comment'], createMockConfig())
    const result = await command.run()

    expect(result.success).to.be.true
    expect(result.data).to.have.property('id', 'action1')
  })

  it('exits early when config is not available', async () => {
    CommentAdd = await esmock('../../../../src/commands/trello/comment/add.js', {
      '../../../../src/trello/trello-client.js': {
        addCardComment: mockAddCardComment,
        clearClients: mockClearClients,
      },
      '@hesed/plugin-lib': {
        createProfileManager: () => ({loadAuthConfig: async () => null}),
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new CommentAdd.default(['card123', 'Test comment'], createMockConfig())
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

    CommentAdd = await esmock('../../../../src/commands/trello/comment/add.js', {
      '../../../../src/trello/trello-client.js': {
        addCardComment: async () => ({data: {}, success: true}),
        clearClients: mockClearClients,
      },
      '@hesed/plugin-lib': {
        createProfileManager(_config: any, profile: string | undefined) {
          capturedProfile = profile
          return {loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'})}
        },
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new CommentAdd.default(['card123', 'Test comment', '--profile', 'work'], createMockConfig())
    await command.run()

    expect(capturedProfile).to.equal('work')
  })
})
