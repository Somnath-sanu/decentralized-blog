import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import type { BlogProgramAccount } from './types'

export function ensurePublicKey(value: PublicKey | string): PublicKey {
  if (value instanceof PublicKey) {
    return value
  }
  return new PublicKey(value)
}

export function normalizeLamports(value: number | BN | undefined | null): number {
  if (value == null) return 0
  if (typeof value === 'number') return value
  if (value instanceof BN) {
    return Number(value.toString())
  }
  if (typeof value === 'object' && 'toString' in value) {
    return Number((value as BN).toString())
  }
  return Number(value)
}

export function formatLamports(lamports: number, digits = 3): string {
  if (!lamports) return '0.000'
  return (lamports / LAMPORTS_PER_SOL).toFixed(digits)
}

export function getLotteryNumber(blog: BlogProgramAccount): number {
  return blog.account.randomNumber
}

export function formatLotteryNumber(num: number): string {
  return num.toString().padStart(5, '0')
}

export function getLotteryNumbersFromBlogs(blogs: BlogProgramAccount[]): number[] {
  return blogs.map(blog => getLotteryNumber(blog))
}

export function findBlogByLotteryNumber(blogs: BlogProgramAccount[], number: number): BlogProgramAccount | null {
  return blogs.find(blog => blog.account.randomNumber === number) || null
}

