/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('label:delete', () => {
  let LabelDelete: any
  let mockCreateProfileManager: any
  let mockDeleteLabel: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockCreateProfileManager = () => ({
      loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'}),
    })

    mockDeleteLabel = async () => ({data: true, success: true})
    mockClearClients = () => {}

    LabelDelete = await esmock('../../../../src/commands/trello/label/delete.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        deleteLabel: mockDeleteLabel,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
      },
    })
  })

  it('deletes a label', async () => {
    const command = new LabelDelete.default(['label123'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
  })

  it('exits early when config is not available', async () => {
    LabelDelete = await esmock('../../../../src/commands/trello/label/delete.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        deleteLabel: mockDeleteLabel,
      },
      '@hesed/plugin-lib': {
        createProfileManager: () => ({loadAuthConfig: async () => null}),
      },
    })

    const command = new LabelDelete.default(['label123'], createMockConfig())
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
})
