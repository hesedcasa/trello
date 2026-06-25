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

  beforeEach(async () => {
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
    const result = await command.run()

    expect(result.success).to.be.true
    expect(result.data).to.have.property('name', 'Buy groceries')
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
    let error: unknown

    try {
      await command.run()
    } catch (error_) {
      error = error_
    }

    expect(error).to.exist
  })

  it('passes profile flag to createProfileManager', async () => {
    let capturedProfile: string | undefined

    ChecklistAddItem = await esmock('../../../../src/commands/trello/checklist/add-item.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        createChecklistItem: async () => ({data: {}, success: true}),
      },
      '@hesed/plugin-lib': {
        createProfileManager(_config: any, profile: string | undefined) {
          capturedProfile = profile
          return {loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'})}
        },
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new ChecklistAddItem.default(
      ['checklist123', 'Buy groceries', '--profile', 'work'],
      createMockConfig(),
    )
    await command.run()

    expect(capturedProfile).to.equal('work')
  })
})
