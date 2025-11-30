import { NextResponse } from 'next/server'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { AnchorProvider } from '@coral-xyz/anchor'
import { getCounterProgram, getCounterProgramId } from '@project/anchor'
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader.split(' ')[1] !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'
    const connection = new Connection(rpcUrl, {
      commitment: 'confirmed',
      // Disable WebSocket to prevent subscription errors
      wsEndpoint: undefined,
    })

    const privateKeyArray = JSON.parse(process.env.CRON_WALLET_PRIVATE_KEY || '[]')
    if (!privateKeyArray.length) {
      throw new Error('CRON_WALLET_PRIVATE_KEY not configured')
    }
    const cronKeypair = Keypair.fromSecretKey(new Uint8Array(privateKeyArray))
    const wallet = new NodeWallet(cronKeypair)

    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
      skipPreflight: false,
    })
    const programId = getCounterProgramId('devnet')
    const program = getCounterProgram(provider, programId)

    const [weeklyPoolPda] = PublicKey.findProgramAddressSync([Buffer.from('weekly_pool_data')], programId)
    const poolData = await program.account.weeklyPool.fetch(weeklyPoolPda)

    const now = Math.floor(Date.now() / 1000)
    const cooldownSeconds = 7 * 24 * 60 * 60
    const timeSinceLastSpin = now - Number(poolData.lastSpinTimestamp)

    if (timeSinceLastSpin < cooldownSeconds) {
      console.log('Cooldown active')
      return NextResponse.json({
        message: 'Cooldown active',
        nextDrawIn: cooldownSeconds - timeSinceLastSpin,
        lastSpinTimestamp: Number(poolData.lastSpinTimestamp),
      })
    }

    if (Number(poolData.totalEntries) === 0) {
      console.log('No entries in pool')
      return NextResponse.json({
        message: 'No entries in pool',
        totalEntries: 0,
      })
    }

    const allBlogs = await program.account.blogEntryState.all()
    if (allBlogs.length === 0) {
      console.log('No blog entries found')
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
      .rpc({
        commitment: 'confirmed',
        skipPreflight: false,
      })

    // Poll for confirmation instead of using WebSocket subscription
    let confirmed = false
    let attempts = 0
    const maxAttempts = 30 // 30 seconds timeout

    while (!confirmed && attempts < maxAttempts) {
      attempts++
      try {
        const status = await connection.getSignatureStatus(signature)
        if (status?.value?.confirmationStatus === 'confirmed' || status?.value?.confirmationStatus === 'finalized') {
          confirmed = true
          console.log('Transaction confirmed after', attempts, 'attempts')
          break
        }
      } catch (err) {
        console.log('Polling attempt', attempts, 'failed:', err)
      }

      // Wait 1 second before next attempt
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    if (!confirmed) {
      console.warn('Transaction sent but confirmation timed out:', signature)
    }

    console.log('Winner declared successfully:', signature)

    return NextResponse.json({
      success: true,
      signature,
      confirmed,
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
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: Math.floor(Date.now() / 1000),
      },
      { status: 500 },
    )
  }
}
