import { NextResponse } from 'next/server'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { getCounterProgram, getCounterProgramId } from '@project/anchor'
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet'

// This endpoint will be called by Vercel Cron
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/declare-winner", "schedule": "0 * * * *" }] }

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'
    const connection = new Connection(rpcUrl, 'confirmed')

    const privateKeyArray = JSON.parse(process.env.CRON_WALLET_PRIVATE_KEY || '[]')
    if (!privateKeyArray.length) {
      throw new Error('CRON_WALLET_PRIVATE_KEY not configured')
    }
    const cronKeypair = Keypair.fromSecretKey(new Uint8Array(privateKeyArray))
    const wallet = new NodeWallet(cronKeypair)

    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' })
    const programId = getCounterProgramId('devnet')
    const program = getCounterProgram(provider, programId)

    const [weeklyPoolPda] = PublicKey.findProgramAddressSync([Buffer.from('weekly_pool')], programId)
    const poolData = await program.account.weeklyPool.fetch(weeklyPoolPda)

    const now = Math.floor(Date.now() / 1000)
    const cooldownSeconds = 7 * 24 * 60 * 60
    const timeSinceLastSpin = now - Number(poolData.lastSpinTimestamp)

    if (timeSinceLastSpin < cooldownSeconds) {
      return NextResponse.json({
        message: 'Cooldown active',
        nextDrawIn: cooldownSeconds - timeSinceLastSpin,
        lastSpinTimestamp: Number(poolData.lastSpinTimestamp),
      })
    }

    if (Number(poolData.totalEntries) === 0) {
      return NextResponse.json({
        message: 'No entries in pool',
        totalEntries: 0,
      })
    }

    const allBlogs = await program.account.blogEntryState.all()
    if (allBlogs.length === 0) {
      return NextResponse.json({
        message: 'No blog entries found',
        totalEntries: 0,
      })
    }

    // Select random winner
    const randomIndex = Math.floor(Math.random() * allBlogs.length)
    const winnerBlog = allBlogs[randomIndex]

    console.log('Selected winner:', {
      title: winnerBlog.account.title,
      owner: winnerBlog.account.owner.toBase58(),
      randomNumber: winnerBlog.account.randomNumber,
    })

    // Call declare_winner
    const signature = await program.methods
      .declareWinner()
      .accounts({
        winnerBlog: winnerBlog.publicKey,
        winner: winnerBlog.account.owner,
        creatorWallet: poolData.creator,
      })
      .rpc()

    console.log('Winner declared successfully:', signature)

    return NextResponse.json({
      success: true,
      signature,
      winner: {
        title: winnerBlog.account.title,
        owner: winnerBlog.account.owner.toBase58(),
        randomNumber: winnerBlog.account.randomNumber,
      },
      prizePool: Number(poolData.totalPool),
      timestamp: now,
    })
  } catch (error) {
    console.error('Error in declare-winner cron:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Math.floor(Date.now() / 1000),
      },
      { status: 500 },
    )
  }
}

// Allow manual testing in development
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Only available in development' }, { status: 403 })
  }
  return GET(request)
}
