/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('card:delete', () => {
  let CardDelete: any
  let mockReadConfig: any
  let mockDeleteCard: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockReadConfig = async () => ({
      auth: {apiKey: 'test-key', apiToken: 'test-token'},
    })

    mockDeleteCard = async () => ({data: true, success: true})
    mockClearClients = () => {}

    CardDelete = await esmock('../../../../src/commands/trello/card/delete.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        deleteCard: mockDeleteCard,
      },
    })
  })

  it('deletes a card', async () => {
    const command = new CardDelete.default(['card123'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
    expect(jsonOutput.data).to.be.true
  })

  it('exits early when config is not available', async () => {
    mockReadConfig = async () => null

    CardDelete = await esmock('../../../../src/commands/trello/card/delete.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        deleteCard: mockDeleteCard,
      },
    })

    const command = new CardDelete.default(['card123'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()
    expect(jsonOutput).to.be.null
  })
})
