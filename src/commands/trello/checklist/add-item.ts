import {type ApiResult, createProfileManager, formatAsToon} from '@hesed/plugin-lib'
import {Args, Flags} from '@oclif/core'

import {BaseCommand} from '../../../base-command.js'
import {type Config} from '../../../trello/trello-api.js'
import {clearClients, createChecklistItem} from '../../../trello/trello-client.js'

export default class ChecklistAddItem extends BaseCommand {
  static override args = {
    checklistId: Args.string({description: 'Checklist ID', required: true}),
    name: Args.string({description: 'Check item name', required: true}),
  }
  static override description = 'Add an item to a checklist'
  static override examples = ['<%= config.bin %> <%= command.id %> checklistId123 "Buy groceries"']
  static override flags = {
    profile: Flags.string({char: 'p', description: 'Authentication profile name', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<ApiResult> {
    const {args, flags} = await this.parse(ChecklistAddItem)
    const pm = createProfileManager<Config>(this.config, flags.profile, 'trello-config.json')
    const auth = await pm.loadAuthConfig()
    if (!auth) {
      this.error(`Missing authentication config.`)
    }

    const result = await createChecklistItem(auth, args.checklistId, args.name)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    }

    return result
  }
}
