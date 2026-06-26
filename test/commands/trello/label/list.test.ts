/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('label:list', () => {
  let LabelList: any
  let mockCreateProfileManager: any
  let mockGetBoardLabels: any
  let mockClearClients: any

  beforeEach(async () => {
    mockCreateProfileManager = () => ({
      loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'}),
    })

    mockGetBoardLabels = async () => ({
      data: [{color: 'red', id: 'label1', name: 'Bug'}],
      success: true,
    })

    mockClearClients = () => {}

    LabelList = await esmock('../../../../src/commands/trello/label/index.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getBoardLabels: mockGetBoardLabels,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })
  })

  it('lists labels on a board', async () => {
    const command = new LabelList.default(['board123'], createMockConfig())
    const result = await command.run()

    expect(result.success).to.be.true
    expect(result.data).to.be.an('array')
  })

  it('exits early when config is not available', async () => {
    LabelList = await esmock('../../../../src/commands/trello/label/index.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getBoardLabels: mockGetBoardLabels,
      },
      '@hesed/plugin-lib': {
        createProfileManager: () => ({loadAuthConfig: async () => null}),
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new LabelList.default(['board123'], createMockConfig())
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

    LabelList = await esmock('../../../../src/commands/trello/label/index.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getBoardLabels: async () => ({data: [], success: true}),
      },
      '@hesed/plugin-lib': {
        createProfileManager(_config: any, profile: string | undefined) {
          capturedProfile = profile
          return {loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'})}
        },
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new LabelList.default(['board123', '--profile', 'work'], createMockConfig())
    await command.run()

    expect(capturedProfile).to.equal('work')
  })
})
