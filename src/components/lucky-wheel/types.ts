import type { ProgramAccount } from '@coral-xyz/anchor'
import type { PublicKey } from '@solana/web3.js'
import type BN from 'bn.js'

export interface BlogEntryAccount {
  owner: PublicKey | string
  title: string
  ipfsHash: string
  randomNumber: number
  createdAt: number | BN
  tip: number | BN
}

export type BlogProgramAccount = ProgramAccount<BlogEntryAccount>

export type WinnerState = BlogProgramAccount & { txSignature?: string | null }

export interface LotteryGameProps {
  blogs: BlogProgramAccount[]
  prizePoolLamports?: number
  explorerCluster?: 'devnet' | 'mainnet-beta' | 'testnet' | string
  onDeclareWinner?: (blog: BlogProgramAccount) => Promise<string | void>
  canDraw?: boolean
}

export interface LotteryBall {
  number: number
  x: number
  y: number
  isHighlighted: boolean
}

