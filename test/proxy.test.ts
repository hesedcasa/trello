import {expect} from 'chai'

import {buildProxyDispatcher} from '../src/proxy.js'

describe('buildProxyDispatcher', () => {
  const originalEnv = {...process.env}

  // proxy-from-env consults each of these (preferring the lowercase form), so any
  // left set by the surrounding environment would leak into the assertions below.
  const proxyEnvKeys = [
    'ALL_PROXY',
    'HTTPS_PROXY',
    'HTTP_PROXY',
    'NO_PROXY',
    'npm_config_no_proxy',
    'npm_config_proxy',
    'npm_config_http_proxy',
    'npm_config_https_proxy',
  ]

  beforeEach(() => {
    for (const key of proxyEnvKeys) {
      delete process.env[key]
      delete process.env[key.toLowerCase()]
    }
  })

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) delete process.env[key]
    }

    Object.assign(process.env, originalEnv)
  })

  it('returns undefined when no proxy env var is set', () => {
    expect(buildProxyDispatcher('https://api.trello.com')).to.equal(undefined)
  })

  it('returns a ProxyAgent when HTTPS_PROXY is set', async () => {
    process.env.HTTPS_PROXY = 'http://user:pass@proxy.example.com:8080'

    const dispatcher = buildProxyDispatcher('https://api.trello.com')

    expect(dispatcher).to.not.equal(undefined)
    expect(dispatcher?.dispatch).to.be.a('function')
    await dispatcher?.close()
  })

  it('returns undefined when the host is excluded via NO_PROXY', () => {
    process.env.HTTPS_PROXY = 'http://proxy.example.com:8080'
    process.env.NO_PROXY = 'api.trello.com'

    expect(buildProxyDispatcher('https://api.trello.com')).to.equal(undefined)
  })

  // Unlike the axios workaround this replaced, undici proxies http:// targets too —
  // ProxyAgent forwards those as an absolute-URI request rather than a CONNECT tunnel.
  it('returns a ProxyAgent for an http:// host', async () => {
    process.env.HTTP_PROXY = 'http://proxy.example.com:8080'

    const dispatcher = buildProxyDispatcher('http://trello.internal.example.com')

    expect(dispatcher).to.not.equal(undefined)
    await dispatcher?.close()
  })

  it('returns undefined for a host without a parseable URL', () => {
    process.env.HTTPS_PROXY = 'http://proxy.example.com:8080'

    expect(buildProxyDispatcher('api.trello.com')).to.equal(undefined)
  })
})
