import { createHash } from 'node:crypto'

/**
 * Markdown 原文の「版の印」（上書きガード用）。
 *
 * 改行コード（CRLF / LF）と末尾の空白行の違いは同じ版として扱う。
 * noe-posts から送られた原文も、管理画面で直した原文も、同じ計算で印を作るので、
 * 「Git に書き出した時点の版（baseRevision）」と「DB の今の版（markdownRevision）」を比べられる。
 */
export function markdownRevision(source: string): string {
  const normalized = source.replace(/\r\n?/g, '\n').replace(/\s+$/, '')
  return createHash('sha256').update(normalized, 'utf8').digest('hex').slice(0, 16)
}

export type GuardResult = { ok: true } | { ok: false; reason: string }

/**
 * Git（noe-posts）から送られてきた Markdown 記事を、DB の記事に上書きしてよいか判定する。
 *
 * - DB に無い / まだ一度も公開していない → 上書きしてよい（公開前は Git が持ち主）
 * - 公開済み → DB が持ち主。次のどちらかのときだけ受け入れる
 *     1. 送られてきた本文が DB の今の版と同じ（同じ内容の再送。何も変わらない）
 *     2. frontmatter の baseRevision が DB の今の版と同じ（DB から書き出した版を直して返してきた）
 */
export function checkGitOverwrite(args: {
  existing: { published: boolean; markdownRevision?: string | null } | null
  incomingRevision: string
  baseRevision?: string | null
}): GuardResult {
  const { existing, incomingRevision, baseRevision } = args
  if (!existing || !existing.published) return { ok: true }
  const current = existing.markdownRevision ?? null
  if (current && incomingRevision === current) return { ok: true }
  if (current && baseRevision && baseRevision === current) return { ok: true }
  if (!baseRevision) {
    return {
      ok: false,
      reason:
        'この記事は公開済みで、正本は DB です。Git から上書きするには、管理画面の「Git に書き出す」で書き出した .md（frontmatter に baseRevision がある）を直して送ってください。',
    }
  }
  return {
    ok: false,
    reason: `DB の記事は書き出したあとに更新されています（書き出した版 ${baseRevision} / DB の今の版 ${current ?? 'なし'}）。管理画面からもう一度書き出してから直してください。`,
  }
}
