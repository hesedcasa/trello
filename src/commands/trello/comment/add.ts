import {Args, Command, Flags} from '@oclif/core'
import {createProfileManager, formatAsToon} from '@hesed/plugin-lib'

import {type Config} from '../../../trello/trello-api.js'
import {clearClients, getClient} from '../../../trello/trello-client.js'

export default class CommentAdd extends Command {
  static override args = {
    cardId: Args.string({description: 'Card ID', required: true}),
    text: Args.string({description: 'Comment text', required: true}),
  }
  static override description = 'Add a comment to a card'
  static override examples = [
    '<%= config.bin %> <%= command.id %> cardId123 "This is a comment"',
    '<%= config.bin %> <%= command.id %> cardId123 "**Bold** _italic_ ~~strikethrough~~"',
    '<%= config.bin %> <%= command.id %> cardId123 "- Item 1\n- Item 2\n- Item 3"',
    '<%= config.bin %> <%= command.id %> cardId123 "Check [this](https://example.com) link"',
  ]
  static override flags = {
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(CommentAdd)
    const pm = createProfileManager<Config>(this.config)
    const auth = pm.loadAuthConfig()
    if (!auth) { this.error('Not authenticated. Run trello auth add first.'); return }

    const result = await getClient(auth).addCardComment(args.cardId, args.text)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
