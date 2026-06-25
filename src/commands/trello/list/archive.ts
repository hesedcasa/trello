import {type ApiResult, createProfileManager} from '@hesed/plugin-lib'
import {Args, Flags} from '@oclif/core'

import {BaseCommand} from '../../../base-command.js'
import {type Config} from '../../../trello/trello-api.js'
import {archiveAllCardsInList, archiveList, clearClients} from '../../../trello/trello-client.js'

export default class ListArchive extends BaseCommand {
  static override args = {
    listId: Args.string({description: 'List ID', required: true}),
  }
  static override description = 'Archive a list or all cards in a list'
  static override examples = [
    '<%= config.bin %> <%= command.id %> 5a1b2c3d',
    '<%= config.bin %> <%= command.id %> 5a1b2c3d --cards-only',
  ]
  static override flags = {
    'cards-only': Flags.boolean({description: 'Only archive cards in the list, not the list itself', required: false}),
    profile: Flags.string({char: 'p', description: 'Authentication profile name', required: false}),
  }

  public async run(): Promise<ApiResult> {
    const {args, flags} = await this.parse(ListArchive)
    const pm = createProfileManager<Config>(this.config, flags.profile, 'trello-config.json')
    const auth = await pm.loadAuthConfig()
    if (!auth) {
      this.error(`Missing authentication config.`)
    }

    const result = flags['cards-only']
      ? await archiveAllCardsInList(auth, args.listId)
      : await archiveList(auth, args.listId)
    clearClients()
    return result
  }
}
