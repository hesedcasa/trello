import {createProfileManager, formatAsToon} from '@hesed/plugin-lib'
import {Args, Command, Flags} from '@oclif/core'

import {type Config} from '../../../trello/trello-api.js'
import {clearClients, createLabel} from '../../../trello/trello-client.js'

export default class LabelCreate extends Command {
  /* eslint-disable perfectionist/sort-objects */
  static override args = {
    boardId: Args.string({description: 'Board ID', required: true}),
    name: Args.string({description: 'Label name', required: true}),
    color: Args.string({
      description: 'Label color',
      options: ['blue', 'green', 'orange', 'red', 'yellow', 'purple', 'pink', 'sky', 'lime', 'black'],
      required: true,
    }),
  }
  /* eslint-enable perfectionist/sort-objects */
  static override description = 'Create a new label on a board'
  static override examples = ['<%= config.bin %> <%= command.id %> 5a1b2c3d "Bug" red']
  static override flags = {
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(LabelCreate)
    const pm = createProfileManager<Config>(this.config)
    const auth = await pm.loadAuthConfig()
    if (!auth) {
      this.error(`Missing authentication config.`)
    }

    const result = await createLabel(auth, args.boardId, args.name, args.color)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
