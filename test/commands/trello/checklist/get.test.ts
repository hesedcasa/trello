/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('checklist:get', () => {
  let ChecklistGet: any
  let mockCreateProfileManager: any
  let mockGetChecklist: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockCreateProfileManager = () => ({
      loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'}),
    })

    mockGetChecklist = async () => ({
      data: {checkItems: [], id: 'checklist123', name: 'My Checklist'},
      success: true,
    })

    mockClearClients = () => {}

    ChecklistGet = await esmock('../../../../src/commands/trello/checklist/get.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getChecklist: mockGetChecklist,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
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
    ChecklistGet = await esmock('../../../../src/commands/trello/checklist/get.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getChecklist: mockGetChecklist,
      },
      '@hesed/plugin-lib': {
        createProfileManager: () => ({loadAuthConfig: async () => null}),
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new ChecklistGet.default(['checklist123'], createMockConfig())
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

    ChecklistGet = await esmock('../../../../src/commands/trello/checklist/get.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getChecklist: async () => ({data: {}, success: true}),
      },
      '@hesed/plugin-lib': {
        createProfileManager(_config: any, profile: string | undefined) {
          capturedProfile = profile
          return {loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'})}
        },
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new ChecklistGet.default(['checklist123', '--profile', 'work'], createMockConfig())
    command.logJson = () => {}
    await command.run()

    expect(capturedProfile).to.equal('work')
  })
})
