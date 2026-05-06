import {input} from '@inquirer/prompts'
import {Command, Flags} from '@oclif/core'
import {action} from '@oclif/core/ux'
import {default as fs} from 'fs-extra'
import {default as path} from 'node:path'

import {ApiResult} from '../../../trello/trello-api.js'
import {clearClients, testConnection} from '../../../trello/trello-client.js'

export default class AuthAdd extends Command {
  static override args = {}
  static override description = 'Add Trello authentication'
  static override enableJsonFlag = true
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    key: Flags.string({char: 'k', description: 'Trello API key', required: !process.stdout.isTTY}),
    profile: Flags.string({char: 'p', default: 'default', description: 'Profile name', required: false}),
    token: Flags.string({char: 't', description: 'Trello API token', required: !process.stdout.isTTY}),
  }

  public async run(): Promise<ApiResult> {
    const {flags} = await this.parse(AuthAdd)
    const profileName = flags.profile

    const apiKey = flags.key ?? (await input({message: 'Trello API key:', required: true}))
    const apiToken = flags.token ?? (await input({message: 'Trello API token:', required: true}))
    const configPath = path.join(this.config.configDir, 'trello-config.json')

    // Read existing config to preserve other profiles
    let existingProfiles: Record<string, unknown> = {}
    try {
      const raw = await fs.readJSON(configPath)
      if (raw.profiles) {
        existingProfiles = raw.profiles as Record<string, unknown>
      } else if (raw.auth) {
        existingProfiles = {default: raw.auth}
      }
    } catch {
      // File doesn't exist or is invalid — start fresh
    }

    const profileData = {
      apiKey,
      apiToken,
    }
    const config = {profiles: {...existingProfiles, [profileName]: profileData}}

    const exists = await fs.pathExists(configPath)
    if (!exists) {
      await fs.createFile(configPath)
    }

    await fs.writeJSON(configPath, config, {
      mode: 0o600,
    })

    action.start('Authenticating')
    const result = await testConnection(profileData)
    clearClients()

    if (result.success) {
      action.stop('✓ successful')
      this.log(`Authentication added successfully${profileName !== 'default' ? ` (profile: ${profileName})` : ''}`)
    } else {
      action.stop('✗ failed')
      this.error('Authentication is invalid. Please check your API key and token.')
    }

    return result
  }
}
