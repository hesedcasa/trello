import {HttpsProxyAgent} from 'https-proxy-agent'
import {getProxyForUrl} from 'proxy-from-env'

/**
 * Ports https-proxy-agent falls back to when the proxy URL omits one. Resolving them
 * here keeps a defaulted port visible in diagnostics: a proxy URL such as
 * `https://vault.internal` dials the *proxy* on 443, which otherwise reads as a failure
 * to reach api.trello.com on 443.
 */
const DEFAULT_PROXY_PORTS: Record<string, string> = {'http:': '80', 'https:': '443'}

/**
 * Proxy env vars, in the precedence order proxy-from-env applies for an https:// target
 * (it prefers the lowercase spelling of each). Used to report which var a proxy URL came
 * from, and to tell a user-written scheme from one proxy-from-env inferred.
 */
const PROXY_ENV_KEYS = ['npm_config_https_proxy', 'https_proxy', 'npm_config_proxy', 'all_proxy']

export interface ProxyRequestConfig {
  httpsAgent: HttpsProxyAgent<string>
  proxy: false
}

export interface ResolvedProxy {
  /** Port the tunnel is opened on, defaulted from the scheme when the URL omits one. */
  port: string
  /** True when the port was defaulted from the scheme rather than spelled out. */
  portWasImplicit: boolean
  /** Env var the proxy URL came from, e.g. `HTTPS_PROXY`. */
  source: string
  /** Proxy URL, normalised so the scheme is always explicit. */
  url: string
}

/**
 * axios (trello.js's HTTP client) resolves HTTP(S)_PROXY env vars itself, but for
 * https:// targets it forwards a plain absolute-URI request instead of opening an
 * HTTP CONNECT tunnel — unlike fetch/undici. MITM-style proxies that require CONNECT
 * for https:// upstreams (e.g. Agent Vault) reject that with a 400. Building an
 * explicit httpsAgent that tunnels correctly, and disabling axios's own proxy
 * handling for the request, works around it.
 *
 * The workaround only applies to https:// targets. For http:// targets axios already
 * does the right thing (an absolute-URI request to the proxy), and it would consult
 * `httpAgent` rather than `httpsAgent` — so returning `proxy: false` there would
 * silently bypass the proxy instead of routing through it.
 */
export function buildProxyRequestConfig(host: string): ProxyRequestConfig | undefined {
  const proxy = resolveProxy(host)
  if (!proxy) return undefined

  return {
    httpsAgent: new HttpsProxyAgent(proxy.url),
    proxy: false,
  }
}

/**
 * Resolves the proxy that applies to `host`, normalising it so the URL handed to
 * https-proxy-agent is unambiguous. Exported separately from
 * {@link buildProxyRequestConfig} so failures can name the proxy they went through.
 */
export function resolveProxy(host: string): ResolvedProxy | undefined {
  if (!isHttpsTarget(host)) return undefined

  const rawProxyUrl = getProxyForUrl(host)
  if (!rawProxyUrl) return undefined

  const parsed = parseProxyUrl(rawProxyUrl)
  if (!parsed) return undefined

  // A URL object normalises a scheme's default port away, so the resolved port is tracked
  // separately rather than read back off the URL.
  const portWasImplicit = parsed.port === ''

  return {
    port: portWasImplicit ? (DEFAULT_PROXY_PORTS[parsed.protocol] ?? '') : parsed.port,
    portWasImplicit,
    source: findProxySource(rawProxyUrl),
    // href rather than origin: proxy URLs may carry basic-auth credentials or a path.
    url: parsed.href.replace(/\/$/, ''),
  }
}

function findProxySource(rawProxyUrl: string): string {
  for (const key of PROXY_ENV_KEYS) {
    for (const spelling of [key.toLowerCase(), key.toUpperCase()]) {
      const value = process.env[spelling]
      if (!value) continue
      // getProxyForUrl prepends the target's scheme when the value has none, so compare
      // against both the raw value and the scheme-prefixed form it would have produced.
      if (value === rawProxyUrl || stripScheme(rawProxyUrl) === value) return spelling
    }
  }

  return 'proxy environment'
}

function isHttpsTarget(host: string): boolean {
  try {
    return new URL(host).protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * proxy-from-env fills a missing scheme with the *target's* scheme, so
 * `HTTPS_PROXY=vault.internal:8080` becomes `https://vault.internal:8080` and
 * https-proxy-agent then opens a TLS connection to a proxy that is almost always
 * plaintext. That failure surfaces as an unhandled socket error rather than a caught
 * one, so scheme-less values default to http:// here, as curl and most tooling do.
 */
function parseProxyUrl(rawProxyUrl: string): undefined | URL {
  const withScheme = wasSchemeless(rawProxyUrl) ? `http://${stripScheme(rawProxyUrl)}` : rawProxyUrl

  try {
    return new URL(withScheme)
  } catch {
    return undefined
  }
}

function stripScheme(url: string): string {
  return url.replace(/^[a-z][a-z\d+.-]*:\/\//i, '')
}

function wasSchemeless(rawProxyUrl: string): boolean {
  const bare = stripScheme(rawProxyUrl)
  return PROXY_ENV_KEYS.some((key) =>
    [key.toLowerCase(), key.toUpperCase()].some((spelling) => process.env[spelling] === bare),
  )
}
