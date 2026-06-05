/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('list:archive', () => {
  let ListArchive: any
  let mockCreateProfileManager: any
  let mockArchiveList: any
  let mockArchiveAllCardsInList: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockCreateProfileManager = () => ({
      loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'}),
    })

    mockArchiveList = async () => ({data: {closed: true, id: 'list123'}, success: true})
    mockArchiveAllCardsInList = async () => ({data: true, success: true})
    mockClearClients = () => {}

    ListArchive = await esmock('../../../../src/commands/trello/list/archive.js', {
      '../../../../src/trello/trello-client.js': {
        archiveAllCardsInList: mockArchiveAllCardsInList,
        archiveList: mockArchiveList,
        clearClients: mockClearClients,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
      },
    })
  })

  it('archives a list', async () => {
    const command = new ListArchive.default(['list123'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
  })

  it('archives only cards with --cards-only flag', async () => {
    const command = new ListArchive.default(['list123', '--cards-only'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
    expect(jsonOutput.data).to.be.true
  })

  it('exits early when config is not available', async () => {
    ListArchive = await esmock('../../../../src/commands/trello/list/archive.js', {
      '../../../../src/trello/trello-client.js': {
        archiveAllCardsInList: mockArchiveAllCardsInList,
        archiveList: mockArchiveList,
        clearClients: mockClearClients,
      },
      '@hesed/plugin-lib': {
        createProfileManager: () => ({loadAuthConfig: async () => null}),
      },
    })

    const command = new ListArchive.default(['list123'], createMockConfig())
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

  it('passes profile flag to createProfileManager', async () => {
    let capturedProfile: string | undefined

    ListArchive = await esmock('../../../../src/commands/trello/list/archive.js', {
      '../../../../src/trello/trello-client.js': {
        archiveAllCardsInList: async () => ({data: true, success: true}),
        archiveList: async () => ({data: {}, success: true}),
        clearClients: mockClearClients,
      },
      '@hesed/plugin-lib': {
        createProfileManager(_config: any, profile: string | undefined) {
          capturedProfile = profile
          return {loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'})}
        },
      },
    })

    const command = new ListArchive.default(['list123', '--profile', 'work'], createMockConfig())
    command.logJson = () => {}
    await command.run()

    expect(capturedProfile).to.equal('work')
  })
})
