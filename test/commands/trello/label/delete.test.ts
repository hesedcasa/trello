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

  beforeEach(async () => {
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
    const result = await command.run()

    expect(result.success).to.be.true
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

    LabelDelete = await esmock('../../../../src/commands/trello/label/delete.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        deleteLabel: async () => ({data: true, success: true}),
      },
      '@hesed/plugin-lib': {
        createProfileManager(_config: any, profile: string | undefined) {
          capturedProfile = profile
          return {loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'})}
        },
      },
    })

    const command = new LabelDelete.default(['label123', '--profile', 'work'], createMockConfig())
    await command.run()

    expect(capturedProfile).to.equal('work')
  })
})
