/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('list:create', () => {
  let ListCreate: any
  let mockCreateProfileManager: any
  let mockCreateList: any
  let mockClearClients: any

  beforeEach(async () => {
    mockCreateProfileManager = () => ({
      loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'}),
    })

    mockCreateList = async () => ({
      data: {id: 'list1', name: 'To Do'},
      success: true,
    })

    mockClearClients = () => {}

    ListCreate = await esmock('../../../../src/commands/trello/list/create.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        createList: mockCreateList,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })
  })

  it('creates a list on a board', async () => {
    const command = new ListCreate.default(['board123', 'To Do'], createMockConfig())
    const result = await command.run()

    expect(result.success).to.be.true
    expect(result.data).to.have.property('name', 'To Do')
  })

  it('creates a list with --pos flag', async () => {
    const command = new ListCreate.default(['board123', 'Done', '--pos', 'top'], createMockConfig())
    const result = await command.run()

    expect(result.success).to.be.true
  })

  it('exits early when config is not available', async () => {
    ListCreate = await esmock('../../../../src/commands/trello/list/create.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        createList: mockCreateList,
      },
      '@hesed/plugin-lib': {
        createProfileManager: () => ({loadAuthConfig: async () => null}),
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new ListCreate.default(['board123', 'To Do'], createMockConfig())
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

    ListCreate = await esmock('../../../../src/commands/trello/list/create.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        createList: async () => ({data: {}, success: true}),
      },
      '@hesed/plugin-lib': {
        createProfileManager(_config: any, profile: string | undefined) {
          capturedProfile = profile
          return {loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'})}
        },
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new ListCreate.default(['board123', 'My List', '--profile', 'work'], createMockConfig())
    await command.run()

    expect(capturedProfile).to.equal('work')
  })
})
