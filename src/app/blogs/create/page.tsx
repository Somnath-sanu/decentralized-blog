'use client'

import { useState, useCallback, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '@/components/solana/solana-provider'
import { useCounterProgram } from '@/components/counter/counter-data-access'
import { motion } from 'framer-motion'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { uploadFileToPinata, uploadBlogContentToPinata } from '@/lib/pinata-client'
import { toast } from 'sonner'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageIcon } from 'lucide-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'

export default function CreateBlogPage() {
  const { publicKey } = useWallet()
  const { createEntry } = useCounterProgram()
  const [title, setTitle] = useState('')
  const [solContribution, setSolContribution] = useState([0.1])
  const [uploading, setUploading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])

  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: '<p>Start writing your blog post...</p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'ProseMirror focus:outline-none min-h-[300px] p-4 text-gray-300',
      },
    },
  })

  const handleImageUpload = useCallback(async (file: File) => {
    try {
      setUploading(true)
      const ipfsHash = await uploadFileToPinata(file)
      setUploadedImages((prev) => [...prev, ipfsHash])
      
      // Insert image into editor
      if (editor) {
        // Support both custom gateway and default Pinata gateway
        const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL 
          ? process.env.NEXT_PUBLIC_GATEWAY_URL.startsWith('http')
            ? process.env.NEXT_PUBLIC_GATEWAY_URL
            : `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}`
          : 'https://gateway.pinata.cloud'
        const imageUrl = `${gatewayUrl}/ipfs/${ipfsHash}`
        editor.chain().focus().setImage({ src: imageUrl }).run()
      }
      
      toast.success('Image uploaded successfully!')
    } catch (error) {
      toast.error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }, [editor])

  const handleSubmit = async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet')
      return
    }

    if (!title.trim()) {
      toast.error('Please enter a title')
      return
    }

    if (!editor?.getHTML() || editor.getHTML() === '<p>Start writing your blog post...</p>') {
      toast.error('Please write some content')
      return
    }

    try {
      setUploading(true)

      // Upload blog content to Pinata
      const blogContent = {
        body: editor.getHTML(),
        images: uploadedImages,
      }

      const ipfsHash = await uploadBlogContentToPinata(blogContent)
      toast.success('Blog content uploaded to IPFS!')

      // Convert SOL to lamports
      const lamports = Math.floor(solContribution[0] * LAMPORTS_PER_SOL)

      // Create blog entry on-chain
      await createEntry.mutateAsync({
        title: title.trim(),
        ipfsHash,
        poolContribution: lamports,
      })

      toast.success('Blog created successfully!')
      
      // Reset form
      setTitle('')
      editor.commands.clearContent()
      setUploadedImages([])
      setSolContribution([0.1])
    } catch (error) {
      toast.error(`Failed to create blog: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  if (!publicKey) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-purple-200">Connect Your Wallet</h2>
          <p className="text-gray-400">Please connect your Solana wallet to create a blog</p>
          <WalletButton />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
          Create Blog
        </h1>
        <p className="text-gray-400">Share your thoughts with the decentralized community</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl rounded-xl border border-purple-500/20 p-8 space-y-6"
      >
        <div className="space-y-2">
          <Label htmlFor="title" className="text-purple-200">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter blog title..."
            className="bg-white/5 border-purple-500/30 text-white placeholder:text-gray-500"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-purple-200">Content</Label>
          <div className="bg-white/5 border border-purple-500/30 rounded-lg overflow-hidden">
            <div className="border-b border-purple-500/30 p-2 flex gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                  }}
                  disabled={uploading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={uploading}
                  onClick={handleFileClick}
                  className="text-purple-300 hover:text-purple-200"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </Button>
              </label>
            </div>
            <EditorContent editor={editor} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-purple-200">
              SOL Contribution to Pool: {solContribution[0].toFixed(2)} SOL
            </Label>
            <Slider
              value={solContribution}
              onValueChange={setSolContribution}
              min={0.1}
              max={10}
              step={0.1}
              className="w-full"
            />
            <p className="text-xs text-gray-400">Minimum: 0.1 SOL</p>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={uploading || createEntry.isPending || !title.trim()}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
        >
          {uploading || createEntry.isPending ? 'Processing...' : 'Create Blog'}
        </Button>
      </motion.div>
    </div>
  )
}

