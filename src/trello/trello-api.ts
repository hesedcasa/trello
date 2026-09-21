import {type ApiResult} from '@hesed/plugin-lib'
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {createTrelloClient, type TrelloClient} from 'trello.js'
import {type Dispatcher, getGlobalDispatcher, type ProxyAgent, setGlobalDispatcher} from 'undici'

import {buildProxyDispatcher} from '../proxy.js'

/** trello.js prefixes every path with `${host}/1`, so proxy resolution is keyed off the bare origin. */
const TRELLO_API_HOST = 'https://api.trello.com'

/** How many links of an error's `cause` chain `handleError` appends before it stops. */
const MAX_ERROR_CAUSE_DEPTH = 3

/**
 * Every proxy agent this module has installed, with the dispatcher that was global just
 * before the install. Clearing an agent undoes to exactly what its own installation
 * displaced — the pre-proxy dispatcher, a still-active proxy of another instance, or a
 * dispatcher something else installed in between — so no instance can clobber a global
 * it did not displace. Agents installed over a since-cleared agent inherit its target.
 */
const installedProxyDispatchers: {agent: ProxyAgent; target: Dispatcher}[] = []

export type Config = {
  apiKey: string
  apiToken: string
}

export class TrelloApi {
  private client?: TrelloClient
  private readonly config: Config
  private dispatcher?: ProxyAgent

  constructor(config: Config) {
    this.config = config
  }

  // ── Actions (comments) ────────────────────────────────────────────

