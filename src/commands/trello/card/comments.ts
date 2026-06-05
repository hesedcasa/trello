import {createProfileManager, formatAsToon} from '@hesed/plugin-lib'
import {Args, Command, Flags} from '@oclif/core'

import {type Config} from '../../../trello/trello-api.js'
import {clearClients, getCardActions} from '../../../trello/trello-client.js'

export default class CardComments extends Command {
  static override args = {
    cardId: Args.string({description: 'Card ID', required: true}),
  }
  static override description = 'Get comments on a card'
  static override examples = ['<%= config.bin %> <%= command.id %> 5a1b2c3d']
  static override flags = {
    profile: Flags.string({char: 'p', description: 'Authentication profile name', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(CardComments)
    const pm = createProfileManager<Config>(this.config, flags.profile, 'trello-config.json')
    const auth = await pm.loadAuthConfig()
    if (!auth) {
      this.error(`Missing authentication config.`)
    }

    const result = await getCardActions(auth, args.cardId, 'commentCard')
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
