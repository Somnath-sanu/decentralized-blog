import type { Metadata } from 'next'
import './globals.css'
import { AppProviders } from '@/components/app-providers'
import { AppLayout } from '@/components/app-layout'
import React from 'react'
import { Provider } from 'jotai'
import { Dancing_Script, Oxanium } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'

const siteConfig = {
  name: 'Sloogy',
  title: 'Sloogy - Decentralized Blogging on Solana Blockchain',
  description:
    'Create, share, and own your blog posts on the Solana blockchain. Join our decentralized blogging platform with automated weekly prize draws. Write content, earn rewards, and be part of the Web3 revolution.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://sloogy.vercel.app',
  ogImage: '/og-image.png',
  keywords: [
    'Solana',
    'blockchain blogging',
    'decentralized blog',
    'Web3 content',
    'crypto blogging',
    'IPFS storage',
    'NFT content',
    'Solana dApp',
    'blockchain rewards',
    'decentralized publishing',
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: 'Somnath' }],
  creator: 'Somnath',
  publisher: 'Somnath',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: 'Sloogy - Decentralized Blogging Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: '@somnath',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

const links: { label: string; path: string }[] = [
  { label: 'Home', path: '/' },
  { label: 'Account', path: '/account' },
]

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-dancing-script',
  display: 'swap',
})

const oxanium = Oxanium({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-oxanium',
  display: 'swap',
})

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    applicationCategory: 'BloggingPlatform',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Decentralized blogging on Solana blockchain',
      'IPFS content storage',
      'Weekly prize draws',
      'Crypto rewards for content creators',
      'Wallet-based authentication',
    ],
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className={`antialiased ${dancingScript.variable} ${oxanium.variable} font-oxanium`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AppProviders>
            <AppLayout links={links}>
              <Provider>{children}</Provider>
            </AppLayout>
          </AppProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}

// Patch BigInt so we can log it using JSON.stringify without any errors
declare global {
  interface BigInt {
    toJSON(): string
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString()
}
