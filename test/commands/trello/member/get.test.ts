/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('member:get', () => {
  let MemberGet: any
  let mockCreateProfileManager: any
  let mockGetMember: any
  let mockClearClients: any
  let jsonOutput: any

  beforeEach(async () => {
    jsonOutput = null

    mockCreateProfileManager = () => ({
      loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'}),
    })

    mockGetMember = async (_config: any, memberId: string) => ({
      data: {fullName: 'Test User', id: memberId, username: 'testuser'},
      success: true,
    })

    mockClearClients = () => {}

    MemberGet = await esmock('../../../../src/commands/trello/member/get.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getMember: mockGetMember,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })
  })

  it('retrieves member with default "me"', async () => {
    const command = new MemberGet.default([], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
    expect(jsonOutput.data).to.have.property('id', 'me')
    expect(jsonOutput.data).to.have.property('fullName', 'Test User')
  })

  it('retrieves specific member by ID', async () => {
    const command = new MemberGet.default(['johndoe'], createMockConfig())
    command.logJson = (output: any) => {
      jsonOutput = output
    }

    await command.run()

    expect(jsonOutput.success).to.be.true
    expect(jsonOutput.data).to.have.property('id', 'johndoe')
  })
})
