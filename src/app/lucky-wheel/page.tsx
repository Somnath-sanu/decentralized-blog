'use client'

import { useCounterProgram } from '@/components/counter/counter-data-access'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '@/components/solana/solana-provider'
import { motion } from 'framer-motion'
import { Gift, Trophy, Coins, Clock, Zap, Calendar } from 'lucide-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useMemo } from 'react'

export default function LuckyWheelPage() {
  const { weeklyPool, accounts } = useCounterProgram()
  const { publicKey } = useWallet()

  const poolData = weeklyPool.data?.account
  const blogs = accounts.data ?? []
  const prizePoolLamports = poolData ? Number(poolData.totalPool) : 0
  const totalPoolSOL = prizePoolLamports / LAMPORTS_PER_SOL
  const totalEntries = poolData ? Number(poolData.totalEntries) : 0
  const lastWinnerNumber = poolData ? Number(poolData.lastWinnerNumber) : null
  const lastSpinTimestamp = poolData ? Number(poolData.lastSpinTimestamp) : 0

  const { cooldownPassed, timeRemaining, nextDrawDate } = useMemo(() => {
    const now = Math.floor(Date.now() / 1000)
    const cooldownSeconds = 7 * 24 * 60 * 60 // 7 days
    const timeSinceLastSpin = now - lastSpinTimestamp
    const passed = timeSinceLastSpin >= cooldownSeconds
    const remaining = passed ? 0 : cooldownSeconds - timeSinceLastSpin
    const nextDraw = new Date((lastSpinTimestamp + cooldownSeconds) * 1000)

    return {
      cooldownPassed: passed,
      timeRemaining: remaining,
      nextDrawDate: nextDraw,
    }
  }, [lastSpinTimestamp])

  const formatTimeRemaining = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60))
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
    const minutes = Math.floor((seconds % (60 * 60)) / 60)

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

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

  return (
    <div className="max-w-6xl mx-auto space-y-8 mb-10 px-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-3xl sm:text-5xl font-bold my-4">Lucky Wheel</h1>
        <p className="text-gray-400 text-lg">Automated weekly draws - No manual interaction needed!</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-xl border p-6 text-center ${
          cooldownPassed && totalEntries > 0
            ? 'bg-linear-to-br from-green-500/20 to-emerald-500/20 border-green-500/30'
            : 'bg-linear-to-br from-blue-500/20 to-indigo-500/20 border-blue-500/30'
        }`}
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <Zap className={`w-8 h-8 ${cooldownPassed && totalEntries > 0 ? 'text-green-400' : 'text-blue-400'}`} />
          <h2 className="text-2xl font-bold">
            {cooldownPassed && totalEntries > 0 ? 'Draw Ready!' : 'Automated Draw System'}
          </h2>
        </div>
        <p className="text-gray-300 mb-4">
          {cooldownPassed && totalEntries > 0
            ? 'The next automated draw will happen within the hour!'
            : lastSpinTimestamp === 0
              ? 'Waiting for first entries to start the weekly draw cycle'
              : `Next draw in ${formatTimeRemaining(timeRemaining)}`}
        </p>
        {!cooldownPassed && lastSpinTimestamp > 0 && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Next Draw: {nextDrawDate.toLocaleString()}</span>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border p-6 text-center shadow-lg"
        >
          <Coins className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-yellow-200 mb-2">{totalPoolSOL.toFixed(4)} SOL</h3>
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
          <p className="text-gray-400 text-sm">
            Total Entries <span className="text-blue-200">This week</span>
          </p>
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
              : 'bg-linear-to-br from-orange-500/20 to-red-500/20 border-orange-500/30'
          }`}
        >
          <Clock className={`w-12 h-12 mx-auto mb-4 ${cooldownPassed ? 'text-green-400' : 'text-orange-400'}`} />
          <h3 className={`text-2xl font-bold mb-2 ${cooldownPassed ? 'text-green-200' : 'text-orange-200'}`}>
            {cooldownPassed ? 'Ready' : formatTimeRemaining(timeRemaining)}
          </h3>
          <p className="text-gray-400 text-sm">{cooldownPassed ? 'Awaiting cron' : 'Until next draw'}</p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-linear-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl rounded-xl border border-slate-700/50 p-8"
      >
        <h2 className="text-2xl font-bold text-slate-100 mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-400" />
          How Automated Draws Work
        </h2>
        <div className="space-y-4 text-gray-300">
          <p>🎯 Create blog posts and contribute SOL to the weekly prize pool. Each contribution gives you an entry.</p>
          <p>⚡ Every hour, our automated system checks if 7 days have passed since the last draw.</p>
          <p>
            🎊 When the cooldown expires and there are entries, a winner is automatically selected and receives 90% of
            the pool!
          </p>
          <p className="font-mono uppercase font-medium text-yellow-300">
            More contributions = Better chances of winning!
          </p>
        </div>
      </motion.div>

      {(weeklyPool.isLoading || accounts.isLoading) && (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      )}

      {blogs.length === 0 && !weeklyPool.isLoading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
          <Gift className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Blog Entries Yet</h3>
          <p className="text-gray-500">Create some blog posts to start the lucky wheel!</p>
        </motion.div>
      )}
    </div>
  )
}
