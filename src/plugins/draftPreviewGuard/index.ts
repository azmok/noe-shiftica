import { headers as nextHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Payload } from 'payload'
import { isHumanUser } from '../api-clients/permissions'

/**
 * 下書きプレビュー（/dev/<slug>/preview, /blog/<slug>/preview）の保護。
 *
 * 以前は slug さえ分かれば誰でも未公開の下書きを見られた。記事を非公開リポジトリ（noe-posts）で
 * 管理する意味を保つため、Payload（管理画面）にログインしているときだけ表示する。
 * 未ログインなら、ログイン後にこのページへ戻ってくる形で /admin/login へ送る。
 *
 * 管理画面の Live Preview（同じオリジンの iframe）は、管理画面のセッション Cookie がそのまま
 * 送られるので、このガードを通る。
 */

/** ログイン画面への URL（ログイン後に戻るパスを redirect に付ける） */
export function loginRedirectUrl(returnPath: string): string {
  return `/admin/login?redirect=${encodeURIComponent(returnPath)}`
}

/** ログインしていなければ /admin/login へリダイレクトする（戻り値は使わない。redirect は例外で止まる） */
export async function requirePreviewUser(payload: Payload, returnPath: string): Promise<void> {
  const { user } = await payload.auth({ headers: await nextHeaders() })
  if (!isHumanUser(user)) redirect(loginRedirectUrl(returnPath))
}
