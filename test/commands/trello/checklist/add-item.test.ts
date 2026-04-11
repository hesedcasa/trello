/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('checklist:add-item', () => {
  let ChecklistAddItem: any
  let mockReadConfig: any
  let mockCreateChecklistItem: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockReadConfig = async () => ({
      auth: {apiKey: 'test-key', apiToken: 'test-token'},
    })

    mockCreateChecklistItem = async () => ({
      data: {id: 'item1', name: 'Buy groceries', state: 'incomplete'},
      success: true,
    })

    mockClearClients = () => {}

    ChecklistAddItem = await esmock('../../../../src/commands/trello/checklist/add-item.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        createChecklistItem: mockCreateChecklistItem,
      },
    })
  })

  it('adds an item to a checklist', async () => {
    const command = new ChecklistAddItem.default(['checklist123', 'Buy groceries'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
    expect(jsonOutput.data).to.have.property('name', 'Buy groceries')
  })

  it('exits early when config is not available', async () => {
    mockReadConfig = async () => null

    ChecklistAddItem = await esmock('../../../../src/commands/trello/checklist/add-item.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        createChecklistItem: mockCreateChecklistItem,
      },
    })

    const command = new ChecklistAddItem.default(['checklist123', 'Buy groceries'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()
    expect(jsonOutput).to.be.null
  })
})
