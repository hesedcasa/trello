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
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

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
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
    expect(jsonOutput.data).to.have.property('id', 'action1')
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
