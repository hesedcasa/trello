import {Args, Command, Flags} from '@oclif/core'
import {createProfileManager, formatAsToon} from '@hesed/plugin-lib'

import {type Config} from '../../../trello/trello-api.js'
import {clearClients, getClient} from '../../../trello/trello-client.js'

export default class CommentUpdate extends Command {
  /* eslint-disable perfectionist/sort-objects */
  static override args = {
    cardId: Args.string({description: 'Card ID', required: true}),
    actionId: Args.string({description: 'Comment action ID', required: true}),
    text: Args.string({description: 'Updated comment text', required: true}),
  }
  /* eslint-enable perfectionist/sort-objects */
  static override description = 'Update a comment on a card'
  static override examples = [
    '<%= config.bin %> <%= command.id %> cardId123 actionId456 "Updated comment"',
    '<%= config.bin %> <%= command.id %> cardId123 actionId456 "**Bold** _italic_ ~~strikethrough~~"',
    '<%= config.bin %> <%= command.id %> cardId123 actionId456 "- Item 1\n- Item 2\n- Item 3"',
    '<%= config.bin %> <%= command.id %> cardId123 actionId456 "Check [this](https://example.com) link"',
  ]
  static override flags = {
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(CommentUpdate)
    const pm = createProfileManager<Config>(this.config)
    const auth = pm.loadAuthConfig()
    if (!auth) { this.error('Not authenticated. Run trello auth add first.'); return }

    const result = await getClient(auth).updateCardComment(args.cardId, args.actionId, args.text)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
