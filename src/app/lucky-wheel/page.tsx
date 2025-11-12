'use client'

import { useCounterProgram } from '@/components/counter/counter-data-access'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '@/components/solana/solana-provider'
import { motion } from 'framer-motion'
import { Gift, Trophy, Coins } from 'lucide-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'

export default function LuckyWheelPage() {
  const { weeklyPool } = useCounterProgram()
  const { publicKey } = useWallet()

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

  const poolData = weeklyPool.data?.account
  const totalPoolSOL = poolData ? Number(poolData.totalPool) / LAMPORTS_PER_SOL : 0
  const totalEntries = poolData ? Number(poolData.totalEntries) : 0
  const lastWinnerNumber = poolData ? Number(poolData.lastWinnerNumber) : null

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
          Lucky Wheel
        </h1>
        <p className="text-gray-400">Weekly prize pool for blog contributors</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 backdrop-blur-xl rounded-xl border border-purple-500/20 p-6 text-center"
        >
          <Coins className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-purple-200 mb-2">
            {totalPoolSOL.toFixed(4)} SOL
          </h3>
          <p className="text-gray-400 text-sm">Total Pool</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl rounded-xl border border-purple-500/20 p-6 text-center"
        >
          <Gift className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-purple-200 mb-2">{totalEntries}</h3>
          <p className="text-gray-400 text-sm">Total Entries</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl rounded-xl border border-purple-500/20 p-6 text-center"
        >
          <Trophy className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-purple-200 mb-2">
            {lastWinnerNumber ? lastWinnerNumber.toString() : 'N/A'}
          </h3>
          <p className="text-gray-400 text-sm">Last Winner Number</p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl rounded-xl border border-purple-500/20 p-8"
      >
        <h2 className="text-2xl font-bold text-purple-200 mb-4">How It Works</h2>
        <div className="space-y-4 text-gray-300">
          <p>
            When you create a blog post, you can contribute SOL to the weekly pool. Each contribution
            gives you a random number entry.
          </p>
          <p>
            At the end of each week, a winner is selected based on a lucky number. The winner receives
            90% of the pool, while 10% goes to the platform.
          </p>
          <p className="text-purple-300 font-medium">
            The more you contribute, the better your chances of winning!
          </p>
        </div>
      </motion.div>

      {weeklyPool.isLoading && (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      )}
    </div>
  )
}

