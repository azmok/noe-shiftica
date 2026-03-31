'use client'

import React from 'react'

export const LinkedPostCell: React.FC<{ cellData?: string | null }> = ({ cellData }) => {
  if (!cellData) {
    return (
      <span
        style={{
          color: 'var(--theme-elevation-400)',
          fontSize: '12px',
          fontStyle: 'italic',
        }}
      >
        対応なし
      </span>
    )
  }
  return <span style={{ fontWeight: 500 }}>{cellData}</span>
}
