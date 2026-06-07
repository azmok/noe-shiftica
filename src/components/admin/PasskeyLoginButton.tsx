'use client'
import React, { useState } from 'react'
import { startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser'

/**
 * Rendered below the admin login form (`admin.components.afterLogin`).
 * Drives the passwordless login ceremony: fetch options → OS biometric prompt
 * (Face ID / fingerprint, or QR cross-device) → verify → redirect to /admin.
 */
export const PasskeyLoginButton: React.FC = () => {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setPending(true)
    setError('')

    // Hard guard: WebAuthn only exists in a secure context (HTTPS or localhost).
    // Opening the admin via a bare LAN IP over http (e.g. http://192.168.x.x)
    // disables the API entirely, so explain exactly why instead of a vague error.
    if (!browserSupportsWebAuthn()) {
      setError(
        `この環境ではパスキー(WebAuthn)が使えません。HTTPS か http://localhost で開いてください。` +
          `現在のURL: ${window.location.origin}（isSecureContext=${window.isSecureContext}）`,
      )
      setPending(false)
      return
    }

    try {
      const optRes = await fetch('/api/passkey/authenticate/options', { method: 'POST' })
      if (!optRes.ok) throw new Error('Failed to start authentication')
      const optionsJSON = await optRes.json()

      const assertion = await startAuthentication({ optionsJSON })

      const verifyRes = await fetch('/api/passkey/authenticate/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assertion),
      })
      const result = await verifyRes.json()
      if (!verifyRes.ok || !result.verified) {
        throw new Error(result.error || 'Login failed')
      }

      window.location.href = '/admin'
    } catch (err) {
      // The user cancelling the OS prompt throws NotAllowedError — show a calm message.
      const name = (err as Error).name
      setError(
        name === 'NotAllowedError'
          ? 'パスキー認証がキャンセルされました'
          : (err as Error).message || 'ログインに失敗しました',
      )
      setPending(false)
    }
  }

  return (
    <div style={{ marginTop: '24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '0 0 16px',
          color: 'var(--theme-elevation-400)',
          fontSize: '12px',
        }}
      >
        <span style={{ flex: 1, height: '1px', background: 'var(--theme-elevation-150)' }} />
        または
        <span style={{ flex: 1, height: '1px', background: 'var(--theme-elevation-150)' }} />
      </div>

      <button
        type="button"
        onClick={handleLogin}
        disabled={pending}
        className="btn btn--style-secondary btn--size-large"
        style={{ width: '100%', margin: 0, justifyContent: 'center' }}
      >
        {pending ? '認証中…' : '🔑 パスキーでログイン'}
      </button>

      {error && (
        <p style={{ marginTop: '12px', color: 'var(--theme-error-500)', fontSize: '13px' }}>{error}</p>
      )}
    </div>
  )
}
