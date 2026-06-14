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
  PENDING_2FA_COOKIE,
  pending2faCookieOptions,
  verifyPending2fa,
} from '@/lib/webauthn'

/**
 * Second factor of true 2FA. Verifies the passkey assertion AND requires the
 * `pending-2fa` cookie proving the password step already passed (for the same
 * user). Only then is a real session minted. The `DISABLE_2FA` break-glass env
 * skips the password-proof requirement.
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

  // Enforce the first factor: the password step must have passed for THIS user.
  const disable2fa = process.env.DISABLE_2FA === 'true'
  if (!disable2fa) {
    const pendingUid = verifyPending2fa(payload.secret, request.cookies.get(PENDING_2FA_COOKIE)?.value)
    if (pendingUid === null) {
      return NextResponse.json({ error: '先にパスワードでの認証が必要です' }, { status: 401 })
    }
    if (String(pendingUid) !== String(userId)) {
      return NextResponse.json({ error: '2要素認証のユーザーが一致しません' }, { status: 401 })
    }
  }

  const user = await payload.findByID({ collection: 'users', id: userId, depth: 0 })

  const cookie = await mintPayloadSessionCookie(payload, user)

  const res = NextResponse.json({ verified: true })
  res.cookies.set(cookie.name, cookie.value, cookie.options)
  res.cookies.set(AUTH_CHALLENGE_COOKIE, '', { ...challengeCookieOptions, maxAge: 0 })
  // Consume the password-step proof so it can't be reused.
  res.cookies.set(PENDING_2FA_COOKIE, '', { ...pending2faCookieOptions, maxAge: 0 })
  return res
}
