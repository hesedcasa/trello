/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('card:comments', () => {
  let CardComments: any
  let mockCreateProfileManager: any
  let mockGetCardActions: any
  let mockClearClients: any

  beforeEach(async () => {
    mockCreateProfileManager = () => ({
      loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'}),
    })

    mockGetCardActions = async () => ({
      data: [{data: {text: 'A comment'}, id: 'action1', type: 'commentCard'}],
      success: true,
    })

    mockClearClients = () => {}

    CardComments = await esmock('../../../../src/commands/trello/card/comments.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getCardActions: mockGetCardActions,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })
  })

  it('retrieves comments for a card', async () => {
    const command = new CardComments.default(['card123'], createMockConfig())
    const result = await command.run()

    expect(result.success).to.be.true
    expect(result.data).to.be.an('array')
  })

  it('exits early when config is not available', async () => {
    CardComments = await esmock('../../../../src/commands/trello/card/comments.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getCardActions: mockGetCardActions,
      },
      '@hesed/plugin-lib': {
        createProfileManager: () => ({loadAuthConfig: async () => null}),
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new CardComments.default(['card123'], createMockConfig())
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

    CardComments = await esmock('../../../../src/commands/trello/card/comments.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getCardActions: async () => ({data: [], success: true}),
      },
      '@hesed/plugin-lib': {
        createProfileManager(_config: any, profile: string | undefined) {
          capturedProfile = profile
          return {loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'})}
        },
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new CardComments.default(['card123', '--profile', 'work'], createMockConfig())
    await command.run()

    expect(capturedProfile).to.equal('work')
  })
})
