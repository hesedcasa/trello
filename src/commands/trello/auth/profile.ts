import {createAuthProfileCommand} from '@hesed/plugin-lib'
import {clearClients} from '../../../trello/trello-client.js'
import {TrelloApi} from '../../../trello/trello-api.js'

export default createAuthProfileCommand({
  clearClients,
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
