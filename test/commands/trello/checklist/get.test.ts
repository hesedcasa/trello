/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('checklist:get', () => {
  let ChecklistGet: any
  let mockReadConfig: any
  let mockGetChecklist: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockReadConfig = async () => ({
      auth: {apiKey: 'test-key', apiToken: 'test-token'},
    })

    mockGetChecklist = async () => ({
      data: {checkItems: [], id: 'checklist123', name: 'My Checklist'},
      success: true,
    })

    mockClearClients = () => {}

    ChecklistGet = await esmock('../../../../src/commands/trello/checklist/get.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getChecklist: mockGetChecklist,
      },
    })
  })

  it('retrieves a checklist', async () => {
    const command = new ChecklistGet.default(['checklist123'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
    expect(jsonOutput.data).to.have.property('id', 'checklist123')
  })

  it('exits early when config is not available', async () => {
    mockReadConfig = async () => null

    ChecklistGet = await esmock('../../../../src/commands/trello/checklist/get.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getChecklist: mockGetChecklist,
      },
    })

    const command = new ChecklistGet.default(['checklist123'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()
    expect(jsonOutput).to.be.null
  })
})
