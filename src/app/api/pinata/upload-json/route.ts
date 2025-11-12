import { NextRequest, NextResponse } from 'next/server'
import { pinata } from '@/lib/pinata'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Upload JSON using Pinata SDK v2 with metadata
    const result = await pinata.upload.public
      .json(body)
      .name('blog-content')

    // Return response in format expected by client (with IpfsHash for backward compatibility)
    return NextResponse.json({
      IpfsHash: result.cid,
      PinSize: result.size,
      Timestamp: new Date().toISOString(),
      // Also include new fields
      id: result.id,
      name: result.name,
      cid: result.cid,
      size: result.size,
    })
  } catch (error) {
    console.error('Pinata JSON upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}

