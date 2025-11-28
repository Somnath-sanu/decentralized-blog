'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { WalletButton } from '@/components/solana/solana-provider'
import { SidebarTrigger } from '@/components/ui/sidebar'
// import { ThemeSelect } from './theme-select'

export function AppHeader() {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <header className="relative z-50 px-6 py-1 flex items-center gap-4">
      <SidebarTrigger />
      <div className="flex justify-between items-center flex-1">

        <div className="hidden md:flex items-center gap-6 ml-auto dark:text-white">
          <WalletButton />
          {/* <ThemeSelect/> */}
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setShowMenu(!showMenu)}>
          {showMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>

        {showMenu && (
          <div className="md:hidden fixed inset-x-0 top-[73px] bottom-0 bg-[#1a1f2e] dark:bg-transparent dark:border-transparent border-t border-gray-800">
            <div className="pt-4 border-t border-gray-800 dark:text-white">
              <WalletButton />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
