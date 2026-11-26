import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { ValidationError, type GlobalConfig, type Payload } from 'payload'
import { isHumanUser } from '../../api-clients/permissions'

/**
 * Markdown Post Manager の設定（管理画面の「設定」から入れる）。
 *   - リポジトリの URL（https://github.com/<owner>/<repo>.git など）
 *   - GitHub の鍵（Fine-grained token）… PAYLOAD_SECRET から作った鍵で暗号化して保存する。
 *     API やブラウザには一切返さない（読めるのはサーバーの中の GitHub 中継だけ）
 */
export const SETTINGS_SLUG = 'markdown-post-manager-settings'
export const isOpenAIKey = (value: string) => /^sk-[A-Za-z0-9_-]{20,509}$/.test(value)

const human = ({ req }: { req: { user?: unknown } }) => isHumanUser(req.user)

function key(): Buffer {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) throw new Error('PAYLOAD_SECRET が設定されていません')
  return createHash('sha256').update(secret + ':markdown-post-manager').digest()
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12)
  const c = createCipheriv('aes-256-gcm', key(), iv)
  const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()])
  return ['v1', iv.toString('base64'), c.getAuthTag().toString('base64'), enc.toString('base64')].join('.')
}

export function decryptSecret(stored: string): string {
  const [v, iv, tag, enc] = stored.split('.')
  if (v !== 'v1' || !iv || !tag || !enc) throw new Error('鍵の形式が違います')
  const d = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64'))
  d.setAuthTag(Buffer.from(tag, 'base64'))
  return Buffer.concat([d.update(Buffer.from(enc, 'base64')), d.final()]).toString('utf8')
}

/** 「https://github.com/owner/repo.git」「git@github.com:owner/repo.git」「owner/repo」→ 「owner/repo」 */
export function parseRepo(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const s = input.trim()
  const m =
    s.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i) ??
    s.match(/^git@github\.com:([\w.-]+)\/([\w.-]+?)(?:\.git)?$/i) ??
    s.match(/^([\w.-]+)\/([\w.-]+?)(?:\.git)?$/)
  return m ? `${m[1]}/${m[2]}` : null
}

export const settingsGlobal: GlobalConfig = {
  slug: SETTINGS_SLUG,
  label: 'Markdown Post Manager 設定',
  admin: {
    group: 'Markdown Post Manager',
    description:
      '記事の入り口にする GitHub のリポジトリと、読み書きに使う鍵。鍵は暗号化して保存し、画面やブラウザには二度と表示しません（入れ直すときは新しい鍵で上書き）。',
  },
  access: { read: human, update: human },
  fields: [
    {
      name: 'repoUrl',
      type: 'text',
      label: 'リポジトリの URL',
      admin: { placeholder: 'https://github.com/azmok/noe-posts.git', description: 'Git の HTTPS の URL（owner/repo の形でもよい）' },
      validate: (v: unknown) => (v == null || v === '' || parseRepo(v) ? true : 'GitHub のリポジトリの URL を入れてください'),
    },
    {
      // 入力欄だけ（DB には保存しない）。保存のときに暗号化して tokenEncrypted に入れる
      name: 'token',
      type: 'text',
      label: 'GitHub の鍵（Fine-grained token）',
      virtual: true,
      admin: {
        placeholder: 'github_pat_…（変えるときだけ入れる）',
        description:
          'このリポジトリだけを選び、Contents: Read and write と Actions: Read-only を付けた鍵。空のまま保存すると、今の鍵をそのまま使います。',
        components: { Field: '@/plugins/markdownPostManager/manager/TokenField#TokenField' },
      },
    },
    // API やブラウザには返さない（read: false）。読むのはサーバーの readRepoSettings（overrideAccess）だけ
    { name: 'tokenEncrypted', type: 'text', access: { read: () => false }, admin: { hidden: true } },
    { name: 'tokenHint', type: 'text', label: '保存されている鍵', admin: { readOnly: true, description: '末尾4文字だけ表示しています' } },
    {
      name: 'openaiKey',
      type: 'text',
      label: '画像生成用 OpenAI API キー',
      virtual: true,
      access: { read: () => false },
      admin: {
        description: '変更するときだけ入力して保存してください。画像生成と編集を許可したプロジェクトキーを使います。',
        components: { Field: '@/plugins/markdownPostManager/manager/TokenField#TokenField' },
      },
    },
    {
      name: 'openaiKeyEncrypted',
      type: 'text',
      access: { read: () => false, create: () => false, update: () => false },
      admin: { hidden: true },
    },
    {
      name: 'openaiKeyHint',
      type: 'text',
      label: '画像生成キー（末尾4文字）',
      access: { create: () => false, update: () => false },
      admin: { readOnly: true },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        const token = typeof data.token === 'string' ? data.token.trim() : ''
        delete data.token
        if (token) {
          data.tokenEncrypted = encryptSecret(token)
          data.tokenHint = '…' + token.slice(-4)
        }
        const openaiKey = typeof data.openaiKey === 'string' ? data.openaiKey.trim() : ''
        delete data.openaiKey
        // These storage fields are only populated from the write-only input.
        delete data.openaiKeyEncrypted
        delete data.openaiKeyHint
        if (openaiKey && !isOpenAIKey(openaiKey)) {
          throw new ValidationError({
            global: SETTINGS_SLUG,
            errors: [{ path: 'openaiKey', message: 'OpenAI の API キーを入力してください' }],
          })
        }
        if (openaiKey) {
          data.openaiKeyEncrypted = encryptSecret(openaiKey)
          data.openaiKeyHint = '…' + openaiKey.slice(-4)
        }
        if (typeof data.repoUrl === 'string') data.repoUrl = data.repoUrl.trim()
        return data
      },
    ],
  },
}

export interface RepoSettings {
  repo: string | null
  token: string | null
  tokenHint: string | null
}

/** サーバーの中だけで使う：リポジトリと復号した鍵 */
export async function readRepoSettings(payload: Payload): Promise<RepoSettings> {
  const s = (await payload.findGlobal({ slug: SETTINGS_SLUG as any, overrideAccess: true, depth: 0 })) as Record<string, unknown>
  let token: string | null = null
  if (typeof s?.tokenEncrypted === 'string' && s.tokenEncrypted) {
    try {
      token = decryptSecret(s.tokenEncrypted)
    } catch {
      token = null
    }
  }
  return { repo: parseRepo(s?.repoUrl), token, tokenHint: (s?.tokenHint as string) || null }
}
