import {type ApiResult, createProfileManager, formatAsToon} from '@hesed/plugin-lib'
import {Args, Flags} from '@oclif/core'

import {BaseCommand} from '../../../base-command.js'
import {type Config} from '../../../trello/trello-api.js'
import {clearClients, getList} from '../../../trello/trello-client.js'

export default class ListGet extends BaseCommand {
  static override args = {
    listId: Args.string({description: 'List ID', required: true}),
  }
  static override description = 'Get details of a specific list'
  static override examples = ['<%= config.bin %> <%= command.id %> 5a1b2c3d']
  static override flags = {
    profile: Flags.string({char: 'p', description: 'Authentication profile name', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<ApiResult> {
    const {args, flags} = await this.parse(ListGet)
    const pm = createProfileManager<Config>(this.config, flags.profile, 'trello-config.json')
    const auth = await pm.loadAuthConfig()
    if (!auth) {
      this.error(`Missing authentication config.`)
    }

    const result = await getList(auth, args.listId)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    }

    return result
  }
}
