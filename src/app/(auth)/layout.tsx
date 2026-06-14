import type { ReactNode } from 'react'

export const metadata = {
  title: '2要素認証ログイン — Noe Shiftica',
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
