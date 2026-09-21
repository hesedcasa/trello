import {getProxyForUrl} from 'proxy-from-env'
import {ProxyAgent} from 'undici'

/**
 * trello.js v2 dropped axios for the global `fetch`, and Node's fetch (undici) ignores
 * the HTTP(S)_PROXY env vars entirely — no proxy, no CONNECT tunnel, just a direct
 * connection that a network-isolated environment refuses. Resolving the proxy here and
 * handing undici a `ProxyAgent` restores it, and because ProxyAgent opens a real CONNECT
 * tunnel for https:// upstreams, MITM-style proxies that require one (e.g. Agent Vault)
 * are satisfied too — that used to need an explicit workaround against axios.
 *
 * `getProxyForUrl` applies NO_PROXY, so an excluded host yields `undefined` and the
 * caller leaves undici's default dispatcher in place. http:// targets are proxied the
 * same way; ProxyAgent forwards those as an absolute-URI request without tunnelling.
 */
export function buildProxyDispatcher(host: string): ProxyAgent | undefined {
  if (!isAbsoluteUrl(host)) return undefined

  const proxyUrl = getProxyForUrl(host)
  if (!proxyUrl) return undefined

  return new ProxyAgent(proxyUrl)
}

function isAbsoluteUrl(host: string): boolean {
  try {
    const {protocol} = new URL(host)
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}
