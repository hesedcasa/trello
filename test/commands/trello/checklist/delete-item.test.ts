/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('checklist:delete-item', () => {
  let ChecklistDeleteItem: any
  let mockReadConfig: any
  let mockDeleteChecklistItem: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockReadConfig = async () => ({
      auth: {apiKey: 'test-key', apiToken: 'test-token'},
    })

    mockDeleteChecklistItem = async () => ({data: true, success: true})
    mockClearClients = () => {}

    ChecklistDeleteItem = await esmock('../../../../src/commands/trello/checklist/delete-item.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        deleteChecklistItem: mockDeleteChecklistItem,
      },
    })
  })

  it('deletes a checklist item', async () => {
    const command = new ChecklistDeleteItem.default(['checklist123', 'item456'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
  })

  it('exits early when config is not available', async () => {
    mockReadConfig = async () => null

    ChecklistDeleteItem = await esmock('../../../../src/commands/trello/checklist/delete-item.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        deleteChecklistItem: mockDeleteChecklistItem,
      },
    })

    const command = new ChecklistDeleteItem.default(['checklist123', 'item456'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()
    expect(jsonOutput).to.be.null
  })
})
