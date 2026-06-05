import {createProfileManager, formatAsToon} from '@hesed/plugin-lib'
import {Args, Command, Flags} from '@oclif/core'

import {type Config} from '../../../trello/trello-api.js'
import {clearClients, getBoard} from '../../../trello/trello-client.js'

export default class BoardGet extends Command {
  static override args = {
    boardId: Args.string({description: 'Board ID', required: true}),
  }
  static override description = 'Get details of a specific board'
  static override examples = ['<%= config.bin %> <%= command.id %> 5a1b2c3d4e5f6g7h8i9j']
  static override flags = {
    profile: Flags.string({char: 'p', description: 'Authentication profile name', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(BoardGet)
    const pm = createProfileManager<Config>(this.config, flags.profile)
    const auth = await pm.loadAuthConfig()
    if (!auth) {
      this.error(`Missing authentication config.`)
    }

    const result = await getBoard(auth, args.boardId)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
