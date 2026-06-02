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
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

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
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
    expect(jsonOutput.data).to.be.an('array')
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
