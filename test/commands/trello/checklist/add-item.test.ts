/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('checklist:add-item', () => {
  let ChecklistAddItem: any
  let mockCreateProfileManager: any
  let mockCreateChecklistItem: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockCreateProfileManager = () => ({
      loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'}),
    })

    mockCreateChecklistItem = async () => ({
      data: {id: 'item1', name: 'Buy groceries', state: 'incomplete'},
      success: true,
    })

    mockClearClients = () => {}

    ChecklistAddItem = await esmock('../../../../src/commands/trello/checklist/add-item.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        createChecklistItem: mockCreateChecklistItem,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
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
    ChecklistAddItem = await esmock('../../../../src/commands/trello/checklist/add-item.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        createChecklistItem: mockCreateChecklistItem,
      },
      '@hesed/plugin-lib': {
        createProfileManager: () => ({loadAuthConfig: async () => null}),
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new ChecklistAddItem.default(['checklist123', 'Buy groceries'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    try {
      await command.run()
    } catch {
      // expected error from this.error()
    }

    expect(jsonOutput).to.be.null
  })
})
