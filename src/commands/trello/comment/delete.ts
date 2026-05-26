import {Args, Command} from '@oclif/core'
import {createProfileManager} from '@hesed/plugin-lib'

import {type Config} from '../../../trello/trello-api.js'
import {clearClients, getClient} from '../../../trello/trello-client.js'

export default class CommentDelete extends Command {
  /* eslint-disable perfectionist/sort-objects */
  static override args = {
    cardId: Args.string({description: 'Card ID', required: true}),
    actionId: Args.string({description: 'Comment action ID', required: true}),
  }
  /* eslint-enable perfectionist/sort-objects */
  static override description = 'Delete a comment from a card'
  static override examples = ['<%= config.bin %> <%= command.id %> cardId123 actionId456']

  public async run(): Promise<void> {
    const {args} = await this.parse(CommentDelete)
    const pm = createProfileManager<Config>(this.config)
    const auth = pm.loadAuthConfig()
    if (!auth) { this.error('Not authenticated. Run trello auth add first.'); return }

    const result = await getClient(auth).deleteCardComment(args.cardId, args.actionId)
    clearClients()

    this.logJson(result)
  }
}
