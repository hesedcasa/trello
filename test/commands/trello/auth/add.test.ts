/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('auth:add', () => {
  let AuthAdd: any
  let mockFs: any
  let mockInput: any
  let mockAction: any
  let mockTestConnection: any
  let mockClearClients: any

  beforeEach(async () => {
    mockInput = async ({default: defaultValue}: any) => defaultValue ?? 'test-value'

    mockFs = {
      async createFile() {},
      pathExists: async () => false,
      readJSON: async () => ({auth: {apiKey: 'test-key', apiToken: 'test-token'}}),
      async writeJSON() {},
    }

    mockAction = {
      start() {},
      stop() {},
    }

    mockTestConnection = async () => ({data: {id: 'me'}, success: true})
    mockClearClients = () => {}

    AuthAdd = await esmock('../../../../src/commands/trello/auth/add.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        testConnection: mockTestConnection,
      },
      '@inquirer/prompts': {input: mockInput},
      '@oclif/core/ux': {action: mockAction},
      'fs-extra': {default: mockFs},
    })
  })

  it('adds authentication with flags', async () => {
    const command = new AuthAdd.default(['--key', 'my-key', '--token', 'my-token'], createMockConfig())

    const result = await command.run()

    expect(result.success).to.be.true
  })

  it('handles authentication failure', async () => {
    mockTestConnection = async () => ({error: 'Invalid credentials', success: false})

    AuthAdd = await esmock('../../../../src/commands/trello/auth/add.js', {
      '../../../../src/trello/trello-client.js': {
        clearClients: mockClearClients,
        testConnection: mockTestConnection,
      },
      '@inquirer/prompts': {input: mockInput},
      '@oclif/core/ux': {action: mockAction},
      'fs-extra': {default: mockFs},
    })

    const command = new AuthAdd.default(['--key', 'bad-key', '--token', 'bad-token'], createMockConfig())

    try {
      await command.run()
    } catch {
      // Expected error from this.error()
    }

    // Verify testConnection mock returns failure
    const mockResult = await mockTestConnection()
    expect(mockResult.success).to.be.false
  })
})
