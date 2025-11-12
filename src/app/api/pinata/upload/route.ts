import { NextRequest, NextResponse } from 'next/server'
import { pinata } from '@/lib/pinata'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const publicKey = formData.get('publicKey') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Upload file using Pinata SDK v2
    // Use keyvalues to store publicKey instead of group (group requires UUID)
    const result = await pinata.upload.public.file(file).keyvalues({ publicKey: publicKey || 'unknown' })

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
    console.error('Pinata upload error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Upload failed' }, { status: 500 })
  }
}
