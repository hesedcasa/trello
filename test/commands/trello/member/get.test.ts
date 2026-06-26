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

  beforeEach(async () => {
    mockCreateProfileManager = () => ({
      loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'}),
    })

    mockGetMember = async (_config: any, memberId: string) => ({
      data: {fullName: 'Test User', id: memberId, username: 'testuser'},
      success: true,
    })

    mockClearClients = () => {}

    MemberGet = await esmock('../../../../src/commands/trello/member/index.js', {
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
    const result = await command.run()

    expect(result.success).to.be.true
    expect(result.data).to.have.property('id', 'me')
    expect(result.data).to.have.property('fullName', 'Test User')
  })

  it('retrieves specific member by ID', async () => {
    const command = new MemberGet.default(['johndoe'], createMockConfig())
    const result = await command.run()

    expect(result.success).to.be.true
    expect(result.data).to.have.property('id', 'johndoe')
  })

  it('passes profile flag to createProfileManager', async () => {
    let capturedProfile: string | undefined

    MemberGet = await esmock('../../../../src/commands/trello/member/index.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        getMember: async () => ({data: {}, success: true}),
      },
      '@hesed/plugin-lib': {
        createProfileManager(_config: any, profile: string | undefined) {
          capturedProfile = profile
          return {loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'})}
        },
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new MemberGet.default(['--profile', 'work'], createMockConfig())
    await command.run()

    expect(capturedProfile).to.equal('work')
  })
})
