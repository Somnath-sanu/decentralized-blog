'use client'

import { useCounterProgram, useCounterProgramAccount } from '@/components/counter/counter-data-access'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '@/components/solana/solana-provider'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { PublicKey } from '@solana/web3.js'
import { ellipsify } from '@/lib/utils'
import { Calendar, User } from 'lucide-react'
import { format } from 'date-fns'

function BlogCard({ account }: { account: PublicKey }) {
  const { accountQuery } = useCounterProgramAccount({ account })
  const blogData = accountQuery.data

  if (!blogData) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-purple-500/20 p-6 animate-pulse">
        <div className="h-6 bg-purple-500/20 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-purple-500/20 rounded w-full mb-2"></div>
        <div className="h-4 bg-purple-500/20 rounded w-2/3"></div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="bg-white/5 backdrop-blur-xl rounded-xl border border-purple-500/20 p-6 hover:border-purple-400/50 transition-all duration-300 shadow-lg hover:shadow-purple-500/20"
    >
      <Link href={`/blogs/${account.toString()}`}>
        <h3 className="text-xl font-bold text-purple-200 mb-3 line-clamp-2">
          {blogData.title}
        </h3>
        <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span className="font-mono">{ellipsify(blogData.owner.toString())}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(Number(blogData.createdAt) * 1000), 'MMM d, yyyy')}</span>
          </div>
        </div>
        <p className="text-gray-300 text-sm line-clamp-3">
          View blog content...
        </p>
        <div className="mt-4 pt-4 border-t border-purple-500/20">
          <span className="text-xs text-purple-400 font-mono">
            {ellipsify(account.toString())}
          </span>
          <span className='ml-4 text-xs'>
            {blogData.randomNumber}
          </span>
        </div>
      </Link>
    </motion.div>
  )
}

export default function AllBlogsPage() {
  const { accounts } = useCounterProgram()
  const { publicKey } = useWallet()

  if (!publicKey) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-purple-200">Connect Your Wallet</h2>
          <p className="text-gray-400">Please connect your Solana wallet to view blogs</p>
          <WalletButton />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
          All Blogs
        </h1>
        <p className="text-gray-400">Discover decentralized blog posts from the community</p>
      </motion.div>

      {accounts.isLoading ? (
        <div className="flex justify-center items-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : accounts.data && accounts.data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.data.map((account) => (
            <BlogCard key={account.publicKey.toString()} account={account.publicKey} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">No blogs found. Be the first to create one!</p>
          <Link
            href="/blogs/create"
            className="mt-4 inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all"
          >
            Create Blog
          </Link>
        </div>
      )}
    </div>
  )
}

