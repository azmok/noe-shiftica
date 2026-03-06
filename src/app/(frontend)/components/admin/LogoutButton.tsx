'use client'
import React from 'react'

export const LogoutButton: React.FC = () => {
    return (
        <div style={{ marginTop: '20px' }}>
            <a
                href="/admin/logout"
                className="btn btn--style-secondary"
                style={{
                    display: 'inline-block',
                    padding: '10px 24px',
                    backgroundColor: '#e5e7eb',
                    color: '#374151',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    border: '1px solid #d1d5db',
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#d1d5db'
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#e5e7eb'
                }}
            >
                Log out
            </a>
        </div>
    )
}
