/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('label:create', () => {
  let LabelCreate: any
  let mockCreateProfileManager: any
  let mockCreateLabel: any
  let mockClearClients: any

  beforeEach(async () => {
    mockCreateProfileManager = () => ({
      loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'}),
    })

    mockCreateLabel = async () => ({
      data: {color: 'red', id: 'label1', name: 'Bug'},
      success: true,
    })

    mockClearClients = () => {}

    LabelCreate = await esmock('../../../../src/commands/trello/label/create.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        createLabel: mockCreateLabel,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })
  })

  it('creates a label on a board', async () => {
    const command = new LabelCreate.default(['board123', 'Bug', 'red'], createMockConfig())
    const result = await command.run()

    expect(result.success).to.be.true
    expect(result.data).to.have.property('name', 'Bug')
    expect(result.data).to.have.property('color', 'red')
  })

  it('passes profile flag to createProfileManager', async () => {
    let capturedProfile: string | undefined

    LabelCreate = await esmock('../../../../src/commands/trello/label/create.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        createLabel: async () => ({data: {}, success: true}),
      },
      '@hesed/plugin-lib': {
        createProfileManager(_config: any, profile: string | undefined) {
          capturedProfile = profile
          return {loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'})}
        },
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new LabelCreate.default(['board123', 'Bug', 'red', '--profile', 'work'], createMockConfig())
    await command.run()

    expect(capturedProfile).to.equal('work')
  })
})
