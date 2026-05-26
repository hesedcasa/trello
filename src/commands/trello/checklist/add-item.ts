import {Args, Command, Flags} from '@oclif/core'
import {createProfileManager, formatAsToon} from '@hesed/plugin-lib'

import {type Config} from '../../../trello/trello-api.js'
import {clearClients, getClient} from '../../../trello/trello-client.js'

export default class ChecklistAddItem extends Command {
  static override args = {
    checklistId: Args.string({description: 'Checklist ID', required: true}),
    name: Args.string({description: 'Check item name', required: true}),
  }
  static override description = 'Add an item to a checklist'
  static override examples = ['<%= config.bin %> <%= command.id %> checklistId123 "Buy groceries"']
  static override flags = {
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(ChecklistAddItem)
    const pm = createProfileManager<Config>(this.config)
    const auth = pm.loadAuthConfig()
    if (!auth) { this.error('Not authenticated. Run trello auth add first.'); return }

    const result = await getClient(auth).createChecklistItem(args.checklistId, args.name)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
