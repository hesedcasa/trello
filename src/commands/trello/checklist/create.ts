import {createProfileManager, formatAsToon} from '@hesed/plugin-lib'
import {Args, Command, Flags} from '@oclif/core'

import {type Config} from '../../../trello/trello-api.js'
import {clearClients, createChecklist} from '../../../trello/trello-client.js'

export default class ChecklistCreate extends Command {
  static override args = {
    cardId: Args.string({description: 'Card ID', required: true}),
    name: Args.string({description: 'Checklist name', required: true}),
  }
  static override description = 'Create a new checklist on a card'
  static override examples = ['<%= config.bin %> <%= command.id %> cardId123 "My Checklist"']
  static override flags = {
    profile: Flags.string({char: 'p', description: 'Authentication profile name', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(ChecklistCreate)
    const pm = createProfileManager<Config>(this.config, flags.profile, 'trello-config.json')
    const auth = await pm.loadAuthConfig()
    if (!auth) {
      this.error(`Missing authentication config.`)
    }

    const result = await createChecklist(auth, args.cardId, args.name)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
