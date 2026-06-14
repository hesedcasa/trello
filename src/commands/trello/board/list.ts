import {createProfileManager, formatAsToon} from '@hesed/plugin-lib'
import {Command, Flags} from '@oclif/core'

import {type Config} from '../../../trello/trello-api.js'
import {clearClients, getMyBoards} from '../../../trello/trello-client.js'

export default class BoardList extends Command {
  static override args = {}
  static override description = 'List all boards for the authenticated member'
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    filter: Flags.string({
      default: 'open',
      description: 'Filter boards by status',
      options: ['all', 'closed', 'members', 'open', 'organization', 'public', 'starred'],
    }),
    profile: Flags.string({char: 'p', description: 'Authentication profile name', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(BoardList)
    const pm = createProfileManager<Config>(this.config, flags.profile, 'trello-config.json')
    const auth = await pm.loadAuthConfig()
    if (!auth) {
      this.error(`Missing authentication config.`)
    }

    const result = await getMyBoards(auth, flags.filter)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
