/**
 * Shared server-side WebAuthn (passkey) configuration and helpers.
 *
 * Relying Party (RP) identity is derived from the same server URL that
 * `payload.config.ts` uses, so dev (localhost) and prod (noe-shiftica.com)
 * resolve automatically without extra env vars.
 *
 * Passwordless design notes:
 * - Credentials are "discoverable" (resident keys) so the authenticator can
 *   return the user handle without us asking for an email first.
 * - The one-time challenge is stored in a short-lived httpOnly cookie instead
 *   of the DB. This is stateless and safe across Cloud Run instances.
 */
import { randomUUID } from 'crypto'
import { getFieldsToSign, jwtSign, type Payload, type CollectionConfig, type PayloadRequest } from 'payload'
import type { User } from '@/payload-types'

const serverURL =
  process.env.PAYLOAD_PUBLIC_SERVER_URL ||
  process.env.NEXT_PUBLIC_SERVER_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://noe-shiftica.com' : 'http://localhost:3000')

/** User-visible service name shown in the OS passkey dialog. */
export const rpName = 'Noe Shiftica'
/** Full origin, e.g. `https://noe-shiftica.com` (no trailing slash). */
export const origin = serverURL.replace(/\/$/, '')
/** Registrable domain, e.g. `localhost` or `noe-shiftica.com`. */
export const rpID = new URL(origin).hostname

export const REG_CHALLENGE_COOKIE = 'pk-reg-challenge'
export const AUTH_CHALLENGE_COOKIE = 'pk-auth-challenge'
/** How long the user has to complete a ceremony before the challenge expires. */
export const CHALLENGE_TTL_SECONDS = 300

/** Cookie options for the short-lived challenge cookie. */
export const challengeCookieOptions = {
  httpOnly: true,
  path: '/',
  sameSite: 'lax' as const,
  secure: origin.startsWith('https'),
  maxAge: CHALLENGE_TTL_SECONDS,
}

export const toBase64Url = (bytes: Uint8Array): string => Buffer.from(bytes).toString('base64url')
export const fromBase64Url = (str: string): Uint8Array<ArrayBuffer> =>
  Uint8Array.from(Buffer.from(str, 'base64url'))

/**
 * Mint the exact session cookie Payload's own login flow would produce, so a
 * verified passkey assertion logs the user into the admin panel with no
 * password. Returns the cookie name/value/options for the caller to set.
 */
export async function mintPayloadSessionCookie(payload: Payload, user: User) {
  const collectionConfig = payload.collections['users'].config
  const tokenExpiration = collectionConfig.auth?.tokenExpiration ?? 7200

  // Payload 3.x enables login sessions by default (auth.useSessions). The JWT
  // must carry a `sid` that exists in the user's `sessions` array, or the auth
  // strategy rejects the token and bounces straight back to the login screen.
  // This mirrors Payload's internal `addSessionToUser`.
  let sid: string | undefined
  if (collectionConfig.auth?.useSessions) {
    sid = randomUUID()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + tokenExpiration * 1000)
    const existing = Array.isArray(user.sessions) ? user.sessions : []
    const active = existing.filter((s) => new Date(s.expiresAt) > now)
    await payload.db.updateOne({
      collection: 'users',
      id: user.id,
      // updatedAt: null prevents the user's updatedAt from being bumped on login.
      data: { ...user, sessions: [...active, { id: sid, createdAt: now, expiresAt }], updatedAt: null },
      returning: false,
    })
  }

  const fieldsToSign = getFieldsToSign({
    collectionConfig: collectionConfig as unknown as CollectionConfig,
    email: user.email,
    user: user as unknown as PayloadRequest['user'],
    sid,
  })
  const { token } = await jwtSign({ fieldsToSign, secret: payload.secret, tokenExpiration })
  const cookiePrefix = payload.config.cookiePrefix || 'payload'

  return {
    name: `${cookiePrefix}-token`,
    value: token,
    options: {
      httpOnly: true,
      path: '/',
      sameSite: 'lax' as const,
      secure: origin.startsWith('https'),
      maxAge: tokenExpiration,
    },
  }
}
