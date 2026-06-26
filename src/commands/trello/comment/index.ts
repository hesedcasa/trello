import {type ApiResult, createProfileManager, formatAsToon} from '@hesed/plugin-lib'
import {Args, Flags} from '@oclif/core'

import {BaseCommand} from '../../../base-command.js'
import {type Config} from '../../../trello/trello-api.js'
import {addCardComment, clearClients} from '../../../trello/trello-client.js'

export default class CommentAdd extends BaseCommand {
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
    profile: Flags.string({char: 'p', description: 'Authentication profile name', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<ApiResult> {
    const {args, flags} = await this.parse(CommentAdd)
    const pm = createProfileManager<Config>(this.config, flags.profile, 'trello-config.json')
    const auth = await pm.loadAuthConfig()
    if (!auth) {
      this.error(`Missing authentication config.`)
    }

    const result = await addCardComment(auth, args.cardId, args.text)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    }

    return result
  }
}
