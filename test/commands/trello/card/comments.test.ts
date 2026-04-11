/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('card:comments', () => {
  let CardComments: any
  let mockReadConfig: any
  let mockGetCardActions: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockReadConfig = async () => ({
      auth: {apiKey: 'test-key', apiToken: 'test-token'},
    })

    mockGetCardActions = async () => ({
      data: [{data: {text: 'A comment'}, id: 'action1', type: 'commentCard'}],
      success: true,
    })

    mockClearClients = () => {}

    CardComments = await esmock('../../../../src/commands/trello/card/comments.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getCardActions: mockGetCardActions,
      },
    })
  })

  it('retrieves comments for a card', async () => {
    const command = new CardComments.default(['card123'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
    expect(jsonOutput.data).to.be.an('array')
  })

  it('exits early when config is not available', async () => {
    mockReadConfig = async () => null

    CardComments = await esmock('../../../../src/commands/trello/card/comments.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getCardActions: mockGetCardActions,
      },
    })

    const command = new CardComments.default(['card123'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()
    expect(jsonOutput).to.be.null
  })
})
