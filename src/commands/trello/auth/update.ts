import {createAuthUpdateCommand, type FieldDef} from '@hesed/plugin-lib'

import {clearClients, testConnection} from '../../../trello/trello-client.js'

const fields: FieldDef[] = [
  {char: 'k', description: 'API key', name: 'apiKey', type: 'string'},
  {char: 't', description: 'API token', name: 'apiToken', type: 'string'},
]

export default createAuthUpdateCommand({
  clearClients,
  fields,
  serviceName: 'Trello',
  testConnection,
})
