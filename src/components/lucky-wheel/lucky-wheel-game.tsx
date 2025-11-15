'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useMemo, useRef, useState } from 'react'
import type { BlogProgramAccount, LotteryGameProps, WinnerState } from './types'
import { LOTTERY_ANIMATION_DURATION, LOTTERY_BALL_DROP_DURATION } from './constants'
import {
  ensurePublicKey,
  formatLamports,
  formatLotteryNumber,
  getLotteryNumbersFromBlogs,
  findBlogByLotteryNumber,
} from './utils'
import { Button } from '../ui/button'

type DeclareWinnerFn = (blog: BlogProgramAccount) => Promise<string | void> | void

export function LuckyWheelGame({
  blogs,
  prizePoolLamports = 0,
  explorerCluster = 'devnet',
  onDeclareWinner,
  canDraw = true,
}: LotteryGameProps) {
  const availableBlogs = useMemo(() => blogs ?? [], [blogs])

  const [winner, setWinner] = useState<WinnerState | null>(null)
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null)
  const [showBall, setShowBall] = useState(false)

  const declareWinnerRef = useRef<DeclareWinnerFn | undefined>(onDeclareWinner)
  declareWinnerRef.current = onDeclareWinner

  const lotteryNumbers = useMemo(() => getLotteryNumbersFromBlogs(availableBlogs), [availableBlogs])

  const handleWinnerDeclaration = useCallback(async (blog: BlogProgramAccount) => {
    const declareFn = declareWinnerRef.current
    if (!declareFn) return undefined
    return await declareFn(blog)
  }, [])

  const handleDraw = useCallback(async () => {
    if (!availableBlogs.length || isDrawing || !canDraw) {
      return
    }

    setErrorMessage(null)
    setIsDrawing(true)
    setSelectedNumber(null)
    setShowBall(false)
    setWinner(null)
    setTxSignature(null)

    // Select random number from the pool
    const randomIndex = Math.floor(Math.random() * lotteryNumbers.length)
    const winningNumber = lotteryNumbers[randomIndex]
    const winningBlog = findBlogByLotteryNumber(availableBlogs, winningNumber)

    if (!winningBlog) {
      setErrorMessage('Error: Could not find blog with selected number')
      setIsDrawing(false)
      return
    }

    try {
      // Animation sequence
      setTimeout(() => setShowBall(true), 500)

      setTimeout(() => {
        setSelectedNumber(winningNumber)
      }, LOTTERY_BALL_DROP_DURATION)

      setTimeout(async () => {
        const selectedWinner: WinnerState = { ...winningBlog }
        setWinner(selectedWinner)

        try {
          const signature = await handleWinnerDeclaration(winningBlog)
          setTxSignature(signature ?? null)
          setWinner((prev) => (prev ? { ...prev, txSignature: signature ?? null } : prev))
        } catch (declareError) {
          const message = declareError instanceof Error ? declareError.message : 'Failed to declare winner on-chain.'
          setErrorMessage(message)
        }
      }, LOTTERY_ANIMATION_DURATION)

      setTimeout(() => {
        setIsDrawing(false)
      }, LOTTERY_ANIMATION_DURATION + 500)
    } catch (drawError) {
      const message = drawError instanceof Error ? drawError.message : 'Draw failed. Please try again.'
      setErrorMessage(message)
      setIsDrawing(false)
    }
  }, [availableBlogs, canDraw, handleWinnerDeclaration, isDrawing, lotteryNumbers])

  const resetState = useCallback(() => {
    setWinner(null)
    setErrorMessage(null)
    setTxSignature(null)
    setSelectedNumber(null)
    setShowBall(false)
  }, [])

  return (
    <div className="relative w-full">
      <div className="rounded-3xl border border-white/10 bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 p-6 shadow-2xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-100">Weekly Lottery Draw</h2>
            <p className="text-sm text-slate-400">Draw a random number from the pool to select a winner!</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/60 px-4 py-2">
            <span className="text-sm text-slate-400">Numbers</span>
            <span className="text-lg font-semibold text-slate-100">{lotteryNumbers.length}</span>
          </div>
        </div>

        <div className="relative mb-6">
          {/* Lottery Number Grid */}
          <div className="grid grid-cols-8 md:grid-cols-10 gap-2 mb-4">
            {lotteryNumbers.map((number, index) => (
              <motion.div
                key={number}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.02 }}
                className={`aspect-square rounded-lg border-2 flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  selectedNumber === number
                    ? 'bg-linear-to-br from-yellow-400 to-orange-500 border-yellow-300 text-black shadow-lg shadow-yellow-500/50 scale-110'
                    : 'bg-slate-800/50 border-slate-600 text-slate-300 hover:border-slate-500'
                }`}
              >
                {formatLotteryNumber(number)}
              </motion.div>
            ))}
          </div>

          {/* Lottery Ball Animation */}
          <AnimatePresence>
            {showBall && (
              <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute top-4 left-1/2 transform -translate-x-1/2"
              >
                <div className="w-16 h-16 rounded-full bg-linear-to-br from-yellow-400 via-orange-500 to-red-500 shadow-2xl flex items-center justify-center text-black font-bold text-lg border-4 border-white">
                  {selectedNumber ? formatLotteryNumber(selectedNumber) : '?'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-3">
            <Button type="button" onClick={handleDraw} disabled={isDrawing || !lotteryNumbers.length || !canDraw}>
              {isDrawing ? 'Drawing...' : winner ? 'Draw Again' : 'Draw Winner!'}
            </Button>
            {winner && (
              <button
                type="button"
                onClick={resetState}
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              >
                Reset
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-emerald-200">
              Pool: {formatLamports(prizePoolLamports, 3)} SOL
            </span>
            {txSignature && (
              <a
                className="rounded-full border border-indigo-400/40 bg-indigo-500/10 px-3 py-1 text-indigo-200 transition hover:border-indigo-300/60"
                href={`https://explorer.solana.com/tx/${txSignature}?cluster=${explorerCluster}`}
                target="_blank"
                rel="noreferrer"
              >
                View transaction
              </a>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {errorMessage}
          </div>
        )}

        {!canDraw && !isDrawing && (
          <div className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
            Weekly draw cooldown active. Please wait 7 days between draws.
          </div>
        )}
      </div>

      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 110, damping: 18 }}
            className="pointer-events-auto absolute inset-x-0 -bottom-6 mx-auto w-full max-w-xl rounded-3xl border border-white/25 bg-slate-900/90 p-6 text-center shadow-xl backdrop-blur"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05, type: 'spring', stiffness: 160 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/20 text-emerald-200"
            >
              🎉
            </motion.div>
            <h3 className="text-xl font-semibold text-slate-100">Winner: {winner.account.title}</h3>
            <p className="mt-2 text-sm text-slate-300">
              Winning Number:{' '}
              <span className="font-semibold text-emerald-300">{formatLotteryNumber(winner.account.randomNumber)}</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">Owner: {ensurePublicKey(winner.account.owner).toBase58()}</p>
            {winner.txSignature && (
              <p className="mt-3 text-xs text-indigo-300">
                Transaction:{' '}
                <a
                  className="underline transition hover:text-indigo-200"
                  href={`https://explorer.solana.com/tx/${winner.txSignature}?cluster=${explorerCluster}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {winner.txSignature.slice(0, 8)}...
                  {winner.txSignature.slice(-8)}
                </a>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LuckyWheelGame
