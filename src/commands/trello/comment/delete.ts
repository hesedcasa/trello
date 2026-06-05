import {createProfileManager} from '@hesed/plugin-lib'
import {Args, Command, Flags} from '@oclif/core'

import {type Config} from '../../../trello/trello-api.js'
import {clearClients, deleteCardComment} from '../../../trello/trello-client.js'

export default class CommentDelete extends Command {
  /* eslint-disable perfectionist/sort-objects */
  static override args = {
    cardId: Args.string({description: 'Card ID', required: true}),
    actionId: Args.string({description: 'Comment action ID', required: true}),
  }
  /* eslint-enable perfectionist/sort-objects */
  static override description = 'Delete a comment from a card'
  static override examples = ['<%= config.bin %> <%= command.id %> cardId123 actionId456']
  static override flags = {
    profile: Flags.string({char: 'p', description: 'Authentication profile name', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(CommentDelete)
    const pm = createProfileManager<Config>(this.config, flags.profile)
    const auth = await pm.loadAuthConfig()
    if (!auth) {
      this.error(`Missing authentication config.`)
    }

    const result = await deleteCardComment(auth, args.cardId, args.actionId)
    clearClients()

    this.logJson(result)
  }
}
