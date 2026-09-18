import {expect} from 'chai'
import {execFile} from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {promisify} from 'node:util'

const execFileAsync = promisify(execFile)

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const CLI = path.join(REPO_ROOT, 'bin', 'run.js')

export type CliResult = {
  code: number
  stderr: string
  stdout: string
}

/**
 * Reads the account credentials from the environment.
 *
 * Nothing in this repo loads .env, so these must already be exported.
 *
 * TRELLO_SECRET holds the API token despite its name: it is the 64-hex-char
 * value Trello's authorize flow hands out, not the Power-Up admin page's
 * OAuth secret, which the API rejects with 401.
 *
 * @returns The API key and token.
 */
export function requireEnv(): {apiKey: string; apiToken: string} {
  const apiKey = process.env.TRELLO_API_KEY
  const apiToken = process.env.TRELLO_SECRET

  if (!apiKey || !apiToken) {
    throw new Error(
      'Missing TRELLO_API_KEY or TRELLO_SECRET. ' +
        'Nothing in this repo loads .env — run: set -a; . ./.env; set +a',
    )
  }

  return {apiKey, apiToken}
}

/**
 * Writes a throwaway oclif config dir holding a `default` profile pointing at
 * the live account and a `broken` profile whose credentials are invalid.
 *
 * The dir is passed to the subprocess as TRELLO_CONFIG_DIR — the scoped env
 * var oclif resolves before falling back to the platform config directory —
 * so the suite never touches the user's real profile.
 *
 * Credentials are written as literals rather than `env:` references so the
 * suite never depends on a secret backend being reachable.
 *
 * @returns Absolute path to the config dir, to be passed as TRELLO_CONFIG_DIR.
 */
export async function createConfigDir(): Promise<string> {
  const {apiKey, apiToken} = requireEnv()
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'trello-e2e-'))

  await fs.writeFile(
    path.join(dir, 'trello-config.json'),
    JSON.stringify(
      {
        defaultProfile: 'default',
        profiles: {
          broken: {apiKey: 'bogus-key-000000000000000', apiToken: 'bogus-token-000000000000000000000000000000000000000000000000000000000'},
          default: {apiKey, apiToken},
        },
      },
      null,
      2,
    ),
    {mode: 0o600},
  )

  return dir
}

export async function removeConfigDir(dir: string): Promise<void> {
  await fs.rm(dir, {force: true, recursive: true})
}

/**
 * Runs the built CLI (`bin/run.js`) as a real subprocess against the live
 * API. Non-zero exits are returned rather than thrown so tests can assert on
 * failure paths.
 *
 * Unlike the repo's own commands, the `auth *` commands from plugin-lib print
 * plain text by default and accept `--json`; the data commands print JSON by
 * default (BaseCommand.jsonEnabled()) and must never be passed `--json` — it
 * is not a declared flag and parsing fails.
 *
 * @param args Command line arguments, e.g. ['trello', 'board', 'list'].
 * @param configDir Value for TRELLO_CONFIG_DIR, from createConfigDir().
 * @returns The exit code and captured stdout/stderr.
 */
export async function runCli(args: string[], configDir: string): Promise<CliResult> {
  try {
    const {stderr, stdout} = await execFileAsync(process.execPath, [CLI, ...args], {
      env: {...process.env, FORCE_COLOR: '0', NO_COLOR: '1', TRELLO_CONFIG_DIR: configDir},
      maxBuffer: 32 * 1024 * 1024,
    })
    return {code: 0, stderr, stdout}
  } catch (error: unknown) {
    const failure = error as {code?: number; stderr?: string; stdout?: string}
    return {code: failure.code ?? 1, stderr: failure.stderr ?? '', stdout: failure.stdout ?? ''}
  }
}

/**
 * Replaces every occurrence of `secret` in `text` with `<redacted>`.
 *
 * A missing/empty secret is a no-op rather than matching everything — an
 * empty needle would otherwise turn `replaceAll` into a full-string redaction.
 *
 * Exported (rather than a private helper) so it can be exercised directly by
 * a unit-style test without invoking a command whose output carries real
 * credentials.
 *
 * @param text Captured stdout/stderr that may contain a secret.
 * @param secret The value to scrub; falsy values leave `text` untouched.
 * @returns `text` with every occurrence of `secret` replaced.
 */
export function redactSecret(text: string, secret: string | undefined): string {
  return secret ? text.replaceAll(secret, '<redacted>') : text
}

/**
 * Reads the credentials for redaction purposes only. Swallows the
 * "missing credentials" error from requireEnv() so that a call site with no
 * env configured still gets a (no-op) redaction rather than a thrown error.
 *
 * @returns The credential strings, with undefined for any that is unset.
 */
function redactionSecrets(): Array<string | undefined> {
  try {
    const {apiKey, apiToken} = requireEnv()
    return [apiKey, apiToken]
  } catch {
    return [undefined, undefined]
  }
}

/**
 * Runs the CLI and fails the test if it exited non-zero.
 *
 * The failure message redacts both credentials from stdout/stderr before they
 * are interpolated, so a failing call never prints them into mocha's failure
 * output or CI logs. The returned `CliResult` itself is left unredacted —
 * tests need the real values to assert on.
 *
 * @param args Command line arguments.
 * @param configDir Value for TRELLO_CONFIG_DIR.
 * @returns The successful result.
 */
export async function runCliOk(args: string[], configDir: string): Promise<CliResult> {
  const result = await runCli(args, configDir)
  let {stderr, stdout} = result;
  for (const secret of redactionSecrets()) {
    stdout = redactSecret(stdout, secret)
    stderr = redactSecret(stderr, secret)
  }

  expect(result.code, `\`trello ${args.join(' ')}\` failed:\n${stdout}\n${stderr}`).to.equal(0)
  return result
}

/**
 * Runs the CLI and parses stdout as JSON.
 *
 * JSON is the default output mode for the repo's data commands
 * (BaseCommand.jsonEnabled()), and `--json` is not a declared flag — do not
 * add one.
 *
 * @param args Command line arguments.
 * @param configDir Value for TRELLO_CONFIG_DIR.
 * @returns The parsed JSON payload.
 */
export async function runCliJson<T = unknown>(args: string[], configDir: string): Promise<T> {
  const {stdout} = await runCliOk(args, configDir)
  return JSON.parse(stdout) as T
}
