import {Args, Command} from '@oclif/core'
import {createProfileManager} from '@hesed/plugin-lib'

import {type Config} from '../../../trello/trello-api.js'
import {clearClients, getClient} from '../../../trello/trello-client.js'

export default class ChecklistDeleteItem extends Command {
  /* eslint-disable perfectionist/sort-objects */
  static override args = {
    checklistId: Args.string({description: 'Checklist ID', required: true}),
    checkItemId: Args.string({description: 'Check item ID', required: true}),
  }
  /* eslint-enable perfectionist/sort-objects */
  static override description = 'Delete an item from a checklist'
  static override examples = ['<%= config.bin %> <%= command.id %> checklistId123 itemId456']

  public async run(): Promise<void> {
    const {args} = await this.parse(ChecklistDeleteItem)
    const pm = createProfileManager<Config>(this.config)
    const auth = pm.loadAuthConfig()
    if (!auth) { this.error('Not authenticated. Run trello auth add first.'); return }

    const result = await getClient(auth).deleteChecklistItem(args.checklistId, args.checkItemId)
    clearClients()

    this.logJson(result)
  }
}
