/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('comment:delete', () => {
  let CommentDelete: any
  let mockCreateProfileManager: any
  let mockDeleteCardComment: any
  let mockClearClients: any

  beforeEach(async () => {
    mockCreateProfileManager = () => ({
      loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'}),
    })

    mockDeleteCardComment = async () => ({data: true, success: true})
    mockClearClients = () => {}

    CommentDelete = await esmock('../../../../src/commands/trello/comment/delete.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        deleteCardComment: mockDeleteCardComment,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
      },
    })
  })

  it('deletes a comment', async () => {
    const command = new CommentDelete.default(['card123', 'action456'], createMockConfig())
    const result = await command.run()

    expect(result.success).to.be.true
  })

  it('exits early when config is not available', async () => {
    CommentDelete = await esmock('../../../../src/commands/trello/comment/delete.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        deleteCardComment: mockDeleteCardComment,
      },
      '@hesed/plugin-lib': {
        createProfileManager: () => ({loadAuthConfig: async () => null}),
      },
    })

    const command = new CommentDelete.default(['card123', 'action456'], createMockConfig())
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

    CommentDelete = await esmock('../../../../src/commands/trello/comment/delete.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        deleteCardComment: async () => ({data: true, success: true}),
      },
      '@hesed/plugin-lib': {
        createProfileManager(_config: any, profile: string | undefined) {
          capturedProfile = profile
          return {loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'})}
        },
      },
    })

    const command = new CommentDelete.default(['card123', 'action456', '--profile', 'work'], createMockConfig())
    await command.run()

    expect(capturedProfile).to.equal('work')
  })
})
