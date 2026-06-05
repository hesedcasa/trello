import {createProfileManager, formatAsToon} from '@hesed/plugin-lib'
import {Args, Command, Flags} from '@oclif/core'

import {type Config} from '../../../trello/trello-api.js'
import {clearClients, updateCard} from '../../../trello/trello-client.js'

export default class CardUpdate extends Command {
  static override args = {
    cardId: Args.string({description: 'Card ID', required: true}),
  }
  static override description = 'Update an existing card'
  static override examples = [
    '<%= config.bin %> <%= command.id %> 5a1b2c3d --fields name="Updated name" desc="New description"',
  ]
  static override flags = {
    fields: Flags.string({description: 'Card fields to update in key=value format', multiple: true, required: true}),
    profile: Flags.string({char: 'p', description: 'Authentication profile name', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(CardUpdate)
    const pm = createProfileManager<Config>(this.config, flags.profile)
    const auth = await pm.loadAuthConfig()
    if (!auth) {
      this.error(`Missing authentication config.`)
    }

    const fields: Record<string, string> = {}
    if (flags.fields) {
      for (const field of flags.fields) {
        const [key, ...valueParts] = field.split('=')
        const value = valueParts.join('=')
        fields[key] = value
      }
    }

    const result = await updateCard(auth, args.cardId, fields)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
