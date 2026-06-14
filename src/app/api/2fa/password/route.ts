import { NextResponse, type NextRequest } from 'next/server'
import crypto from 'crypto'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  PENDING_2FA_COOKIE,
  pending2faCookieOptions,
  signPending2fa,
  mintPayloadSessionCookie,
} from '@/lib/webauthn'

/**
 * First factor of true 2FA: verify email + password.
 *
 * Outcomes:
 * - `logged-in`    → full session minted immediately. Happens when the user has
 *                    no passkey yet (bootstrap: they must log in to enroll one)
 *                    or when the `DISABLE_2FA` break-glass env is set.
 * - `need-passkey` → password is correct but the user has a passkey, so a second
 *                    factor is required. We hand back a short-lived `pending-2fa`
 *                    cookie that the passkey verify endpoint will demand.
 *
 * No session is ever granted on password alone when 2FA is active.
 */
export async function POST(request: NextRequest) {
  const payload = await getPayload({ config })
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'メールとパスワードを入力してください' }, { status: 400 })
  }

  // db.findOne returns the raw row including the hidden hash/salt columns.
  const user = await payload.db.findOne<{ id: string | number; hash?: string; salt?: string }>({
    collection: 'users',
    where: { email: { equals: String(email).toLowerCase().trim() } },
  })

  const invalid = NextResponse.json({ error: 'メールアドレスまたはパスワードが違います' }, { status: 401 })
  if (!user || typeof user.hash !== 'string' || typeof user.salt !== 'string') {
    return invalid
  }

  // Same algorithm Payload's local strategy uses (pbkdf2, 25000 iters, sha256).
  const ok = await new Promise<boolean>((resolve) => {
    crypto.pbkdf2(password, user.salt as string, 25000, 512, 'sha256', (err, derived) => {
      if (err) return resolve(false)
      const stored = Buffer.from(user.hash as string, 'hex')
      resolve(derived.length === stored.length && crypto.timingSafeEqual(derived, stored))
    })
  })
  if (!ok) return invalid

  const disable2fa = process.env.DISABLE_2FA === 'true'
  const passkeys = await payload.count({
    collection: 'passkeys',
    where: { user: { equals: user.id } },
  })
  const hasPasskey = passkeys.totalDocs > 0

  // Bootstrap (no passkey yet) or break-glass → log in with password alone.
  if (disable2fa || !hasPasskey) {
    const fullUser = await payload.findByID({ collection: 'users', id: user.id, depth: 0 })
    const cookie = await mintPayloadSessionCookie(payload, fullUser)
    const res = NextResponse.json({ status: 'logged-in' })
    res.cookies.set(cookie.name, cookie.value, cookie.options)
    return res
  }

  // Password OK + passkey on file → demand the second factor.
  const pending = signPending2fa(payload.secret, user.id)
  const res = NextResponse.json({ status: 'need-passkey' })
  res.cookies.set(PENDING_2FA_COOKIE, pending, pending2faCookieOptions)
  return res
}
