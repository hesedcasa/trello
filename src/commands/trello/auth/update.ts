import {createAuthUpdateCommand, type FieldDef} from '@hesed/plugin-lib'
import {clearClients} from '../../../trello/trello-client.js'
import {TrelloApi} from '../../../trello/trello-api.js'

const fields: FieldDef[] = [
  {char: 'k', description: 'API key', masked: true, message: 'API key:', name: 'apiKey'},
  {char: 't', description: 'API token', masked: true, message: 'API token:', name: 'apiToken'},
]

export default createAuthUpdateCommand({
  clearClients,
  fields,
  hasHostFlag: false,
  serviceName: 'Trello',
  testConnection: async (auth) => {
    try {
      const api = new TrelloApi(auth)
      return api.testConnection()
    } catch (error) {
      return {error, success: false}
    }
  },
})
