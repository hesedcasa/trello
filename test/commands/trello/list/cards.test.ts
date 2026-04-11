/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('list:cards', () => {
  let ListCards: any
  let mockReadConfig: any
  let mockGetListCards: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockReadConfig = async () => ({
      auth: {apiKey: 'test-key', apiToken: 'test-token'},
    })

    mockGetListCards = async () => ({
      data: [{id: 'card1', name: 'Card One'}],
      success: true,
    })

    mockClearClients = () => {}

    ListCards = await esmock('../../../../src/commands/trello/list/cards.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getListCards: mockGetListCards,
      },
    })
  })

  it('retrieves cards in a list', async () => {
    const command = new ListCards.default(['list123'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
    expect(jsonOutput.data).to.be.an('array')
  })

  it('exits early when config is not available', async () => {
    mockReadConfig = async () => null

    ListCards = await esmock('../../../../src/commands/trello/list/cards.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getListCards: mockGetListCards,
      },
    })

    const command = new ListCards.default(['list123'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()
    expect(jsonOutput).to.be.null
  })
})
