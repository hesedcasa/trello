import {type ApiResult, createProfileManager, formatAsToon} from '@hesed/plugin-lib'
import {Args, Flags} from '@oclif/core'

import {BaseCommand} from '../../../base-command.js'
import {type Config} from '../../../trello/trello-api.js'
import {clearClients, getBoard} from '../../../trello/trello-client.js'

export default class BoardGet extends BaseCommand {
  static override args = {
    boardId: Args.string({description: 'Board ID', required: true}),
  }
  static override description = 'Get details of a specific board'
  static override examples = ['<%= config.bin %> <%= command.id %> 5a1b2c3d4e5f6g7h8i9j']
  static override flags = {
    profile: Flags.string({char: 'p', description: 'Authentication profile name', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<ApiResult> {
    const {args, flags} = await this.parse(BoardGet)
    const pm = createProfileManager<Config>(this.config, flags.profile, 'trello-config.json')
    const auth = await pm.loadAuthConfig()
    if (!auth) {
      this.error(`Missing authentication config.`)
    }

    const result = await getBoard(auth, args.boardId)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    }

    return result
  }
}
