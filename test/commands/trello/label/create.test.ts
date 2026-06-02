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
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

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
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
    expect(jsonOutput.data).to.have.property('name', 'Bug')
    expect(jsonOutput.data).to.have.property('color', 'red')
  })
})
