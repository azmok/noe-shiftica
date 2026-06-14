'use client'
import React, { useState } from 'react'
import { startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser'

type Step = 'password' | 'passkey'

/**
 * Two-step (true 2FA) admin login: password (1st factor) → passkey (2nd factor).
 * A session is only granted after BOTH succeed. Replaces the native Payload
 * login (which is redirected here by middleware).
 */
export const TwoFactorLogin: React.FC = () => {
  const [step, setStep] = useState<Step>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const goToAdmin = () => {
    window.location.href = '/admin'
  }

  const runPasskey = async () => {
    setPending(true)
    setError('')
    try {
      if (!browserSupportsWebAuthn()) {
        throw new Error(
          `この環境ではパスキーが使えません。HTTPS か http://localhost で開いてください（現在: ${window.location.origin}）`,
        )
      }
      const optRes = await fetch('/api/passkey/authenticate/options', { method: 'POST' })
      if (!optRes.ok) throw new Error('認証の開始に失敗しました')
      const optionsJSON = await optRes.json()

      const assertion = await startAuthentication({ optionsJSON })

      const verifyRes = await fetch('/api/passkey/authenticate/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assertion),
      })
      const result = await verifyRes.json()
      if (!verifyRes.ok || !result.verified) {
        throw new Error(result.error || 'パスキー認証に失敗しました')
      }
      goToAdmin()
    } catch (err) {
      const name = (err as Error).name
      setError(
        name === 'NotAllowedError'
          ? 'パスキー認証がキャンセルされました'
          : (err as Error).message || 'パスキー認証に失敗しました',
      )
      setPending(false)
    }
  }

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPending(true)
    setError('')
    try {
      const res = await fetch('/api/2fa/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'ログインに失敗しました')

      if (result.status === 'logged-in') {
        goToAdmin()
        return
      }
      // status === 'need-passkey' → advance to the second factor.
      setPending(false)
      setStep('passkey')
    } catch (err) {
      setError((err as Error).message || 'ログインに失敗しました')
      setPending(false)
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.brand}>Noe Shiftica</div>

        {step === 'password' && (
          <form onSubmit={handlePassword}>
            <h1 style={styles.title}>ログイン</h1>
            <p style={styles.sub}>2要素認証 — まずメールとパスワード</p>

            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              required
              style={styles.input}
            />

            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              style={styles.input}
            />

            <button type="submit" disabled={pending} style={styles.primaryBtn}>
              {pending ? '確認中…' : '次へ'}
            </button>
          </form>
        )}

        {step === 'passkey' && (
          <div>
            <h1 style={styles.title}>パスキーで本人確認</h1>
            <p style={styles.sub}>第2要素 — Face ID / 指紋 / セキュリティキー</p>

            <div style={styles.passkeyIcon}>🔑</div>

            <button type="button" onClick={runPasskey} disabled={pending} style={styles.primaryBtn}>
              {pending ? '認証中…' : '🔑 パスキーで認証'}
            </button>
            <button
              type="button"
              onClick={() => {
                setError('')
                setPending(false)
                setStep('password')
              }}
              style={styles.linkBtn}
            >
              ← パスワードからやり直す
            </button>
          </div>
        )}

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0b0b0d',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    padding: '24px',
  },
  card: {
    width: '100%',
    maxWidth: '380px',
    background: '#17171a',
    border: '1px solid #2a2a30',
    borderRadius: '12px',
    padding: '32px 28px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
  },
  brand: { color: '#8a8a94', fontSize: '13px', fontWeight: 600, marginBottom: '24px', letterSpacing: '0.04em' },
  title: { color: '#fff', fontSize: '22px', fontWeight: 700, margin: '0 0 4px' },
  sub: { color: '#8a8a94', fontSize: '13px', margin: '0 0 24px' },
  label: { display: 'block', color: '#b8b8c0', fontSize: '12px', fontWeight: 600, margin: '0 0 6px' },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '11px 13px',
    marginBottom: '18px',
    background: '#0e0e10',
    border: '1px solid #2a2a30',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
  },
  primaryBtn: {
    width: '100%',
    padding: '12px',
    background: '#fff',
    color: '#111',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '4px',
  },
  linkBtn: {
    width: '100%',
    padding: '10px',
    background: 'transparent',
    color: '#8a8a94',
    border: 'none',
    fontSize: '13px',
    cursor: 'pointer',
    marginTop: '8px',
  },
  passkeyIcon: { fontSize: '44px', textAlign: 'center', margin: '8px 0 20px' },
  error: { color: '#ff6b6b', fontSize: '13px', marginTop: '16px', lineHeight: 1.5 },
}
