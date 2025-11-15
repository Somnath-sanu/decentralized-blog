import React from 'react'
import Link from 'next/link'

export function AppFooter() {
  return (
    <footer className="px-8 py-6 bg-[#1a1f2e] border-t border-gray-800">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <p className="text-sm text-gray-400">© 2025 Ink & Ideas</p>
        <div className="flex items-center gap-6">
          <Link href="/blogs" className="text-sm text-gray-400 hover:text-white transition-colors">
            RSS
          </Link>
          <Link href="/blogs" className="text-sm text-gray-400 hover:text-white transition-colors">
            Privacy
          </Link>
          <Link href="/blogs" className="text-sm text-gray-400 hover:text-white transition-colors">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  )
}
