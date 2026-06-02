import {createProfileManager} from '@hesed/plugin-lib'
import {Args, Command} from '@oclif/core'

import {type Config} from '../../../trello/trello-api.js'
import {clearClients, deleteLabel} from '../../../trello/trello-client.js'

export default class LabelDelete extends Command {
  static override args = {
    labelId: Args.string({description: 'Label ID', required: true}),
  }
  static override description = 'Delete a label'
  static override examples = ['<%= config.bin %> <%= command.id %> 5a1b2c3d']

  public async run(): Promise<void> {
    const {args} = await this.parse(LabelDelete)
    const pm = createProfileManager<Config>(this.config)
    const auth = await pm.loadAuthConfig()
    if (!auth) {
      this.error(`Missing authentication config.`)
    }

    const result = await deleteLabel(auth, args.labelId)
    clearClients()

    this.logJson(result)
  }
}
