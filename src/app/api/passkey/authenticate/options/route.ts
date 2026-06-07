import { NextResponse } from 'next/server'
import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { rpID, AUTH_CHALLENGE_COOKIE, challengeCookieOptions } from '@/lib/webauthn'

/**
 * Step 1 of passwordless login. No email/username is asked for — because the
 * credentials are discoverable, the authenticator presents the available
 * passkeys and returns whichever the user picks.
 */
export async function POST() {
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'required',
    allowCredentials: [],
  })

  const res = NextResponse.json(options)
  res.cookies.set(AUTH_CHALLENGE_COOKIE, options.challenge, challengeCookieOptions)
  return res
}
