import {expect} from 'chai'

describe('auth:profile', () => {
  // Auth:profile is a thin wrapper around @hesed/plugin-lib's createAuthProfileCommand.
  // Detailed functionality is tested in plugin-lib's own test suite.
  it('exports the command', async () => {
    const {default: AuthProfile} = await import('../../../../src/commands/trello/auth/profile.js')

    expect(AuthProfile).to.be.a('function')
  })
})
