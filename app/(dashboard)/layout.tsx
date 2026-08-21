'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner spinner-lg" style={{ margin: '0 auto 12px' }} />
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Yükleniyor...</div>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Header />
        <div className="app-content">
          {children}
        </div>
      </main>
    </div>
  )
}
