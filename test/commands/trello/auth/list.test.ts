import {expect} from 'chai'

describe('auth:list', () => {
  // Auth:list is a thin wrapper around @hesed/plugin-lib's createAuthListCommand.
  // Detailed functionality is tested in plugin-lib's own test suite.
  it('exports the command', async () => {
    const {default: AuthList} = await import('../../../../src/commands/trello/auth/list.js')

    expect(AuthList).to.be.a('function')
  })
})
