'use client'

import { getCounterProgram, getCounterProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../use-transaction-toast'
import { toast } from 'sonner'
import { BN } from 'bn.js'
import type { BlogProgramAccount } from '../lucky-wheel'

interface CreateEntryArgs {
  title: string
  ipfsHash: string
  poolContribution: number
}

export function useCounterProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getCounterProgramId('devnet'), [cluster])
  const program = useMemo(() => getCounterProgram(provider, programId), [provider, programId])
  const queryClient = useQueryClient()

  console.log('programId', programId.toBase58())

  const accounts = useQuery({
    queryKey: ['blogEntry', 'all', { cluster }],
    queryFn: () => program.account.blogEntryState.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const weeklyPool = useQuery({
    queryKey: ['weekly-pool', { cluster }],
    queryFn: async () => {
      const [weeklyPoolPda] = PublicKey.findProgramAddressSync([Buffer.from('weekly_pool_data')], programId)
      try {
        const account = await program.account.weeklyPool.fetch(weeklyPoolPda)
        return { account, publicKey: weeklyPoolPda }
      } catch {
        // Pool might not be initialized yet
        return null
      }
    },
  })

  const createEntry = useMutation<string, Error, CreateEntryArgs>({
    mutationKey: [`blogEntry`, `create`, { cluster }],
    mutationFn: async ({ title, ipfsHash, poolContribution }) => {
      const [weeklyPoolPDA] = PublicKey.findProgramAddressSync([Buffer.from('weekly_pool_data')], program.programId)
      const info = await connection.getAccountInfo(weeklyPoolPDA)

      const blogSeeds = [Buffer.from(title), provider.wallet.publicKey.toBuffer()]
      const [blogPda] = PublicKey.findProgramAddressSync(blogSeeds, program.programId)

      if (title.length > 50) {
        throw new Error('Title must be at most 50 characters long')
      }

      const isBlogTitleAlredyInUse = !!(await connection.getAccountInfo(blogPda))

      if (isBlogTitleAlredyInUse) {
        throw new Error('Blog title already in use by this wallet')
      }

      if (!info) {
        try {
          await program.methods.initializePool().rpc()
        } catch (error) {
          console.log(error)
          toast.warning('Pool account already exists')
        }
      }

      return program.methods.createBlogEntry(title, ipfsHash, new BN(poolContribution)).rpc()

      /**
       * program.methods.createBlogEntry(title, ipfsHash, new BN(poolContribution)).rpc() 
       * 
       * IS SAME AS
       * 
      const [weeklyPool] = PublicKey.findProgramAddressSync([Buffer.from("weekly_pool")], program.programId)

    return await program.methods
      .createBlogEntry(title, ipfsHash, new anchor.BN(poolContribution))
      .accounts({
        blogEntry: PublicKey.findProgramAddressSync(
          [Buffer.from("blog"), Buffer.from(title), provider.wallet.publicKey.toBuffer()],
          program.programId
        )[0],
        weeklyPool,
        owner: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc()
  },

       */
    },
    onSuccess(signatute) {
      transactionToast(signatute)
      accounts.refetch()
      queryClient.invalidateQueries({ queryKey: ['blogEntry', 'all', { cluster }] })
      queryClient.invalidateQueries({
        queryKey: ['weekly-pool', { cluster }],
      })
    },
    onError(error) {
      console.log(error)
      toast.error(`Error creating entry : ${error.message}`)
    },
  })

  const declareWinner = useMutation<string, Error, BlogProgramAccount>({
    mutationKey: [`declareWinner`, { cluster }],
    mutationFn: async (blog: BlogProgramAccount) => {
      const [weeklyPoolPda] = PublicKey.findProgramAddressSync([Buffer.from('weekly_pool_data')], program.programId)
      const poolData = await weeklyPool.refetch()

      const creatorWallet = poolData.data?.account.creator
      if (!creatorWallet) {
        throw new Error('Creator wallet not found')
      }

      return program.methods
        .declareWinner()
        .accounts({
          winnerBlog: blog.publicKey,
          winner: blog.account.owner,
          creatorWallet: creatorWallet,
        })
        .rpc()
    },
    onSuccess(signature) {
      transactionToast(signature)
      weeklyPool.refetch()
      accounts.refetch()
    },
    onError(error) {
      toast.error(`Error declaring winner: ${error.message}`)
    },
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    createEntry,
    declareWinner,
    weeklyPool,
  }
}

export function useCounterProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const { program, accounts } = useCounterProgram()

  const accountQuery = useQuery({
    queryKey: ['blogEntry', 'fetch', { cluster, account }],
    queryFn: () => program.account.blogEntryState.fetch(account),
  })

  // const updateEntry = useMutation<string, Error, CreateEntryArgs>({
  //   mutationKey: ['blogEntry', 'update', { cluster }],
  //   mutationFn: async ({ title, message }) => {
  //     return await program.methods.updateBlogEntry(title, message).rpc()
  //   },
  //   onSuccess(signatute) {
  //     transactionToast(signatute)
  //     accounts.refetch()
  //   },
  //   onError(error) {
  //     toast.error(`Error updating entry : ${error.message}`)
  //   },
  // })

  // const deleteEntry = useMutation({
  //   mutationKey: ['blogEntry', 'delete', { cluster }],
  //   mutationFn: async (title: string) => {
  //     return await program.methods.deleteBlogEntry(title).rpc()
  //   },
  //   onSuccess(signatute) {
  //     transactionToast(signatute)
  //     accounts.refetch()
  //   },
  //   onError(error) {
  //     toast.error(`Error deleting entry : ${error.message}`)
  //   },
  // })

  return {
    accountQuery,
  }
}
