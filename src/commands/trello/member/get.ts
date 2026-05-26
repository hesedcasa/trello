import {Args, Command, Flags} from '@oclif/core'
import {createProfileManager, formatAsToon} from '@hesed/plugin-lib'

import {type Config} from '../../../trello/trello-api.js'
import {clearClients, getClient} from '../../../trello/trello-client.js'

export default class MemberGet extends Command {
  static override args = {
    memberId: Args.string({default: 'me', description: 'Member ID or username (defaults to "me")', required: false}),
  }
  static override description = 'Get member details'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> me',
    '<%= config.bin %> <%= command.id %> johndoe',
  ]
  static override flags = {
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(MemberGet)
    const pm = createProfileManager<Config>(this.config)
    const auth = pm.loadAuthConfig()
    if (!auth) { this.error('Not authenticated. Run trello auth add first.'); return }

    const result = await getClient(auth).getMember(args.memberId)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
