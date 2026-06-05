/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('list:get', () => {
  let ListGet: any
  let mockCreateProfileManager: any
  let mockGetList: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockCreateProfileManager = () => ({
      loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'}),
    })

    mockGetList = async (_config: any, listId: string) => ({
      data: {id: listId, name: 'Test List'},
      success: true,
    })

    mockClearClients = () => {}

    ListGet = await esmock('../../../../src/commands/trello/list/get.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getList: mockGetList,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })
  })

  it('retrieves list with valid list ID', async () => {
    const command = new ListGet.default(['list123'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
    expect(jsonOutput.data).to.have.property('id', 'list123')
    expect(jsonOutput.data).to.have.property('name', 'Test List')
  })

  it('calls clearClients after execution', async () => {
    let clearClientsCalled = false

    ListGet = await esmock('../../../../src/commands/trello/list/get.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients() {
          clearClientsCalled = true
        },
        getList: mockGetList,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new ListGet.default(['list123'], createMockConfig())
    command.logJson = () => {}

    await command.run()
    expect(clearClientsCalled).to.be.true
  })

  it('passes profile flag to createProfileManager', async () => {
    let capturedProfile: string | undefined

    ListGet = await esmock('../../../../src/commands/trello/list/get.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getList: async () => ({data: {}, success: true}),
      },
      '@hesed/plugin-lib': {
        createProfileManager(_config: any, profile: string | undefined) {
          capturedProfile = profile
          return {loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'})}
        },
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new ListGet.default(['list123', '--profile', 'work'], createMockConfig())
    command.logJson = () => {}
    await command.run()

    expect(capturedProfile).to.equal('work')
  })
})
