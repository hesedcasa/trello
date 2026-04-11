/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('comment:update', () => {
  let CommentUpdate: any
  let mockReadConfig: any
  let mockUpdateCardComment: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockReadConfig = async () => ({
      auth: {apiKey: 'test-key', apiToken: 'test-token'},
    })

    mockUpdateCardComment = async () => ({
      data: {data: {text: 'Updated comment'}, id: 'action456'},
      success: true,
    })

    mockClearClients = () => {}

    CommentUpdate = await esmock('../../../../src/commands/trello/comment/update.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        updateCardComment: mockUpdateCardComment,
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
    mockReadConfig = async () => null

    CommentUpdate = await esmock('../../../../src/commands/trello/comment/update.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        updateCardComment: mockUpdateCardComment,
      },
    })

    const command = new CommentUpdate.default(['card123', 'action456', 'text'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()
    expect(jsonOutput).to.be.null
  })
})
