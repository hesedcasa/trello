import {Args, Command} from '@oclif/core'
import {createProfileManager} from '@hesed/plugin-lib'

import {type Config} from '../../../trello/trello-api.js'
import {clearClients, getClient} from '../../../trello/trello-client.js'

export default class CardDelete extends Command {
  static override args = {
    cardId: Args.string({description: 'Card ID', required: true}),
  }
  static override description = 'Delete a card'
  static override examples = ['<%= config.bin %> <%= command.id %> 5a1b2c3d']

  public async run(): Promise<void> {
    const {args} = await this.parse(CardDelete)
    const pm = createProfileManager<Config>(this.config)
    const auth = pm.loadAuthConfig()
    if (!auth) { this.error('Not authenticated. Run trello auth add first.'); return }

    const result = await getClient(auth).deleteCard(args.cardId)
    clearClients()

    this.logJson(result)
  }
}
