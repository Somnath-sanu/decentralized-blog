'use client'

import { useParams } from 'next/navigation'
import { PublicKey } from '@solana/web3.js'
import { useCounterProgramAccount } from '@/components/counter/counter-data-access'
import { fetchFromIPFS } from '@/lib/pinata-client'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Calendar, User, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { ellipsify } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export default function BlogDetailPage() {
  const params = useParams()
  const accountAddress = params.id as string
  const account = new PublicKey(accountAddress)
  const { accountQuery } = useCounterProgramAccount({ account })

  const blogContent = useQuery({
    queryKey: ['blog-content', accountAddress],
    queryFn: async () => {
      if (!accountQuery.data?.ipfsHash) return null
      return fetchFromIPFS(accountQuery.data.ipfsHash)
    },
    enabled: !!accountQuery.data?.ipfsHash,
  })

  if (accountQuery.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!accountQuery.data) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-purple-200 mb-4">Blog Not Found</h2>
        <p className="text-gray-400 mb-6">The blog you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/blogs">
          <Button variant="outline">Back to Blogs</Button>
        </Link>
      </div>
    )
  }

  const blogData = accountQuery.data

  return (
    <div className="max-w-4xl mx-auto space-y-8 my-2">
      <Link href="/blogs">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Blogs
        </Button>
      </Link>

      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl rounded-xl border border-purple-500/20 p-8 mb-4"
      >
        <h1 className="text-4xl font-bold text-purple-200 mb-6">{blogData.title}</h1>

        <div className="flex items-center gap-6 text-sm text-gray-400 mb-8 pb-6 border-b border-purple-500/20">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="font-mono">{ellipsify(blogData.owner.toString())}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(Number(blogData.createdAt) * 1000), 'MMMM d, yyyy')}</span>
          </div>
        </div>

        {blogContent.isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : blogContent.data ? (
          <div
            className="prose prose-invert max-w-none text-gray-300"
            dangerouslySetInnerHTML={{ __html: blogContent.data.body }}
          />
        ) : (
          <p className="text-gray-400">Loading content from IPFS...</p>
        )}

        <div className="mt-8 pt-6 border-t border-purple-500/20">
          <p className="text-xs text-gray-500 font-mono">Account: {ellipsify(accountAddress,6)}</p>
          {/* <p className="text-xs text-gray-500 font-mono mt-1">IPFS Hash: {blogData.ipfsHash}</p> */}
        </div>
      </motion.article>
    </div>
  )
}
