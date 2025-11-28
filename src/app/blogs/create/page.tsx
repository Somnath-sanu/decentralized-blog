'use client'

import { useState, useCallback, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '@/components/solana/solana-provider'
import { useCounterProgram } from '@/components/counter/counter-data-access'
import { motion } from 'framer-motion'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Heading from '@tiptap/extension-heading'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Strike from '@tiptap/extension-strike'
import Code from '@tiptap/extension-code'
import Blockquote from '@tiptap/extension-blockquote'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import CodeBlock from '@tiptap/extension-code-block'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import { uploadFileToPinata, uploadBlogContentToPinata } from '@/lib/pinata-client'
import { toast } from 'sonner'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ImageIcon,
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  CodeIcon,
  QuoteIcon,
  ListIcon,
  ListOrderedIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  MinusIcon,
} from 'lucide-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { getPinataGatewayUrl } from '@/lib/pinata'

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(50, 'Title must be at most 50 characters long'),
  content: z.string().min(0, 'Content is required'),
  solContribution: z.number().min(0.1, 'Minimum contribution is 0.1 SOL').max(10, 'Maximum contribution is 10 SOL'),
})

type FormData = z.infer<typeof formSchema>

export default function CreateBlogPage() {
  const { publicKey } = useWallet()
  const { createEntry } = useCounterProgram()
  const [uploading, setUploading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      solContribution: 0.1,
    },
  })

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
      Bold,
      Italic,
      Strike,
      Code,
      Blockquote,
      BulletList,
      OrderedList,
      ListItem,
      CodeBlock,
      HorizontalRule,
    ],
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'ProseMirror focus:outline-none min-h-[300px] p-4 text-gray-300',
      },
    },
    onUpdate: ({ editor }) => {
      form.setValue('content', editor.getHTML())
    },
  })

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!publicKey) {
        return
      }

      try {
        setUploading(true)
        const ipfsHash = await uploadFileToPinata(file, publicKey.toBase58())
        setUploadedImages((prev) => [...prev, ipfsHash])

        // Insert image into editor
        if (editor) {
          const gatewayUrl = getPinataGatewayUrl()
          const imageUrl = `${gatewayUrl}/ipfs/${ipfsHash}`
          editor.chain().focus().setImage({ src: imageUrl }).run()
        }

        toast.success('Image uploaded successfully!')
      } catch (error) {
        toast.error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`)
      } finally {
        setUploading(false)
      }
    },
    [editor, publicKey],
  )

  const onSubmit = async (data: FormData) => {
    if (!publicKey) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      setUploading(true)

      const blogContent = {
        body: data.content,
        images: uploadedImages,
      }

      const ipfsHash = await uploadBlogContentToPinata(blogContent, publicKey.toBase58())

      toast.success('Blog content uploaded successfully!')

      const lamports = Math.floor(data.solContribution * LAMPORTS_PER_SOL)

      await createEntry.mutateAsync({
        title: data.title.trim(),
        ipfsHash,
        poolContribution: lamports,
      })

      toast.success('Blog created successfully!')

      form.reset()
      editor?.commands.clearContent()
      setUploadedImages([])
    } catch (error) {
      toast.error(`Failed to create blog: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
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

  const Toolbar = () => (
    <div className="border-b border-purple-500/30 p-2 flex gap-1 flex-wrap">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`text-purple-300 hover:text-purple-200 ${editor?.isActive('heading', { level: 1 }) ? 'bg-purple-500/20' : ''}`}
      >
        <Heading1Icon className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`text-purple-300 hover:text-purple-200 ${editor?.isActive('heading', { level: 2 }) ? 'bg-purple-500/20' : ''}`}
      >
        <Heading2Icon className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`text-purple-300 hover:text-purple-200 ${editor?.isActive('heading', { level: 3 }) ? 'bg-purple-500/20' : ''}`}
      >
        <Heading3Icon className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor?.chain().focus().toggleBold().run()}
        className={`text-purple-300 hover:text-purple-200 ${editor?.isActive('bold') ? 'bg-purple-500/20' : ''}`}
      >
        <BoldIcon className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor?.chain().focus().toggleItalic().run()}
        className={`text-purple-300 hover:text-purple-200 ${editor?.isActive('italic') ? 'bg-purple-500/20' : ''}`}
      >
        <ItalicIcon className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor?.chain().focus().toggleStrike().run()}
        className={`text-purple-300 hover:text-purple-200 ${editor?.isActive('strike') ? 'bg-purple-500/20' : ''}`}
      >
        <StrikethroughIcon className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor?.chain().focus().toggleCode().run()}
        className={`text-purple-300 hover:text-purple-200 ${editor?.isActive('code') ? 'bg-purple-500/20' : ''}`}
      >
        <CodeIcon className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        className={`text-purple-300 hover:text-purple-200 ${editor?.isActive('blockquote') ? 'bg-purple-500/20' : ''}`}
      >
        <QuoteIcon className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
        className={`text-purple-300 hover:text-purple-200 ${editor?.isActive('bulletList') ? 'bg-purple-500/20' : ''}`}
      >
        <ListIcon className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        className={`text-purple-300 hover:text-purple-200 ${editor?.isActive('orderedList') ? 'bg-purple-500/20' : ''}`}
      >
        <ListOrderedIcon className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor?.chain().focus().setHorizontalRule().run()}
        className="text-purple-300 hover:text-purple-200"
      >
        <MinusIcon className="w-4 h-4" />
      </Button>
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
          {uploading ? 'Uploading...' : 'Image'}
        </Button>
      </label>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6 mb-4 px-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="text-gray-400 text-xl mt-3">Share your thoughts with the decentralized community</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl rounded-xl border border-purple-500/20 p-8 space-y-6"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-purple-200">Unique Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter blog title..."
                      className="bg-white/5 border-indigo-500/30  placeholder:text-gray-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={() => (
                <FormItem>
                  <FormLabel className="text-purple-200">Content</FormLabel>
                  <FormControl>
                    <div className="bg-white/5 border border-indigo-500/30 rounded-lg overflow-hidden">
                      <Toolbar />
                      <EditorContent editor={editor} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="solContribution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-purple-200">
                    SOL Contribution to Pool: {field.value?.toFixed(2)} SOL
                  </FormLabel>
                  <FormControl>
                    <Slider
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      min={0.1}
                      max={10}
                      step={0.1}
                      className="w-full h-10"
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-gray-400">Minimum: 0.1 SOL</p>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={uploading || createEntry.isPending || !form.formState.isValid}
              className="w-full "
            >
              {uploading || createEntry.isPending ? 'Processing...' : 'Create Blog'}
            </Button>
          </form>
        </Form>
      </motion.div>
    </div>
  )
}
