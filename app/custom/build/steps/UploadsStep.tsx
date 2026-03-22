'use client'

import { useRef, useState } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { UploadedFile } from '@/lib/custom-inquiry-types'

const ACCEPTED = '.png,.jpg,.jpeg,.pdf,.svg,.ai'
const MAX_MB = 10
const MAX_FILES = 5

interface UploadsStepProps {
  uploads: UploadedFile[]
  onChange: (uploads: UploadedFile[]) => void
}

interface UploadProgress {
  id: string
  name: string
  progress: 'uploading' | 'error'
  error?: string
}

export default function UploadsStep({ uploads, onChange }: UploadsStepProps) {
  const [progresses, setProgresses] = useState<UploadProgress[]>([])
  const [dragging, setDragging] = useState(false)
  const sessionId = useRef(crypto.randomUUID())
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File) => {
    if (uploads.length + progresses.filter(p => p.progress === 'uploading').length >= MAX_FILES) return
    const id = crypto.randomUUID()
    if (file.size > MAX_MB * 1024 * 1024) {
      setProgresses(p => [...p, { id, name: file.name, progress: 'error', error: 'File too large (max 10MB)' }])
      return
    }
    const path = `${sessionId.current}/${Date.now()}-${file.name}`
    setProgresses(p => [...p, { id, name: file.name, progress: 'uploading' }])
    const { error } = await supabase.storage.from('custom-inquiry-uploads').upload(path, file)
    if (error) {
      setProgresses(p => p.map(x => x.id === id ? { ...x, progress: 'error', error: error.message } : x))
      return
    }
    setProgresses(p => p.filter(x => x.id !== id))
    onChange([...uploads, { path, name: file.name }])
  }

  const handleFiles = (files: FileList) => Array.from(files).forEach(uploadFile)

  const removeUpload = (path: string) => onChange(uploads.filter(u => u.path !== path))

  return (
    <div>
      <h2 className="font-display text-white text-xl tracking-wider mb-2">REFERENCE FILES</h2>
      <p className="text-steel/60 text-sm mb-6">
        Optional — upload any reference images, logos, or artwork. Accepted: PNG, JPG, PDF, SVG, AI. Max 10MB each, up to 5 files.
      </p>

      <div
        className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer ${dragging ? 'border-amber-bourbon bg-amber-bourbon/5' : 'border-white/10 hover:border-white/30'}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
      >
        <Upload className="w-8 h-8 text-steel/40 mx-auto mb-3" />
        <p className="text-steel-light text-sm">Drop files here or <span className="text-amber-bourbon">browse</span></p>
        <input ref={inputRef} type="file" accept={ACCEPTED} multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
      </div>

      {(uploads.length > 0 || progresses.length > 0) && (
        <ul className="mt-4 space-y-2">
          {uploads.map((u) => (
            <li key={u.path} className="flex items-center justify-between glass-card px-4 py-2.5">
              <span className="text-sm text-steel-light truncate">{u.name}</span>
              <button type="button" onClick={() => removeUpload(u.path)} className="text-steel/40 hover:text-red-400 ml-3 cursor-pointer"><X className="w-4 h-4" /></button>
            </li>
          ))}
          {progresses.map((p) => (
            <li key={p.id} className="flex items-center gap-3 glass-card px-4 py-2.5">
              {p.progress === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-amber-bourbon flex-shrink-0" />}
              <span className={`text-sm truncate ${p.progress === 'error' ? 'text-red-400' : 'text-steel/60'}`}>
                {p.name}{p.error ? ` — ${p.error}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
