/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('checklist:delete', () => {
  let ChecklistDelete: any
  let mockCreateProfileManager: any
  let mockDeleteChecklist: any
  let mockClearClients: any

  beforeEach(async () => {
    mockCreateProfileManager = () => ({
      loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'}),
    })

    mockDeleteChecklist = async () => ({data: true, success: true})
    mockClearClients = () => {}

    ChecklistDelete = await esmock('../../../../src/commands/trello/checklist/delete.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        deleteChecklist: mockDeleteChecklist,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
      },
    })
  })

  it('deletes a checklist', async () => {
    const command = new ChecklistDelete.default(['checklist123'], createMockConfig())
    const result = await command.run()

    expect(result.success).to.be.true
  })

  it('exits early when config is not available', async () => {
    ChecklistDelete = await esmock('../../../../src/commands/trello/checklist/delete.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        deleteChecklist: mockDeleteChecklist,
      },
      '@hesed/plugin-lib': {
        createProfileManager: () => ({loadAuthConfig: async () => null}),
      },
    })

    const command = new ChecklistDelete.default(['checklist123'], createMockConfig())
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

    ChecklistDelete = await esmock('../../../../src/commands/trello/checklist/delete.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        deleteChecklist: async () => ({data: true, success: true}),
      },
      '@hesed/plugin-lib': {
        createProfileManager(_config: any, profile: string | undefined) {
          capturedProfile = profile
          return {loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'})}
        },
      },
    })

    const command = new ChecklistDelete.default(['checklist123', '--profile', 'work'], createMockConfig())
    await command.run()

    expect(capturedProfile).to.equal('work')
  })
})
