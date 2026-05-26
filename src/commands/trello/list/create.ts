import {Args, Command, Flags} from '@oclif/core'
import {createProfileManager, formatAsToon} from '@hesed/plugin-lib'

import {type Config} from '../../../trello/trello-api.js'
import {clearClients, getClient} from '../../../trello/trello-client.js'

export default class ListCreate extends Command {
  static override args = {
    boardId: Args.string({description: 'Board ID', required: true}),
    name: Args.string({description: 'List name', required: true}),
  }
  static override description = 'Create a new list on a board'
  static override examples = [
    '<%= config.bin %> <%= command.id %> 5a1b2c3d "To Do"',
    '<%= config.bin %> <%= command.id %> 5a1b2c3d "Done" --pos bottom',
  ]
  static override flags = {
    pos: Flags.string({description: 'Position of the list (top, bottom)', options: ['top', 'bottom'], required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(ListCreate)
    const pm = createProfileManager<Config>(this.config)
    const auth = pm.loadAuthConfig()
    if (!auth) { this.error('Not authenticated. Run trello auth add first.'); return }

    const result = await getClient(auth).createList(args.boardId, args.name, flags.pos)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
