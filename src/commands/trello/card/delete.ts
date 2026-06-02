import {createProfileManager} from '@hesed/plugin-lib'
import {Args, Command} from '@oclif/core'

import {type Config} from '../../../trello/trello-api.js'
import {clearClients, deleteCard} from '../../../trello/trello-client.js'

export default class CardDelete extends Command {
  static override args = {
    cardId: Args.string({description: 'Card ID', required: true}),
  }
  static override description = 'Delete a card'
  static override examples = ['<%= config.bin %> <%= command.id %> 5a1b2c3d']

  public async run(): Promise<void> {
    const {args} = await this.parse(CardDelete)
    const pm = createProfileManager<Config>(this.config)
    const auth = await pm.loadAuthConfig()
    if (!auth) {
      this.error(`Missing authentication config.`)
    }

    const result = await deleteCard(auth, args.cardId)
    clearClients()

    this.logJson(result)
  }
}
