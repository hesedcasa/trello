/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('label:list', () => {
  let LabelList: any
  let mockReadConfig: any
  let mockGetBoardLabels: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockReadConfig = async () => ({
      auth: {apiKey: 'test-key', apiToken: 'test-token'},
    })

    mockGetBoardLabels = async () => ({
      data: [{color: 'red', id: 'label1', name: 'Bug'}],
      success: true,
    })

    mockClearClients = () => {}

    LabelList = await esmock('../../../../src/commands/trello/label/list.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getBoardLabels: mockGetBoardLabels,
      },
    })
  })

  it('lists labels on a board', async () => {
    const command = new LabelList.default(['board123'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
    expect(jsonOutput.data).to.be.an('array')
  })

  it('exits early when config is not available', async () => {
    mockReadConfig = async () => null

    LabelList = await esmock('../../../../src/commands/trello/label/list.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getBoardLabels: mockGetBoardLabels,
      },
    })

    const command = new LabelList.default(['board123'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()
    expect(jsonOutput).to.be.null
  })
})
