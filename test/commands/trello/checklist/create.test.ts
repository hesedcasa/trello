/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('checklist:create', () => {
  let ChecklistCreate: any
  let mockCreateProfileManager: any
  let mockCreateChecklist: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockCreateProfileManager = () => ({
      loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'}),
    })

    mockCreateChecklist = async () => ({
      data: {id: 'cl1', name: 'My Checklist'},
      success: true,
    })

    mockClearClients = () => {}

    ChecklistCreate = await esmock('../../../../src/commands/trello/checklist/create.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        createChecklist: mockCreateChecklist,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })
  })

  it('creates a checklist on a card', async () => {
    const command = new ChecklistCreate.default(['card123', 'My Checklist'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
    expect(jsonOutput.data).to.have.property('id', 'cl1')
    expect(jsonOutput.data).to.have.property('name', 'My Checklist')
  })

  it('passes profile flag to createProfileManager', async () => {
    let capturedProfile: string | undefined

    ChecklistCreate = await esmock('../../../../src/commands/trello/checklist/create.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        createChecklist: async () => ({data: {}, success: true}),
      },
      '@hesed/plugin-lib': {
        createProfileManager(_config: any, profile: string | undefined) {
          capturedProfile = profile
          return {loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'})}
        },
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new ChecklistCreate.default(['card123', 'My Checklist', '--profile', 'work'], createMockConfig())
    command.logJson = () => {}
    await command.run()

    expect(capturedProfile).to.equal('work')
  })
})
