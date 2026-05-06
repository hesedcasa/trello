import {confirm, input} from '@inquirer/prompts'
import {Command, Flags} from '@oclif/core'
import {action} from '@oclif/core/ux'
import {default as fs} from 'fs-extra'
import {default as path} from 'node:path'

import {ApiResult} from '../../../trello/trello-api.js'
import {clearClients, testConnection} from '../../../trello/trello-client.js'

export default class AuthUpdate extends Command {
  static override args = {}
  static override description = 'Update existing authentication'
  static override enableJsonFlag = true
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    key: Flags.string({char: 'k', description: 'Trello API key', required: !process.stdout.isTTY}),
    profile: Flags.string({char: 'p', default: 'default', description: 'Profile name', required: false}),
    token: Flags.string({char: 't', description: 'Trello API token', required: !process.stdout.isTTY}),
  }

  public async run(): Promise<ApiResult | void> {
    const {flags} = await this.parse(AuthUpdate)
    const profileName = flags.profile
    const configPath = path.join(this.config.configDir, 'trello-config.json')

    let raw: Record<string, unknown>
    try {
      raw = await fs.readJSON(configPath)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      if (msg.toLowerCase().includes('no such file or directory')) {
        this.log('Run auth:add instead')
      } else {
        this.log(msg)
      }

      return
    }

    let currentProfile: Record<string, unknown> | undefined
    let existingProfiles: Record<string, unknown> = {}

    if (raw.profiles) {
      existingProfiles = raw.profiles as Record<string, unknown>
      currentProfile = existingProfiles[profileName] as Record<string, unknown> | undefined
    } else if (raw.auth && profileName === 'default') {
      currentProfile = raw.auth as Record<string, unknown>
    }

    if (!currentProfile) {
      this.log(`Profile '${profileName}' not found. Run auth:add instead`)
      return
    }

    const apiKey =
      flags.key ??
      (await input({default: currentProfile.apiKey as string, message: 'Trello API key:', prefill: 'tab', required: true}))
    const apiToken =
      flags.token ??
      (await input({default: currentProfile.apiToken as string, message: 'Trello API token:', prefill: 'tab', required: true}))
    const answer = await confirm({message: 'Override existing config?'})

    if (!answer) {
      return
    }

    const profileData = {
      apiKey,
      apiToken,
    }
    const config = {profiles: {...existingProfiles, [profileName]: profileData}}

    await fs.writeJSON(configPath, config, {
      mode: 0o600,
    })

    action.start('Authenticating')
    const result = await testConnection(profileData)
    clearClients()

    if (result.success) {
      action.stop('✓ successful')
      this.log('Authentication updated successfully')
    } else {
      action.stop('✗ failed')
      this.error('Authentication is invalid. Please check your API key and token.')
    }

    return result
  }
}
