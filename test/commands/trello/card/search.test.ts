/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('card:search', () => {
  let CardSearch: any
  let mockReadConfig: any
  let mockSearchCards: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockReadConfig = async () => ({
      auth: {apiKey: 'test-key', apiToken: 'test-token'},
    })

    mockSearchCards = async () => ({
      data: [{id: 'card1', name: 'Bug fix card'}],
      success: true,
    })

    mockClearClients = () => {}

    CardSearch = await esmock('../../../../src/commands/trello/card/search.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        searchCards: mockSearchCards,
      },
    })
  })

  it('searches for cards', async () => {
    const command = new CardSearch.default(['bug fix'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
    expect(jsonOutput.data).to.be.an('array')
  })

  it('exits early when config is not available', async () => {
    mockReadConfig = async () => null

    CardSearch = await esmock('../../../../src/commands/trello/card/search.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        searchCards: mockSearchCards,
      },
    })

    const command = new CardSearch.default(['bug fix'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()
    expect(jsonOutput).to.be.null
  })
})
