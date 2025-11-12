'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { FileText, PlusCircle, Gift, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'All Blogs', path: '/blogs', icon: FileText },
  { label: 'Create Blog', path: '/blogs/create', icon: PlusCircle },
  { label: 'Lucky Wheel', path: '/lucky-wheel', icon: Gift },
  { label: 'Account', path: '/account', icon: User },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-purple-900/20 via-purple-800/10 to-blue-900/20 backdrop-blur-xl border-r border-purple-500/20 z-40 hidden md:block">
      <div className="flex flex-col h-full p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Decentralized Blog
          </Link>
        </motion.div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))
            
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={item.path}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                    'hover:bg-purple-500/20 hover:border-purple-400/50',
                    isActive
                      ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30 border border-purple-400/50 shadow-lg shadow-purple-500/20'
                      : 'border border-transparent'
                  )}
                >
                  <Icon className={cn(
                    'w-5 h-5',
                    isActive ? 'text-purple-300' : 'text-gray-400'
                  )} />
                  <span className={cn(
                    'font-medium',
                    isActive ? 'text-purple-200' : 'text-gray-300'
                  )}>
                    {item.label}
                  </span>
                </Link>
              </motion.div>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

