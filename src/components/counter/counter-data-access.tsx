'use client'

import { getCounterProgram, getCounterProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey, SystemProgram } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../use-transaction-toast'
import { toast } from 'sonner'
import { BN } from 'bn.js'

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

  const accounts = useQuery({
    queryKey: ['counter', 'all', { cluster }],
    queryFn: () => program.account.blogEntryState.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  // Fetch weekly pool account
  const weeklyPool = useQuery({
    queryKey: ['weekly-pool', { cluster }],
    queryFn: async () => {
      const [weeklyPoolPda] = PublicKey.findProgramAddressSync([Buffer.from('weekly_pool')], programId)
      try {
        const account = await program.account.weeklyPool.fetch(weeklyPoolPda)
        return { account, publicKey: weeklyPoolPda }
      } catch (error) {
        // Pool might not be initialized yet
        return null
      }
    },
  })

  const createEntry = useMutation<string, Error, CreateEntryArgs>({
    mutationKey: [`blogEntry`, `create`, { cluster }],
    mutationFn: async ({ title, ipfsHash, poolContribution }) => {
      const [weeklyPoolPDA] = PublicKey.findProgramAddressSync([Buffer.from('weekly_pool')], program.programId)
      const info = await connection.getAccountInfo(weeklyPoolPDA)

    if (!info) {
      try {
        await program.methods.initializePool().rpc()
      } catch {
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
    },
    onError(error) {
      toast.error(`Error creating entry : ${error.message}`)
    },
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    createEntry,
    weeklyPool,
  }
}

export function useCounterProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useCounterProgram()

  const accountQuery = useQuery({
    queryKey: ['counter', 'fetch', { cluster, account }],
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
