import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import {
  rpID,
  origin,
  AUTH_CHALLENGE_COOKIE,
  challengeCookieOptions,
  fromBase64Url,
  mintPayloadSessionCookie,
} from '@/lib/webauthn'

/**
 * Step 2 of passwordless login. Verifies the assertion, advances the
 * replay-protection counter, and — on success — mints the same session cookie
 * Payload's password login would, logging the user into the admin panel.
 */
export async function POST(request: NextRequest) {
  const payload = await getPayload({ config })

  const expectedChallenge = request.cookies.get(AUTH_CHALLENGE_COOKIE)?.value
  if (!expectedChallenge) {
    return NextResponse.json({ error: 'Challenge expired. Please try again.' }, { status: 400 })
  }

  const response = await request.json()

  const found = await payload.find({
    collection: 'passkeys',
    where: { credentialID: { equals: response.id } },
    limit: 1,
    depth: 0,
  })
  const passkey = found.docs[0]
  if (!passkey) {
    return NextResponse.json({ error: 'Passkey not recognized' }, { status: 401 })
  }

  let verification
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: passkey.credentialID,
        publicKey: fromBase64Url(passkey.publicKey),
        counter: passkey.counter,
        transports: (passkey.transports as never) ?? undefined,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 })
  }

  if (!verification.verified) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 401 })
  }

  await payload.update({
    collection: 'passkeys',
    id: passkey.id,
    data: { counter: verification.authenticationInfo.newCounter },
  })

  const userId = typeof passkey.user === 'object' ? passkey.user.id : passkey.user
  const user = await payload.findByID({ collection: 'users', id: userId, depth: 0 })

  const cookie = await mintPayloadSessionCookie(payload, user)

  const res = NextResponse.json({ verified: true })
  res.cookies.set(cookie.name, cookie.value, cookie.options)
  res.cookies.set(AUTH_CHALLENGE_COOKIE, '', { ...challengeCookieOptions, maxAge: 0 })
  return res
}
