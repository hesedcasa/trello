import {createProfileManager, formatAsToon} from '@hesed/plugin-lib'
import {Args, Command, Flags} from '@oclif/core'

import {type Config} from '../../../trello/trello-api.js'
import {clearClients, searchCards} from '../../../trello/trello-client.js'

export default class CardSearch extends Command {
  static override args = {
    query: Args.string({description: 'Search query', required: true}),
  }
  static override description = 'Search for cards'
  static override examples = [
    '<%= config.bin %> <%= command.id %> "bug fix"',
    '<%= config.bin %> <%= command.id %> "bug fix" --boards boardId1,boardId2',
  ]
  static override flags = {
    boards: Flags.string({description: 'Comma-separated board IDs to search within', required: false}),
    profile: Flags.string({char: 'p', description: 'Authentication profile name', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(CardSearch)
    const pm = createProfileManager<Config>(this.config, flags.profile)
    const auth = await pm.loadAuthConfig()
    if (!auth) {
      this.error(`Missing authentication config.`)
    }

    const result = await searchCards(auth, args.query, flags.boards)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
