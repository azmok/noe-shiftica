import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { generateRegistrationOptions } from '@simplewebauthn/server'
import { rpID, rpName, REG_CHALLENGE_COOKIE, challengeCookieOptions } from '@/lib/webauthn'

/**
 * Step 1 of passkey registration. The user must already be logged in (they are
 * adding a passkey to their own account). Returns the WebAuthn creation options
 * and stashes the one-time challenge in an httpOnly cookie.
 */
export async function POST(request: NextRequest) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Don't let the same authenticator register twice.
  const existing = await payload.find({
    collection: 'passkeys',
    where: { user: { equals: user.id } },
    limit: 100,
    depth: 0,
  })

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: user.email,
    userID: new TextEncoder().encode(String(user.id)),
    attestationType: 'none',
    excludeCredentials: existing.docs.map((doc) => ({
      id: doc.credentialID,
      transports: (doc.transports as never) ?? undefined,
    })),
    authenticatorSelection: {
      // No `authenticatorAttachment` pin on purpose: leaving it unset lets the
      // browser offer every route — the local platform authenticator (Face ID /
      // Touch ID / Windows Hello) AND cross-device via QR (FIDO2 hybrid), where
      // a desktop shows a QR the phone scans to register/login with Face ID.
      // Discoverable credential + biometric/PIN — the core of passwordless.
      residentKey: 'required',
      userVerification: 'required',
    },
  })

  const res = NextResponse.json(options)
  res.cookies.set(REG_CHALLENGE_COOKIE, options.challenge, challengeCookieOptions)
  return res
}
