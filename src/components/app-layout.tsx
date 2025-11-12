'use client'

import { ThemeProvider } from './theme-provider'
import { Toaster } from './ui/sonner'
import { AppHeader } from '@/components/app-header'
import { AppSidebar } from '@/components/app-sidebar'
import React from 'react'
import { AppFooter } from '@/components/app-footer'
import { ClusterChecker } from '@/components/cluster/cluster-ui'
import { AccountChecker } from '@/components/account/account-ui'
import { WalletBalance } from '@/components/wallet-balance'

export function AppLayout({
  children,
  links,
}: {
  children: React.ReactNode
  links: { label: string; path: string }[]
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20">
        <AppSidebar />
        <div className="flex flex-col flex-1 md:ml-64">
          <AppHeader links={links} />
          <main className="grow p-8">
            <div className="mb-4 flex items-center justify-end gap-4">
              <WalletBalance />
            </div>
            <ClusterChecker>
              <AccountChecker />
            </ClusterChecker>
            {children}
          </main>
          {/* <AppFooter /> */}
        </div>
      </div>
      <Toaster />
    </ThemeProvider>
  )
}
