import {type ApiResult} from '@hesed/plugin-lib'
import {readFile} from 'node:fs/promises'
import {basename} from 'node:path'
import {TrelloClient} from 'trello.js'

import {buildProxyRequestConfig, type ResolvedProxy, resolveProxy} from '../proxy.js'

/** trello.js pins its axios baseURL to this host, so proxy resolution is keyed off it. */
const TRELLO_API_HOST = 'https://api.trello.com'

export interface Config {
  apiKey: string
  apiToken: string
}

/** Transport-level failures, which name the proxy's own host:port rather than Trello's. */
const CONNECT_FAILURE_CODES =
  /ECONNREFUSED|ECONNRESET|ETIMEDOUT|EHOSTUNREACH|ENETUNREACH|ENOTFOUND|EPROTO|ERR_TLS|certificate|socket disconnected|tunneling socket|socket hang up/i

/** Statuses a proxy commonly answers CONNECT with, replayed onto the request by https-proxy-agent. */
const PROXY_REJECTION_STATUSES = new Set([400, 403, 407, 502, 503])

export class TrelloApi {
  private client?: TrelloClient
  private config: Config
  private proxy?: ResolvedProxy

  constructor(config: Config) {
    this.config = config
  }

  // ── Actions (comments) ────────────────────────────────────────────

  async addCardAttachment(cardId: string, filePath: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      const file = await readFile(filePath)
      const response = await client.cards.createCardAttachment({
        file,
        id: cardId,
        name: basename(filePath),
      })
      return {data: response, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  async addCardComment(cardId: string, text: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      const response = await client.cards.addCardComment({id: cardId, text})
      return {data: response, success: true}
    } catch (error: unknown) {
      return this.handleError(error)
    }
  }

  async archiveAllCardsInList(listId: string): Promise<ApiResult> {
    try {
      const client = this.getClient()
      await client.lists.archiveAllCardsInList({id: listId})
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
    this.proxy = undefined
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
        pos: pos as 'bottom' | 'top' | undefined,
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
      const response = await client.checklists.createChecklistCheckItems({id: checklistId, name})
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
        pos: pos as 'bottom' | 'top' | undefined,
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
      await client.checklists.deleteChecklistCheckItem({id: checklistId, idCheckItem: checkItemId})
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
        ? await client.boards.getBoardCardsFilter({filter, id: boardId})
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

    const baseRequestConfig = buildProxyRequestConfig(TRELLO_API_HOST)
    this.proxy = resolveProxy(TRELLO_API_HOST)

    this.client = new TrelloClient({
      ...(baseRequestConfig && {baseRequestConfig}),
      key: this.config.apiKey,
      token: this.config.apiToken,
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
        filter: filter as 'all' | 'closed' | 'members' | 'open' | 'organization' | 'public' | 'starred',
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
      const response = await client.search.getSearch({
        idBoards: boardIds ? boardIds.split(',') : undefined,
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
   * Attributes a failure to the proxy when one is in use, because neither shape of proxy
   * failure looks like one:
   *
   * - An unreachable proxy reports the *proxy's* host and port, so a proxy URL without an
   *   explicit port fails as `connect ECONNREFUSED <host>:443` — indistinguishable from
   *   Trello itself being unreachable on 443.
   * - https-proxy-agent replays a non-200 CONNECT response onto a fake socket, so a proxy
   *   that refuses the tunnel arrives as an ordinary HTTP status from api.trello.com, i.e.
   *   a policy denial reads as Trello rejecting the credentials.
   */
  private annotateProxyFailure(message: string, error: unknown): string {
    const {proxy} = this
    if (!proxy) return message

    const via = `proxy ${proxy.url} (from ${proxy.source})`
    const status = (error as {response?: {status?: number}})?.response?.status

    if (CONNECT_FAILURE_CODES.test(message)) {
      const portHint = proxy.portWasImplicit
        ? ` The proxy URL specifies no port, so port ${proxy.port} was assumed — set the port explicitly if that is wrong.`
        : ''
      return `Could not reach Trello through ${via}: ${message}.${portHint}`
    }

    if (status !== undefined && PROXY_REJECTION_STATUSES.has(status)) {
      return `${message} — the request went through ${via}, which may have refused the CONNECT tunnel rather than Trello rejecting the request.`
    }

    return message
  }

  private handleError(error: unknown): ApiResult {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {error: this.annotateProxyFailure(errorMessage, error), success: false}
  }

}
