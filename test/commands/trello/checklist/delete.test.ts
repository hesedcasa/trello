/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('checklist:delete', () => {
  let ChecklistDelete: any
  let mockReadConfig: any
  let mockDeleteChecklist: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockReadConfig = async () => ({
      auth: {apiKey: 'test-key', apiToken: 'test-token'},
    })

    mockDeleteChecklist = async () => ({data: true, success: true})
    mockClearClients = () => {}

    ChecklistDelete = await esmock('../../../../src/commands/trello/checklist/delete.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        deleteChecklist: mockDeleteChecklist,
      },
    })
  })

  it('deletes a checklist', async () => {
    const command = new ChecklistDelete.default(['checklist123'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
  })

  it('exits early when config is not available', async () => {
    mockReadConfig = async () => null

    ChecklistDelete = await esmock('../../../../src/commands/trello/checklist/delete.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        deleteChecklist: mockDeleteChecklist,
      },
    })

    const command = new ChecklistDelete.default(['checklist123'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()
    expect(jsonOutput).to.be.null
  })
})
