'use client'

import { useCounterProgram, useCounterProgramAccount } from '@/components/counter/counter-data-access'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '@/components/solana/solana-provider'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { ellipsify } from '@/lib/utils'
import { User, Search } from 'lucide-react'
import { format } from 'date-fns'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchFromIPFS } from '@/lib/pinata-client'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { getPinataGatewayUrl } from '@/lib/pinata'

const PLACEHOLDER_IMAGE = '/anime.jpeg'

function BlogCard({ account }: { account: PublicKey }) {
  const { accountQuery } = useCounterProgramAccount({ account })
  const blogData = accountQuery.data

  // Fetch blog content to get images
  const blogContent = useQuery({
    queryKey: ['blog-content', account.toBase58()],
    queryFn: async () => {
      if (!blogData?.ipfsHash) return null
      return fetchFromIPFS(blogData.ipfsHash)
    },
    enabled: !!blogData?.ipfsHash,
  })

  // Get first image from IPFS or use placeholder
  const articleImage = useMemo(() => {
    if (blogContent.data?.images && blogContent.data.images.length > 0) {
      const gatewayUrl = getPinataGatewayUrl()
      return `${gatewayUrl}/ipfs/${blogContent.data.images[0]}`
    }
    return PLACEHOLDER_IMAGE
  }, [blogContent.data])

  // Extract description from HTML body
  const description = useMemo(() => {
    if (!blogContent.data?.body) return 'Click to view the full blog post and its content.'
    if (typeof window === 'undefined') return 'Click to view the full blog post and its content.'
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = blogContent.data.body
    const text = tempDiv.textContent || tempDiv.innerText || ''
    return text.length > 150
      ? text.substring(0, 150) + '...'
      : text || 'Click to view the full blog post and its content.'
  }, [blogContent.data])

  const tipAmount = blogData ? Math.floor(Number(blogData.tip) / LAMPORTS_PER_SOL) : '0'

  if (accountQuery.isLoading || !blogData) {
    return <BlogCardSkeleton />
  }

  return (
    <Link href={`/blogs/${account.toBase58()}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8, scale: 1.02 }}
        className="rounded-xl overflow-hidden border border-gray-700 hover:border-blue-500/50 shadow-lg hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer"
      >
        <div className="relative w-full h-56 overflow-hidden">
          {blogContent.isLoading ? (
            <Skeleton className="w-full h-full bg-gray-700" />
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={articleImage}
                alt={blogData.title}
                key={blogData.ipfsHash}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
              <div className="absolute inset-0 " />

              <div className="absolute top-3 right-3 bg-linear-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                💰 {tipAmount} SOL
              </div>
            </>
          )}
        </div>

        <div className="p-6">
          <h3 className="text-xl font-bold mb-3 line-clamp-2 hover:text-blue-400 transition-colors">
            {blogData.title}
          </h3>
          <p className="text-sm text-gray-300 mb-4 line-clamp-1 leading-relaxed">{description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-3 h-3 " />
                </div>
                <span className="font-medium">{ellipsify(blogData.owner.toString(), 6)}</span>
              </div>
              <span className="text-gray-600">•</span>
              <span>{format(new Date(Number(blogData.createdAt) * 1000), 'MMM d')}</span>
            </div>
            <div className="flex items-center gap-2 gap-x-4 text-xs text-gray-500">
              <span className="text-muted-foreground">{Number(blogData.randomNumber)}</span>
              <span className="bg-gray-800 px-2 py-1 rounded-full">IPFS</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

export default function AllBlogsPage() {
  const { accounts } = useCounterProgram()
  const { publicKey } = useWallet()
  const [searchQuery, setSearchQuery] = useState('')

  // Filter blogs based on search and category
  const filteredBlogs = useMemo(() => {
    if (!accounts.data) return []

    let filtered = accounts.data

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((account) => {
        // This would need to fetch the blog data to search in content
        // For now, we'll just search in the account title
        return account.account.title.toLowerCase().includes(searchQuery.toLowerCase())
      })
    }

    return filtered
  }, [accounts.data, searchQuery])

  if (!publicKey) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6 p-8 rounded-xl border border-gray-800">
          <h2 className="text-3xl font-bold">Welcome to Sloogy</h2>
          <p className="text-gray-400 max-w-md">
            Connect your Solana wallet to dive into a world of community-driven content. Create, read, and own your
            posts on the blockchain and get chance to win prizes.
          </p>
          <WalletButton />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      {/* Title and Description */}
      <div className="mb-12 text-center">
        <div className="">
          <h1 className="text-3xl sm:text-5xl font-bold mb-6">Our Latest Thoughts</h1>
        </div>
        <p className="text-lg sm:text-xl text-gray-300 mb-4 max-w-4xl mx-auto leading-relaxed text-balance">
          Discover decentralized content from creators across the Solana ecosystem. Own your words, tip your favorites,
          and explore the future of blogging.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1 rounded-full">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            <span>On-chain content hashes</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1 rounded-full">
            <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
            <span>SOL tipping system</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1 rounded-full">
            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
            <span>Verifiable authorship</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-12 space-y-4">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 py-3  border-gray-700  placeholder:text-gray-400 focus:border-blue-500 rounded-full text-center shadow-lg"
          />
        </div>
      </div>

      {accounts.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <BlogCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredBlogs && filteredBlogs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBlogs.map((account) => (
            <BlogCard key={account.publicKey.toBase58()} account={account.publicKey} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 rounded-2xl border border-gray-700/50 backdrop-blur-sm">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 " />
            </div>
            <h3 className="text-3xl font-bold  mb-4">No Blogs Found</h3>
            <p className="text-gray-300 mb-8 leading-relaxed">
              {searchQuery
                ? 'Try adjusting your search query or explore different topics.'
                : 'Be the first to share your thoughts! Create an amazing blog post and inspire the community.'}
            </p>
            {!searchQuery && (
              <Link href="/blogs/create">
                <button className="hover:from-blue-700 hover:to-purple-700  font-semibold px-6 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl">
                  Create Your First Blog
                </button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Pagination - Placeholder for future implementation */}
      {/* {filteredBlogs && filteredBlogs.length > 0 && (
        <div className="mt-12 flex justify-center items-center gap-2">
          <button className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:  border border-gray-800 hover:border-gray-700">
            Previous
          </button>
          <button className="px-4 py-2 rounded-lg text-sm  bg-blue-500/20 border border-blue-500/30">
            1
          </button>
          <button className="px-4 py-2 rounded-lg text-sm text-gray-400 hover: border border-gray-800 hover:border-gray-700">
            2
          </button>
          <button className="px-4 py-2 rounded-lg text-sm text-gray-400   border border-gray-800 hover:border-gray-700">
            3
          </button>
          <span className="px-2 text-gray-500">...</span>
          <button className="px-4 py-2 rounded-lg text-sm text-gray-400   border border-gray-800 hover:border-gray-700">
            8
          </button>
          <button className="px-4 py-2 rounded-lg text-sm text-blue-400 hover:text-blue-300  border border-gray-800 hover:border-gray-700">
            Next
          </button>
        </div>
      )} */}
    </div>
  )
}

function BlogCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-700 shadow-lg">
      <Skeleton className="w-full h-56 bg-gray-700" />
      <div className="p-6">
        <Skeleton className="h-6 w-3/4 bg-gray-700 mb-3" />
        <Skeleton className="h-4 w-full bg-gray-700 mb-2" />
        <Skeleton className="h-4 w-2/3 bg-gray-700 mb-4" />
        <Skeleton className="h-4 w-1/2 bg-gray-700" />
      </div>
    </div>
  )
}
