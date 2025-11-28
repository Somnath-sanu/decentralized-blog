'server only'

import { PinataSDK } from 'pinata'

export const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL || 'gateway.pinata.cloud',
})

export const getPinataGatewayUrl = (): string => {
  return process.env.NEXT_PUBLIC_GATEWAY_URL
    ? process.env.NEXT_PUBLIC_GATEWAY_URL.startsWith('http')
      ? process.env.NEXT_PUBLIC_GATEWAY_URL
      : `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}`
    : 'https://gateway.pinata.cloud'
}
