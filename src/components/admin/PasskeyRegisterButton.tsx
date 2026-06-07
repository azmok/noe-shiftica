'use client'
import React, { useState } from 'react'
import { startRegistration, browserSupportsWebAuthn } from '@simplewebauthn/browser'

/**
 * Rendered as a `ui` field on the Users edit view. Lets a logged-in user
 * enroll the current device as a passkey (Face ID / fingerprint). After this,
 * they can log in passwordlessly from the login screen.
 */
export const PasskeyRegisterButton: React.FC = () => {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const handleRegister = async () => {
    setPending(true)
    setMessage('')
    setIsError(false)

    // WebAuthn requires a secure context (HTTPS or localhost). A bare LAN IP
    // over http silently disables the API — explain exactly why.
    if (!browserSupportsWebAuthn()) {
      setIsError(true)
      setMessage(
        `この環境ではパスキー(WebAuthn)が使えません。HTTPS か http://localhost で開いてください。` +
          `現在のURL: ${window.location.origin}（isSecureContext=${window.isSecureContext}）`,
      )
      setPending(false)
      return
    }

    try {
      const optRes = await fetch('/api/passkey/register/options', { method: 'POST' })
      if (!optRes.ok) throw new Error('登録の開始に失敗しました')
      const optionsJSON = await optRes.json()

      const attestation = await startRegistration({ optionsJSON })

      const deviceLabel = `${navigator.platform || 'Device'} · ${new Date().toLocaleDateString('ja-JP')}`
      const verifyRes = await fetch('/api/passkey/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: attestation, deviceLabel }),
      })
      const result = await verifyRes.json()
      if (!verifyRes.ok || !result.verified) {
        throw new Error(result.error || '登録に失敗しました')
      }

      setMessage('✅ このデバイスをパスキーとして登録しました')
    } catch (err) {
      const name = (err as Error).name
      setIsError(true)
      setMessage(
        name === 'NotAllowedError'
          ? 'パスキー登録がキャンセルされました'
          : (err as Error).message || '登録に失敗しました',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <button
        type="button"
        onClick={handleRegister}
        disabled={pending}
        className="btn btn--style-primary"
        style={{ margin: 0 }}
      >
        {pending ? '登録中…' : '🔑 このデバイスをパスキー登録'}
      </button>
      {message && (
        <p
          style={{
            marginTop: '10px',
            fontSize: '13px',
            color: isError ? 'var(--theme-error-500)' : 'var(--theme-success-500)',
          }}
        >
          {message}
        </p>
      )}
    </div>
  )
}
