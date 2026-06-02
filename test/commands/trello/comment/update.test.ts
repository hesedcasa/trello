/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('comment:update', () => {
  let CommentUpdate: any
  let mockCreateProfileManager: any
  let mockUpdateCardComment: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockCreateProfileManager = () => ({
      loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'}),
    })

    mockUpdateCardComment = async () => ({
      data: {data: {text: 'Updated comment'}, id: 'action456'},
      success: true,
    })

    mockClearClients = () => {}

    CommentUpdate = await esmock('../../../../src/commands/trello/comment/update.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        updateCardComment: mockUpdateCardComment,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })
  })

  it('updates a comment', async () => {
    const command = new CommentUpdate.default(['card123', 'action456', 'Updated comment'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
  })

  it('exits early when config is not available', async () => {
    CommentUpdate = await esmock('../../../../src/commands/trello/comment/update.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        updateCardComment: mockUpdateCardComment,
      },
      '@hesed/plugin-lib': {
        createProfileManager: () => ({loadAuthConfig: async () => null}),
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new CommentUpdate.default(['card123', 'action456', 'text'], createMockConfig())
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
