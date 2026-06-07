import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { verifyRegistrationResponse } from '@simplewebauthn/server'
import {
  rpID,
  origin,
  REG_CHALLENGE_COOKIE,
  challengeCookieOptions,
  toBase64Url,
} from '@/lib/webauthn'

/**
 * Step 2 of passkey registration. Verifies the authenticator's attestation
 * against the stashed challenge and, on success, persists the public key.
 */
export async function POST(request: NextRequest) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const expectedChallenge = request.cookies.get(REG_CHALLENGE_COOKIE)?.value
  if (!expectedChallenge) {
    return NextResponse.json({ error: 'Challenge expired. Please try again.' }, { status: 400 })
  }

  const { response, deviceLabel } = await request.json()

  let verification
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 })
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo

  await payload.create({
    collection: 'passkeys',
    data: {
      user: user.id,
      credentialID: credential.id,
      publicKey: toBase64Url(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports ?? null,
      deviceLabel: deviceLabel || 'Passkey',
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
    },
  })

  const res = NextResponse.json({ verified: true })
  res.cookies.set(REG_CHALLENGE_COOKIE, '', { ...challengeCookieOptions, maxAge: 0 })
  return res
}
