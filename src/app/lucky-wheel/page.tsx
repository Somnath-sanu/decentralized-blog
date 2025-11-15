'use client'

import { useCounterProgram } from '@/components/counter/counter-data-access'
import type { BlogProgramAccount } from '@/components/lucky-wheel'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '@/components/solana/solana-provider'
import { motion } from 'framer-motion'
import { Gift, Trophy, Coins, Sparkles, Clock } from 'lucide-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'

const LuckyWheelGame = dynamic(() => import('@/components/lucky-wheel/lucky-wheel-game'), {
  ssr: false,
})

export default function LuckyWheelPage() {
  const { weeklyPool, accounts, declareWinner } = useCounterProgram()
  const { publicKey } = useWallet()
  const [winner, setWinner] = useState<BlogProgramAccount | null>(null)

  const poolData = weeklyPool.data?.account
  const blogs = (accounts.data ?? []) as BlogProgramAccount[]
  const prizePoolLamports = poolData ? Number(poolData.totalPool) : 0
  const totalPoolSOL = prizePoolLamports / LAMPORTS_PER_SOL
  const totalEntries = poolData ? Number(poolData.totalEntries) : 0
  const lastWinnerNumber = poolData ? Number(poolData.lastWinnerNumber) : null
  const lastSpinTimestamp = poolData ? Number(poolData.lastSpinTimestamp) : 0

  const cooldownPassed = useMemo(() => {
    const now = Math.floor(Date.now() / 1000)
    const cooldownSeconds = 7 * 24 * 60 * 60 // 7 days
    return now - lastSpinTimestamp >= cooldownSeconds
  }, [lastSpinTimestamp])

  if (!publicKey) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-purple-200">Connect Your Wallet</h2>
          <p className="text-gray-400">Please connect your Solana wallet to view the lucky wheel</p>
          <WalletButton />
        </div>
      </div>
    )
  }

  const handleDeclareWinner = async (blog: BlogProgramAccount) => {
    try {
      const signature = await declareWinner.mutateAsync(blog)
      setWinner(blog)
      return signature
    } catch (error) {
      console.error('Error declaring winner:', error)
      throw error
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-5xl font-bold my-4">
          Lucky Wheel
        </h1>
        <p className="text-gray-400 text-lg">Spin once a week to win the prize pool!</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border p-6 text-center shadow-lg"
        >
          <Coins className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-yellow-200 mb-2">
            {totalPoolSOL.toFixed(4)} SOL
          </h3>
          <p className="text-gray-400 text-sm">Prize Pool</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border p-6 text-center shadow-lg"
        >
          <Gift className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-blue-200 mb-2">{totalEntries}</h3>
          <p className="text-gray-400 text-sm">Total Entries</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border p-6 text-center shadow-lg"
        >
          <Trophy className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-200 mb-2">
            {lastWinnerNumber ? lastWinnerNumber.toString() : 'N/A'}
          </h3>
          <p className="text-gray-400 text-sm">Last Winner Number</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className={`backdrop-blur-xl rounded-xl border p-6 text-center ${
            cooldownPassed
              ? 'bg-linear-to-br from-green-500/20 to-emerald-500/20 border-green-500/30'
              : 'bg-linear-to-br from-red-500/20 to-pink-500/20 border-red-500/30'
          }`}
        >
          <Clock className={`w-12 h-12 mx-auto mb-4 ${cooldownPassed ? 'text-green-400' : 'text-red-400'}`} />
          <h3 className={`text-2xl font-bold mb-2 ${cooldownPassed ? 'text-green-200' : 'text-red-200'}`}>
            {cooldownPassed ? 'Ready' : 'Cooldown'}
          </h3>
          <p className="text-gray-400 text-sm">
            {cooldownPassed ? 'Spin available!' : 'Wait 7 days'}
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-linear-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl rounded-xl border border-slate-700/50 p-8"
      >
        <h2 className="text-2xl font-bold text-slate-100 mb-4 flex items-center gap-2">
          <Sparkles className="w-6 h-6" />
          How It Works
        </h2>
        <div className="space-y-4 text-gray-300">
          <p>
            Create blog posts and contribute SOL to the weekly prize pool. Each contribution gives you an entry.
          </p>
          <p>
            Once a week, spin the wheel to randomly select a winner from all blog entries. The winner takes 90% of the pool!
          </p>
          <p className="font-mono uppercase font-medium">
            More contributions = Better chances of winning!
          </p>
        </div>
      </motion.div>

      {(weeklyPool.isLoading || accounts.isLoading) && (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      )}

      {!weeklyPool.isLoading && blogs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-6"
        >
          <LuckyWheelGame
            blogs={blogs}
            prizePoolLamports={prizePoolLamports}
            onDeclareWinner={handleDeclareWinner}
            canDraw={cooldownPassed}
          />
        </motion.div>
      )}

      {blogs.length === 0 && !weeklyPool.isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <Gift className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Blog Entries Yet</h3>
          <p className="text-gray-500">Create some blog posts to start the lucky wheel!</p>
        </motion.div>
      )}

      {winner && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <div className="bg-linear-to-br from-indigo-600/90 to-pink-600/90 backdrop-blur-xl rounded-xl border border-white/20 p-8 text-center max-w-md mx-4">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold  mb-2">Winner!</h2>
            <p className=" mb-4">{winner.account.title}</p>
            <p className=" text-sm">Lucky Number: {winner.account.randomNumber}</p>
            <button
              onClick={() => setWinner(null)}
              className="mt-6 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-full  transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
