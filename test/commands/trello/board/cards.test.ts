/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('board:cards', () => {
  let BoardCards: any
  let mockCreateProfileManager: any
  let mockGetBoardCards: any
  let mockClearClients: any

  beforeEach(async () => {
    mockCreateProfileManager = () => ({
      loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'}),
    })

    mockGetBoardCards = async () => ({
      data: [{id: 'card1', name: 'Card One'}],
      success: true,
    })

    mockClearClients = () => {}

    BoardCards = await esmock('../../../../src/commands/trello/board/cards.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getBoardCards: mockGetBoardCards,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })
  })

  it('retrieves cards for a board', async () => {
    const command = new BoardCards.default(['board123'], createMockConfig())
    const result = await command.run()

    expect(result.success).to.be.true
    expect(result.data).to.be.an('array')
  })

  it('formats output as TOON when --toon flag is provided', async () => {
    let toonOutput = ''
    const command = new BoardCards.default(['board123', '--toon'], createMockConfig())
    command.log = (output: string) => {
      toonOutput = output
    }

    await command.run()

    expect(toonOutput).to.include('card1')
  })

  it('exits early when config is not available', async () => {
    BoardCards = await esmock('../../../../src/commands/trello/board/cards.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getBoardCards: mockGetBoardCards,
      },
      '@hesed/plugin-lib': {
        createProfileManager: () => ({loadAuthConfig: async () => null}),
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new BoardCards.default(['board123'], createMockConfig())
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

    BoardCards = await esmock('../../../../src/commands/trello/board/cards.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getBoardCards: async () => ({data: [], success: true}),
      },
      '@hesed/plugin-lib': {
        createProfileManager(_config: any, profile: string | undefined) {
          capturedProfile = profile
          return {loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'})}
        },
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new BoardCards.default(['board123', '--profile', 'work'], createMockConfig())
    await command.run()

    expect(capturedProfile).to.equal('work')
  })
})
