import {createApiClient} from '@hesed/plugin-lib'
import {type Config, TrelloApi} from './trello-api.js'

const {clearClients, getClient} = createApiClient<Config, TrelloApi>('Trello', (config: Config) => new TrelloApi(config))

export {clearClients, getClient}