  async addCardAttachment(cardId: string, filePath: string): Promise<ApiResult> {
    try {
      // trello.js v2 sends `file` as a query parameter, so its createCardAttachment can
      // only attach a url — uploading local bytes means posting the multipart body here.
      this.ensureProxyDispatcher()
      const bytes = await readFile(filePath)
      const name = path.basename(filePath)

      const form = new FormData()
      form.append('file', new File([bytes], name))
      form.append('name', name)

      const url = new URL(`/1/cards/${cardId}/attachments`, TRELLO_API_HOST)
      url.searchParams.set('key', this.config.apiKey)
      url.searchParams.set('token', this.config.apiToken)

      const response = await fetch(url, {body: form, method: 'POST'})
      if (!response.ok) {
        // Same wording trello.js v2 uses, so callers see one error shape for every endpoint.
        const text = await response.text()
        throw new Error(`Request failed: ${response.status} ${response.statusText}${text ? ` - ${text}` : ''}`)
      }

      return {data: await response.json(), success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  async addCardComment(cardId: string, text: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      const response = await client.cards.createCardComment({id: cardId, text})
      return {data: response, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  async archiveAllCardsInList(listId: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      await client.lists.archiveAllListCards({id: listId})
      return {data: true, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  async archiveList(listId: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      const response = await client.lists.updateList({closed: true, id: listId})
      return {data: response, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  // ── Boards ────────────────────────────────────────────────────────

  clearClients(): void {
    this.client = undefined

    const {dispatcher} = this
    if (!dispatcher) return
    this.dispatcher = undefined

    const index = installedProxyDispatchers.findIndex(installed => installed.agent === dispatcher)
    if (index !== -1) {
      const [installed] = installedProxyDispatchers.splice(index, 1)
      // The global is this agent's to undo only while nothing has replaced it since the
      // install — otherwise it belongs to a newer proxy or to something external.
      if (getGlobalDispatcher() === dispatcher) setGlobalDispatcher(installed.target)
      for (const other of installedProxyDispatchers) {
        if (other.target === dispatcher) other.target = installed.target
      }
    }

    // The proxy agent keeps its tunnelled sockets alive, which would hold the CLI open.
    // Nothing is left to report a close failure to, so it is swallowed.
    void dispatcher.close().catch(() => undefined)
  }

  async createBoard(name: string, desc?: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      const response = await client.boards.createBoard({desc, name})
      return {data: response, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  async createCard(idList: string, name: string, desc?: string, pos?: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      const response = await client.cards.createCard({
        desc,
        idList,
        name,
        pos,
      })
      return {data: response, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  async createChecklist(cardId: string, name: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      const response = await client.checklists.createChecklist({idCard: cardId, name})
      return {data: response, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  async createChecklistItem(checklistId: string, name: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      const response = await client.checklists.createChecklistItem({id: checklistId, name})
      return {data: response, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  async createLabel(boardId: string, name: string, color: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      const response = await client.labels.createLabel({color, idBoard: boardId, name})
      return {data: response, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  async createList(boardId: string, name: string, pos?: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      const response = await client.lists.createList({
        idBoard: boardId,
        name,
        pos,
      })
      return {data: response, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  // ── Cards ─────────────────────────────────────────────────────────

  async deleteBoard(boardId: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      await client.boards.updateBoard({closed: true, id: boardId})
      return {data: true, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  async deleteCard(cardId: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      await client.cards.deleteCard({id: cardId})
      return {data: true, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  async deleteCardComment(cardId: string, actionId: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      await client.cards.deleteCardComment({id: cardId, idAction: actionId})
      return {data: true, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  async deleteChecklist(checklistId: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      await client.checklists.deleteChecklist({id: checklistId})
      return {data: true, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  async deleteChecklistItem(checklistId: string, checkItemId: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      await client.checklists.deleteChecklistItem({id: checklistId, idCheckItem: checkItemId})
      return {data: true, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  async deleteLabel(labelId: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      await client.labels.deleteLabel({id: labelId})
      return {data: true, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  async getBoard(boardId: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      const response = await client.boards.getBoard({id: boardId})
      return {data: response, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  async getBoardCards(boardId: string, filter?: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      const response = filter
        ? await client.boards.getBoardCardsByFilter({filter, id: boardId})
        : await client.boards.getBoardCards({id: boardId})
      return {data: response, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  async getBoardLabels(boardId: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      const response = await client.boards.getBoardLabels({id: boardId})
      return {data: response, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  async getBoardLists(boardId: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      const response = await client.boards.getBoardLists({id: boardId})
      return {data: response, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  async getBoardMembers(boardId: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      const response = await client.boards.getBoardMembers({id: boardId})
      return {data: response, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  // ── Checklists ────────────────────────────────────────────────────

  async getCard(cardId: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      const response = await client.cards.getCard({id: cardId})
      return {data: response, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  async getCardActions(cardId: string, filter?: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      const response = await client.cards.getCardActions({filter, id: cardId})
      return {data: response, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  async getChecklist(checklistId: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      const response = await client.checklists.getChecklist({id: checklistId})
      return {data: response, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  // ── Client ────────────────────────────────────────────────────────

  getClient(): TrelloClient {
    if (this.client) {
      return this.client
    }

    this.ensureProxyDispatcher()

    this.client = createTrelloClient({
      apiKey: this.config.apiKey,
      apiToken: this.config.apiToken,
      // This CLI prints whatever Trello returns. Zod validation would strip every key the
      // generated schemas do not name and turn any drift between spec and API into a
      // ZodError, so responses are passed through unparsed instead.
      skipParsing: true,
    })

    return this.client
  }

  async getLabel(labelId: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      const response = await client.labels.getLabel({id: labelId})
      return {data: response, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  // ── Labels ────────────────────────────────────────────────────────

  async getList(listId: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      const response = await client.lists.getList({id: listId})
      return {data: response, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  async getListCards(listId: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      const response = await client.lists.getListCards({id: listId})
      return {data: response, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  async getMember(memberId: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      const response = await client.members.getMember({id: memberId})
      return {data: response, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  // ── Lists ─────────────────────────────────────────────────────────

  async getMyBoards(filter = 'open'): Promise<ApiResult> {
    try {
      const client = this.getClient()
      const me = await client.members.getMember({id: 'me'})
      const response = await client.members.getMemberBoards({
        fields: ['name', 'desc', 'url', 'shortLink', 'dateLastActivity'],
        filter,
        id: me.id ?? 'me',
      })
      return {data: response, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  async moveCard(cardId: string, idList: string, idBoard?: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      const response = await client.cards.updateCard({
        id: cardId,
        idBoard,
        idList,
      })
      return {data: response, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  async searchCards(query: string, boardIds?: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      const response = await client.search.search({
        idBoards: boardIds,
        modelTypes: 'cards',
        query,
      })
      return {data: response, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  async testConnection(): Promise<ApiResult> {
    try {
      const client = this.getClient()
      const me = await client.members.getMember({id: 'me'})
      return {data: me, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  async updateCard(cardId: string, fields: Record<string, unknown>): Promise<ApiResult> {
    try {
      const client = this.getClient()
      const response = await client.cards.updateCard({
        id: cardId,
        ...fields,
      })
      return {data: response, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  // ── Members ───────────────────────────────────────────────────────

  async updateCardComment(cardId: string, actionId: string, text: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      const response = await client.cards.updateCardComment({id: cardId, idAction: actionId, text})
      return {data: response, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  // ── Private helpers ───────────────────────────────────────────────

  /**
   * Installs the proxy dispatcher for Node's global fetch, which trello.js v2 and the
   * attachment upload both go through. Undici resolves no proxy of its own, so without
   * this every request would bypass HTTP(S)_PROXY.
   */
  private ensureProxyDispatcher(): void {
    if (this.dispatcher) return

    const dispatcher = buildProxyDispatcher(TRELLO_API_HOST)
    if (!dispatcher) return

    installedProxyDispatchers.push({agent: dispatcher, target: getGlobalDispatcher()})
    this.dispatcher = dispatcher
    setGlobalDispatcher(dispatcher)
  }

  /**
   * Flattens an error into the single string `ApiResult` carries.
   *
   * undici reports every transport failure — DNS, TLS, a proxy refusing CONNECT — as a
   * bare `fetch failed` and hangs the real reason off `cause`, where axios used to state
   * it inline. Appending the chain keeps those diagnosable. HTTP failures are unaffected:
   * trello.js already spells the status out in the message.
   *
   * Protected rather than private so the error shape can be asserted directly in tests.
   */
  protected handleError(error: unknown): ApiResult {
    if (!(error instanceof Error)) {
      return {error: String(error), success: false}
    }

    const messages = [error.message]
    let {cause} = error
    for (let depth = 0; depth < MAX_ERROR_CAUSE_DEPTH && cause instanceof Error; depth++) {
      if (cause.message && !messages.includes(cause.message)) messages.push(cause.message)
      ;({cause} = cause)
    }

    return {error: messages.join(': '), success: false}
  }
}
