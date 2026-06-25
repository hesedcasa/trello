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

  beforeEach(async () => {
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
    const result = await command.run()

    expect(result.success).to.be.true
    expect(result.data).to.have.property('id', 'checklist123')
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
    await command.run()

    expect(capturedProfile).to.equal('work')
  })
})
