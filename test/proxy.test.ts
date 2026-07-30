import {expect} from 'chai'

import {buildProxyRequestConfig, resolveProxy} from '../src/proxy.js'

describe('proxy resolution', () => {
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

  describe('buildProxyRequestConfig', () => {
    it('returns undefined when no proxy env var is set', () => {
      expect(buildProxyRequestConfig('https://api.trello.com')).to.equal(undefined)
    })

    it('returns an httpsAgent and disables axios proxy handling when HTTPS_PROXY is set', () => {
      process.env.HTTPS_PROXY = 'http://user:pass@proxy.example.com:8080'

      const config = buildProxyRequestConfig('https://api.trello.com')

      expect(config).to.not.equal(undefined)
      expect(config?.proxy).to.equal(false)
      expect(config?.httpsAgent).to.be.an('object')
    })

    it('returns undefined when the host is excluded via NO_PROXY', () => {
      process.env.HTTPS_PROXY = 'http://proxy.example.com:8080'
      process.env.NO_PROXY = 'api.trello.com'

      expect(buildProxyRequestConfig('https://api.trello.com')).to.equal(undefined)
    })

    it('returns undefined for an http:// host so axios keeps its own proxy handling', () => {
      process.env.HTTP_PROXY = 'http://proxy.example.com:8080'

      expect(buildProxyRequestConfig('http://trello.internal.example.com')).to.equal(undefined)
    })

    it('returns undefined for a host without a parseable URL', () => {
      process.env.HTTPS_PROXY = 'http://proxy.example.com:8080'

      expect(buildProxyRequestConfig('api.trello.com')).to.equal(undefined)
    })
  })

  describe('resolveProxy', () => {
    it('reports the proxy URL, its port and the env var it came from', () => {
      process.env.HTTPS_PROXY = 'http://proxy.example.com:8080'

      expect(resolveProxy('https://api.trello.com')).to.deep.equal({
        port: '8080',
        portWasImplicit: false,
        source: 'HTTPS_PROXY',
        url: 'http://proxy.example.com:8080',
      })
    })

    // proxy-from-env would turn a scheme-less value into https://…, which makes
    // https-proxy-agent open a TLS connection to a proxy that is almost always plaintext
    // and fails with an unhandled socket error.
    it('defaults a scheme-less proxy value to http:// rather than the target scheme', () => {
      process.env.HTTPS_PROXY = 'proxy.example.com:8080'

      expect(resolveProxy('https://api.trello.com')?.url).to.equal('http://proxy.example.com:8080')
    })

    // A proxy URL without a port dials the proxy on the scheme's default port, so the
    // failure reads as `ECONNREFUSED <proxy>:443` and looks like Trello being unreachable.
    it('flags an implicit port and reports the port that will be dialled', () => {
      process.env.HTTPS_PROXY = 'https://proxy.example.com'

      expect(resolveProxy('https://api.trello.com')).to.include({
        port: '443',
        portWasImplicit: true,
        url: 'https://proxy.example.com',
      })
    })

    it('defaults an implicit port to 80 for an http:// proxy', () => {
      process.env.HTTPS_PROXY = 'http://proxy.example.com'

      expect(resolveProxy('https://api.trello.com')).to.include({port: '80', portWasImplicit: true})
    })

    it('preserves basic-auth credentials in the proxy URL', () => {
      process.env.HTTPS_PROXY = 'http://user:pass@proxy.example.com:8080'

      expect(resolveProxy('https://api.trello.com')?.url).to.equal('http://user:pass@proxy.example.com:8080')
    })

    it('reports ALL_PROXY as the source when it is the only proxy var set', () => {
      process.env.ALL_PROXY = 'http://proxy.example.com:8080'

      expect(resolveProxy('https://api.trello.com')?.source).to.equal('ALL_PROXY')
    })

    it('reports the lowercase spelling when that is the one set', () => {
      // eslint-disable-next-line camelcase
      process.env.https_proxy = 'http://proxy.example.com:8080'

      expect(resolveProxy('https://api.trello.com')?.source).to.equal('https_proxy')
    })

    it('returns undefined when no proxy applies', () => {
      expect(resolveProxy('https://api.trello.com')).to.equal(undefined)
    })
  })
})
