/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('list:archive', () => {
  let ListArchive: any
  let mockReadConfig: any
  let mockArchiveList: any
  let mockArchiveAllCardsInList: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockReadConfig = async () => ({
      auth: {apiKey: 'test-key', apiToken: 'test-token'},
    })

    mockArchiveList = async () => ({data: {closed: true, id: 'list123'}, success: true})
    mockArchiveAllCardsInList = async () => ({data: true, success: true})
    mockClearClients = () => {}

    ListArchive = await esmock('../../../../src/commands/trello/list/archive.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        archiveAllCardsInList: mockArchiveAllCardsInList,
        archiveList: mockArchiveList,
        clearClients: mockClearClients,
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
    mockReadConfig = async () => null

    ListArchive = await esmock('../../../../src/commands/trello/list/archive.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        archiveAllCardsInList: mockArchiveAllCardsInList,
        archiveList: mockArchiveList,
        clearClients: mockClearClients,
      },
    })

    const command = new ListArchive.default(['list123'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()
    expect(jsonOutput).to.be.null
  })
})
