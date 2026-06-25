import {type ApiResult, createProfileManager} from '@hesed/plugin-lib'
import {Args, Flags} from '@oclif/core'

import {BaseCommand} from '../../../base-command.js'
import {type Config} from '../../../trello/trello-api.js'
import {clearClients, deleteChecklistItem} from '../../../trello/trello-client.js'

export default class ChecklistDeleteItem extends BaseCommand {
  /* eslint-disable perfectionist/sort-objects */
  static override args = {
    checklistId: Args.string({description: 'Checklist ID', required: true}),
    checkItemId: Args.string({description: 'Check item ID', required: true}),
  }
  /* eslint-enable perfectionist/sort-objects */
  static override description = 'Delete an item from a checklist'
  static override examples = ['<%= config.bin %> <%= command.id %> checklistId123 itemId456']
  static override flags = {
    profile: Flags.string({char: 'p', description: 'Authentication profile name', required: false}),
  }

  public async run(): Promise<ApiResult> {
    const {args, flags} = await this.parse(ChecklistDeleteItem)
    const pm = createProfileManager<Config>(this.config, flags.profile, 'trello-config.json')
    const auth = await pm.loadAuthConfig()
    if (!auth) {
      this.error(`Missing authentication config.`)
    }

    const result = await deleteChecklistItem(auth, args.checklistId, args.checkItemId)
    clearClients()
    return result
  }
}
