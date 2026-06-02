import {createProfileManager} from '@hesed/plugin-lib'
import {Args, Command} from '@oclif/core'

import {type Config} from '../../../trello/trello-api.js'
import {clearClients, deleteChecklist} from '../../../trello/trello-client.js'

export default class ChecklistDelete extends Command {
  static override args = {
    checklistId: Args.string({description: 'Checklist ID', required: true}),
  }
  static override description = 'Delete a checklist'
  static override examples = ['<%= config.bin %> <%= command.id %> 5a1b2c3d']

  public async run(): Promise<void> {
    const {args} = await this.parse(ChecklistDelete)
    const pm = createProfileManager<Config>(this.config)
    const auth = await pm.loadAuthConfig()
    if (!auth) {
      this.error(`Missing authentication config.`)
    }

    const result = await deleteChecklist(auth, args.checklistId)
    clearClients()

    this.logJson(result)
  }
}
