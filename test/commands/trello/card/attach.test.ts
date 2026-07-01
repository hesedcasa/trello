/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('card:attach', () => {
  let CardAttach: any
  let mockCreateProfileManager: any
  let mockAddCardAttachment: any
  let mockClearClients: any

  beforeEach(async () => {
    mockCreateProfileManager = () => ({
      loadAuthConfig: async () => ({apiKey: 'test-key', apiToken: 'test-token'}),
    })

    mockAddCardAttachment = async () => ({
      data: {id: 'attach1', name: 'report.pdf'},
      success: true,
    })

    mockClearClients = () => {}

    CardAttach = await esmock('../../../../src/commands/trello/card/attach.js', {
      '../../../../src/trello/trello-client.js': {
        addCardAttachment: mockAddCardAttachment,
        clearClients: mockClearClients,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })
  })

  it('uploads a file attachment with required args', async () => {
    const command = new CardAttach.default(['card123', './report.pdf'], createMockConfig())
    const result = await command.run()

    expect(result).to.not.be.null
    expect(result.success).to.be.true
    expect(result.data).to.have.property('id', 'attach1')
  })

  it('forwards the card id and file path', async () => {
    let captured: any[] = []

    CardAttach = await esmock('../../../../src/commands/trello/card/attach.js', {
      '../../../../src/trello/trello-client.js': {
        async addCardAttachment(...args: any[]) {
          captured = args
          return {data: {}, success: true}
        },
        clearClients: mockClearClients,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new CardAttach.default(['card123', './report.pdf'], createMockConfig())
    await command.run()

    // (config, cardId, filePath)
    expect(captured[1]).to.equal('card123')
    expect(captured[2]).to.equal('./report.pdf')
  })

  it('posts a comment linking the attachment when --comment is set', async () => {
    let commentArgs: any[] = []

    CardAttach = await esmock('../../../../src/commands/trello/card/attach.js', {
      '../../../../src/trello/trello-client.js': {
        addCardAttachment: async () => ({
          data: {id: 'attach1', name: 'report.pdf', url: 'https://trello.com/attach/report.pdf'},
          success: true,
        }),
        async addCardComment(...args: any[]) {
          commentArgs = args
          return {data: {id: 'comment1'}, success: true}
        },
        clearClients: mockClearClients,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new CardAttach.default(
      ['card123', './report.pdf', '--comment', 'Latest report'],
      createMockConfig(),
    )
    const result = await command.run()

    // (config, cardId, text)
    expect(commentArgs[1]).to.equal('card123')
    expect(commentArgs[2]).to.equal('Latest report\n\n[report.pdf](https://trello.com/attach/report.pdf)')
    expect(result.success).to.be.true
    expect(result.data.attachments[0]).to.have.property('id', 'attach1')
    expect(result.data).to.have.nested.property('comment.id', 'comment1')
  })

  it('uploads multiple files and links them all in one comment', async () => {
    const uploaded: string[] = []
    let commentText = ''

    CardAttach = await esmock('../../../../src/commands/trello/card/attach.js', {
      '../../../../src/trello/trello-client.js': {
        async addCardAttachment(_config: any, _cardId: string, filePath: string) {
          uploaded.push(filePath)
          const name = filePath.split('/').pop()
          return {data: {id: `id-${name}`, name, url: `https://trello.com/a/${name}`}, success: true}
        },
        async addCardComment(_config: any, _cardId: string, text: string) {
          commentText = text
          return {data: {id: 'comment1'}, success: true}
        },
        clearClients: mockClearClients,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new CardAttach.default(
      ['card123', './a.pdf', './b.png', '--comment', 'Batch upload'],
      createMockConfig(),
    )
    const result = await command.run()

    expect(uploaded).to.deep.equal(['./a.pdf', './b.png'])
    expect(result.success).to.be.true
    expect(result.data.attachments).to.have.lengthOf(2)
    expect(commentText).to.equal(
      'Batch upload\n\n[a.pdf](https://trello.com/a/a.pdf)\n[b.png](https://trello.com/a/b.png)',
    )
  })

  it('returns an attachments array (no comment) for multiple files', async () => {
    CardAttach = await esmock('../../../../src/commands/trello/card/attach.js', {
      '../../../../src/trello/trello-client.js': {
        async addCardAttachment(_config: any, _cardId: string, filePath: string) {
          const name = filePath.split('/').pop()
          return {data: {id: `id-${name}`, name}, success: true}
        },
        addCardComment: async () => ({data: {}, success: true}),
        clearClients: mockClearClients,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new CardAttach.default(['card123', './a.pdf', './b.png'], createMockConfig())
    const result = await command.run()

    expect(result.success).to.be.true
    expect(result.data.attachments).to.have.lengthOf(2)
    expect(result.data).to.not.have.property('comment')
  })

  it('does not post a comment when the attachment upload fails', async () => {
    let commentCalled = false

    CardAttach = await esmock('../../../../src/commands/trello/card/attach.js', {
      '../../../../src/trello/trello-client.js': {
        addCardAttachment: async () => ({error: 'upload failed', success: false}),
        async addCardComment() {
          commentCalled = true
          return {data: {}, success: true}
        },
        clearClients: mockClearClients,
      },
      '@hesed/plugin-lib': {
        createProfileManager: mockCreateProfileManager,
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new CardAttach.default(['card123', './report.pdf', '--comment', 'hi'], createMockConfig())
    const result = await command.run()

    expect(commentCalled).to.be.false
    expect(result.success).to.be.false
  })

  it('exits early when config is not available', async () => {
    CardAttach = await esmock('../../../../src/commands/trello/card/attach.js', {
      '../../../../src/trello/trello-client.js': {
        addCardAttachment: mockAddCardAttachment,
        clearClients: mockClearClients,
      },
      '@hesed/plugin-lib': {
        createProfileManager: () => ({loadAuthConfig: async () => null}),
        formatAsToon: (d: any) => JSON.stringify(d),
      },
    })

    const command = new CardAttach.default(['card123', './report.pdf'], createMockConfig())
    let error: unknown

    try {
      await command.run()
    } catch (error_) {
      error = error_
    }

    expect(error).to.exist
  })
})
