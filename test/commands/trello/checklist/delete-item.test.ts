/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('checklist:delete-item', () => {
  let ChecklistDeleteItem: any
  let mockCreateProfileManager: any
  let mockDeleteChecklistItem: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockCreateProfileManager = () => ({
      loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'}),
    })

    mockDeleteChecklistItem = async () => ({data: true, success: true})
    mockClearClients = () => {}

    ChecklistDeleteItem = await esmock('../../../../src/commands/trello/checklist/delete-item.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        deleteChecklistItem: mockDeleteChecklistItem,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
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
    ChecklistDeleteItem = await esmock('../../../../src/commands/trello/checklist/delete-item.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        deleteChecklistItem: mockDeleteChecklistItem,
      },
      '@hesed/plugin-lib': {
        createProfileManager: () => ({loadAuthConfig: async () => null}),
      },
    })

    const command = new ChecklistDeleteItem.default(['checklist123', 'item456'], createMockConfig())
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

  it('passes profile flag to createProfileManager', async () => {
    let capturedProfile: string | undefined

    ChecklistDeleteItem = await esmock('../../../../src/commands/trello/checklist/delete-item.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        deleteChecklistItem: async () => ({data: true, success: true}),
      },
      '@hesed/plugin-lib': {
        createProfileManager(_config: any, profile: string | undefined) {
          capturedProfile = profile
          return {loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'})}
        },
      },
    })

    const command = new ChecklistDeleteItem.default(
      ['checklist123', 'item456', '--profile', 'work'],
      createMockConfig(),
    )
    command.logJson = () => {}
    await command.run()

    expect(capturedProfile).to.equal('work')
  })
})
