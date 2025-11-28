'use client'

import { getPinataGatewayUrl } from "./pinata"

/**
 * Client-side Pinata utilities for uploading blog content and images
 */

export interface PinataUploadResponse {
  IpfsHash: string // Legacy field for backward compatibility
  PinSize: number
  Timestamp: string
  // New v2 SDK response fields
  id?: string
  name?: string
  cid?: string
  size?: number
}

export interface BlogContent {
  body: string
  images?: string[] // Array of IPFS hashes for images
}

/**
 * Upload a file (image) to Pinata
 */
export async function uploadFileToPinata(file: File , pubKey: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('publicKey' , pubKey)

  const response = await fetch('/api/pinata/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to upload file: ${error}`)
  }

  const data: PinataUploadResponse = await response.json()
  return data.IpfsHash
}

/**
 * Upload blog content (body + images) to Pinata as JSON
 */
export async function uploadBlogContentToPinata(content: BlogContent, pubKey: string): Promise<string> {
  const response = await fetch('/api/pinata/upload-json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content,
      publicKey: pubKey,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to upload blog content: ${error}`)
  }

  const data: PinataUploadResponse = await response.json()
  return data.IpfsHash
}

/**
 * Fetch content from IPFS using Pinata gateway
 */
export async function fetchFromIPFS(ipfsHash: string): Promise<BlogContent> {
  // Support both custom gateway and default Pinata gateway
  const gatewayUrl = getPinataGatewayUrl()

  const url = `${gatewayUrl}/ipfs/${ipfsHash}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch from IPFS: ${response.statusText}`)
  }

  return response.json()
}
