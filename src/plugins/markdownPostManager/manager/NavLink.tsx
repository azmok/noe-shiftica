'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

/** 管理画面の左メニューに「Markdown Post Manager」を出す */
export function NavLink() {
  const pathname = usePathname()
  const active = pathname?.startsWith('/admin/markdown-post-manager')
  return (
    <Link
      href="/admin/markdown-post-manager"
      className="nav__link"
      style={{ display: 'block', padding: '6px 0', fontWeight: active ? 700 : 400, textDecoration: 'none' }}
    >
      📝 Markdown Post Manager
    </Link>
  )
}

export default NavLink
