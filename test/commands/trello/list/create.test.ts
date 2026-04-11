/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('list:create', () => {
  let ListCreate: any
  let mockReadConfig: any
  let mockCreateList: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockReadConfig = async () => ({
      auth: {apiKey: 'test-key', apiToken: 'test-token'},
    })

    mockCreateList = async () => ({
      data: {id: 'list1', name: 'To Do'},
      success: true,
    })

    mockClearClients = () => {}

    ListCreate = await esmock('../../../../src/commands/trello/list/create.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        createList: mockCreateList,
      },
    })
  })

  it('creates a list on a board', async () => {
    const command = new ListCreate.default(['board123', 'To Do'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
    expect(jsonOutput.data).to.have.property('name', 'To Do')
  })

  it('creates a list with --pos flag', async () => {
    const command = new ListCreate.default(['board123', 'Done', '--pos', 'top'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
  })

  it('exits early when config is not available', async () => {
    mockReadConfig = async () => null

    ListCreate = await esmock('../../../../src/commands/trello/list/create.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        createList: mockCreateList,
      },
    })

    const command = new ListCreate.default(['board123', 'To Do'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()
    expect(jsonOutput).to.be.null
  })
})
