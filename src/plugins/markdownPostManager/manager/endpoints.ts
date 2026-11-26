import type { Endpoint, PayloadHandler } from 'payload'
import { isHumanUser } from '../../api-clients/permissions'
import { imageEndpoints } from './imageEndpoints'
import { readRepoSettings } from './settings'

/**
 * Markdown Post Manager（管理画面のタブで動くエディタ）から GitHub への中継。
 *
 * ブラウザは鍵を持たない。管理画面にログインした人の Cookie で /api/mpm/github?path=… を呼ぶと、
 * サーバーが設定の鍵を付けて api.github.com に送る。届く先は設定したリポジトリ（/repos/<owner>/<repo>…）だけ。
 */

const GITHUB = 'https://api.github.com'
/** PATCH＝ブランチを進める（記事の移動・削除の commit）、DELETE＝下書きブランチを消す */
const METHODS = ['GET', 'PUT', 'POST', 'PATCH', 'DELETE'] as const

/** 中継してよい GitHub API のパスか（設定したリポジトリの中だけ） */
export function allowedPath(path: string, repo: string): boolean {
  if (!path.startsWith('/') || /[\s#\\]/.test(path)) return false
  const base = '/repos/' + repo
  const pathname = path.split('?')[0]
  // フォルダを遡る「..」（%2e%2e も）は通さない。compare/A...B の「...」は通す
  if (pathname.split('/').some((seg) => /^(\.|%2e){1,2}$/i.test(seg))) return false
  return pathname === base || pathname.toLowerCase().startsWith(base.toLowerCase() + '/')
}

const deny = (status: number, message: string) => Response.json({ message }, { status })

const configHandler: PayloadHandler = async (req) => {
  if (!isHumanUser(req.user)) return deny(401, '管理画面にログインしてください')
  const s = await readRepoSettings(req.payload)
  return Response.json({ repo: s.repo, hasToken: Boolean(s.token), tokenHint: s.tokenHint, settingsUrl: '/admin/globals/markdown-post-manager-settings' })
}

const proxyHandler: PayloadHandler = async (req) => {
  if (!isHumanUser(req.user)) return deny(401, '管理画面にログインしてください')
  const s = await readRepoSettings(req.payload)
  if (!s.repo || !s.token) return deny(412, 'リポジトリの URL と GitHub の鍵を、設定で入れてください')
  const url = new URL(req.url ?? '', 'http://x')
  const path = url.searchParams.get('path') ?? ''
  if (!allowedPath(path, s.repo)) return deny(403, `このパスには中継しません：${path}`)

  const method = (req.method ?? 'GET').toUpperCase()
  const accept = req.headers.get('accept') || 'application/vnd.github+json'
  const init: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${s.token}`,
      Accept: accept,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'markdown-post-manager',
      ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(method !== 'GET' && method !== 'DELETE' && req.text ? { body: await req.text() } : {}),
    redirect: 'follow',
  }
  const res = await fetch(GITHUB + path, init)
  const body = await res.arrayBuffer()
  return new Response(body, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('content-type') ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    },
  })
}

export const managerEndpoints: Endpoint[] = [
  ...imageEndpoints,
  { path: '/mpm/config', method: 'get', handler: configHandler },
  ...METHODS.map((m) => ({ path: '/mpm/github', method: m.toLowerCase() as Lowercase<(typeof METHODS)[number]>, handler: proxyHandler })),
]
