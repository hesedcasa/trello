/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('comment:delete', () => {
  let CommentDelete: any
  let mockReadConfig: any
  let mockDeleteCardComment: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockReadConfig = async () => ({
      auth: {apiKey: 'test-key', apiToken: 'test-token'},
    })

    mockDeleteCardComment = async () => ({data: true, success: true})
    mockClearClients = () => {}

    CommentDelete = await esmock('../../../../src/commands/trello/comment/delete.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        deleteCardComment: mockDeleteCardComment,
      },
    })
  })

  it('deletes a comment', async () => {
    const command = new CommentDelete.default(['card123', 'action456'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
  })

  it('exits early when config is not available', async () => {
    mockReadConfig = async () => null

    CommentDelete = await esmock('../../../../src/commands/trello/comment/delete.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        deleteCardComment: mockDeleteCardComment,
      },
    })

    const command = new CommentDelete.default(['card123', 'action456'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()
    expect(jsonOutput).to.be.null
  })
})
