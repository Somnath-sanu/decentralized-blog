'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useGetBalance } from './account/account-data-access'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Wallet } from 'lucide-react'

export function WalletBalance() {
  const { publicKey } = useWallet()
  
  if (!publicKey) return null

  const { data: balance } = useGetBalance({ address: publicKey })
  const solBalance = balance ? (balance / LAMPORTS_PER_SOL).toFixed(4) : '0.0000'

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-lg border border-purple-500/20">
      <Wallet className="w-4 h-4 text-purple-300" />
      <span className="text-sm font-medium text-purple-200">
        {solBalance} SOL
      </span>
    </div>
  )
}

