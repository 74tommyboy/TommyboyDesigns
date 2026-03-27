'use client'

import { useState, useCallback } from 'react'
import { Upload, X, CheckCircle, Loader2 } from 'lucide-react'

interface Props {
  onUpload: (url: string) => void
}

const CLOUD_NAME = 'db4vk2vdz'
const UPLOAD_PRESET = 'tommyboydesigns_uploads'

export default function ArtworkUpload({ onUpload }: Props) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [dragging, setDragging] = useState(false)

  const upload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload an image file.')
      setStatus('error')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File must be under 10MB.')
      setStatus('error')
      return
    }

    setStatus('uploading')
    setErrorMsg('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', UPLOAD_PRESET)

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.secure_url) {
        setPreviewUrl(data.secure_url)
        onUpload(data.secure_url)
        setStatus('done')
      } else {
        throw new Error(data.error?.message ?? 'Upload failed')
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed. Please try again.')
      setStatus('error')
    }
  }, [onUpload])

  const handleFile = (file: File | undefined) => {
    if (file) upload(file)
  }

  const clear = () => {
    setPreviewUrl(null)
    setStatus('idle')
    setErrorMsg('')
    onUpload('')
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-steel-light">
        Upload Custom Artwork <span className="text-steel/40">(optional)</span>
      </label>

      {status === 'done' && previewUrl ? (
        <div className="relative glass-card p-4 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Uploaded artwork" className="w-16 h-16 object-cover rounded" />
          <div className="flex-1">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Artwork uploaded!</span>
            </div>
            <p className="text-steel/60 text-xs mt-0.5">Your image has been saved.</p>
          </div>
          <button
            onClick={clear}
            className="p-1 text-steel hover:text-red-400 transition-colors"
            aria-label="Remove artwork"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
            dragging
              ? 'border-amber-bourbon bg-amber-bourbon/10'
              : 'border-amber-bourbon/30 hover:border-amber-bourbon/60 bg-navy-700/30'
          }`}
        >
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => handleFile(e.target.files?.[0])}
            disabled={status === 'uploading'}
          />

          {status === 'uploading' ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-amber-bourbon animate-spin" />
              <p className="text-steel text-sm">Uploading…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Upload className={`w-8 h-8 ${dragging ? 'text-amber-bourbon' : 'text-steel'}`} />
              <div>
                <p className="text-steel-light text-sm font-medium">
                  Drop your artwork here, or <span className="text-amber-bourbon">browse</span>
                </p>
                <p className="text-steel/50 text-xs mt-1">PNG, JPG, SVG · Max 10MB</p>
              </div>
            </div>
          )}
        </div>
      )}

      {status === 'error' && (
        <p className="text-red-400 text-xs">{errorMsg}</p>
      )}
    </div>
  )
}
