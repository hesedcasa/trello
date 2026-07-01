import {type ApiResult, createProfileManager, formatAsToon} from '@hesed/plugin-lib'
import {Args, Flags} from '@oclif/core'

import {BaseCommand} from '../../../base-command.js'
import {type Config} from '../../../trello/trello-api.js'
import {addCardAttachment, addCardComment, clearClients} from '../../../trello/trello-client.js'

type AttachmentData = undefined | {name?: string; url?: string}

export default class CardAttach extends BaseCommand {
  static override args = {
    cardId: Args.string({description: 'Card ID', required: true}),
    file: Args.string({
      description: 'File path to upload (pass more paths for multiple files)',
      multiple: true,
      required: true,
    }),
  }
  static override description = 'Upload one or more file attachments to a card'
  static override examples = [
    '<%= config.bin %> <%= command.id %> 5a1b2c3d ./report.pdf',
    '<%= config.bin %> <%= command.id %> 5a1b2c3d ./one.pdf ./two.png ./three.log',
    '<%= config.bin %> <%= command.id %> 5a1b2c3d ./report.pdf --comment "Latest report attached"',
  ]
  static override flags = {
    comment: Flags.string({
      description: 'Post a single comment on the card linking the uploaded attachment(s)',
      required: false,
    }),
    profile: Flags.string({char: 'p', description: 'Authentication profile name', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<ApiResult> {
    const {args, flags} = await this.parse(CardAttach)
    const pm = createProfileManager<Config>(this.config, flags.profile, 'trello-config.json')
    const auth = await pm.loadAuthConfig()
    if (!auth) {
      this.error(`Missing authentication config.`)
    }

    // `multiple: true` collects every file path after the card id into an array.
    const files = args.file as unknown as string[]

    const attachments = await Promise.all(files.map((file) => addCardAttachment(auth, args.cardId, file)))
    const allSucceeded = attachments.every((a) => a.success)

    let result: ApiResult
    if (flags.comment && allSucceeded) {
      const links = attachments
        .map((a) => a.data as AttachmentData)
        .filter((d): d is {name?: string; url?: string} => Boolean(d?.url))
        .map((d) => `[${d.name ?? 'attachment'}](${d.url})`)
      const text = [flags.comment, links.join('\n')].filter(Boolean).join('\n\n')
      const comment = await addCardComment(auth, args.cardId, text)
      result = {data: {attachments: attachments.map((a) => a.data), comment: comment.data}, success: comment.success}
    } else if (files.length === 1) {
      // Preserve the plain single-attachment shape for the common case.
      result = attachments[0]
    } else {
      result = {data: {attachments: attachments.map((a) => a.data)}, success: allSucceeded}
    }

    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    }

    return result
  }
}
