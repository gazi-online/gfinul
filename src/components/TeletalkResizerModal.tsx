import React, { useState, useCallback, useRef } from 'react'
import ReactDOM from 'react-dom'
import { useDropzone } from 'react-dropzone'
import ImageEditor from './ImageEditor'
import { magicFilter } from '../lib/imageProcessing'

interface ResizedFile {
  file: File
  preview: string
  isEdited: boolean
}

const TeletalkResizerModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [photo, setPhoto] = useState<ResizedFile | null>(null)
  const [sig, setSig] = useState<ResizedFile | null>(null)
  const [processing, setProcessing] = useState('')
  const [err, setErr] = useState('')
  const [editor, setEditor] = useState<{ type: 'photo' | 'sig'; src: string } | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleFile = useCallback((type: 'photo' | 'sig', file: File) => {
    const rf = { file, preview: URL.createObjectURL(file), isEdited: false }
    type === 'photo' ? setPhoto(rf) : setSig(rf)
    setErr('')
  }, [])

  const applyEdit = useCallback((dataUrl: string) => {
    if (!editor) return
    const setResized = editor.type === 'photo' ? setPhoto : setSig
    setResized(prev => prev ? { ...prev, preview: dataUrl, isEdited: true } : null)
    setEditor(null)
  }, [editor])

  const resizeAndDownload = async (type: 'photo' | 'sig') => {
    const rf = type === 'photo' ? photo : sig
    if (!rf) return
    setProcessing(type)
    try {
      const img = new Image()
      img.src = rf.preview
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej })

      const targetW = 300
      const targetH = type === 'photo' ? 300 : 80
      const maxKB = type === 'photo' ? 100 : 60

      const canvas = document.createElement('canvas')
      canvas.width = targetW; canvas.height = targetH
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, targetW, targetH)

      // Quality adjustment loop to hit KB limit
      let quality = 0.95
      let blob: Blob | null = null
      for (let i = 0; i < 8; i++) {
        blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', quality))
        if (blob && blob.size / 1024 < maxKB) break
        quality -= 0.12
      }


      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `teletalk_${type}_${targetW}x${targetH}.jpg`
        a.click(); URL.revokeObjectURL(url)
      }
    } catch (e) {
      setErr('Resize failed. Try again.')
    } finally {
      setProcessing('')
    }
  }

  const modal = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: '94vh' }}>
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 z-20 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">×</button>

        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Teletalk Resizer</h2>
            <p className="text-xs font-medium text-blue-100 mt-1 opacity-90">Official Job Application Photo & Signature Generator</p>
          </div>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              setErr('Link copied to clipboard!')
              setTimeout(() => setErr(''), 2000)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold transition-all border border-white/20"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
            </svg>
            Share Tool
          </button>
        </div>


        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Photo Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-800">Passport Photo</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">300×300 PX • Max 100KB</p>
              </div>
              {photo && (
                <button onClick={() => setPhoto(null)} className="text-[10px] font-bold text-red-500 hover:underline">Remove</button>
              )}
            </div>
            
            <div className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center transition-all ${
              photo ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer'
            }`} onClick={() => !photo && document.getElementById('photo-input')?.click()}>
              <input id="photo-input" type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleFile('photo', e.target.files[0])}/>
              {photo ? (
                <div className="flex flex-col items-center gap-4 w-full">
                  <img src={photo.preview} className="w-24 h-24 object-cover rounded-lg shadow-md border-2 border-white" alt="Photo Preview"/>
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex gap-2">
                      <button onClick={() => setEditor({ type: 'photo', src: photo.preview })} className="flex-1 py-2 rounded-xl bg-white border border-blue-200 text-[11px] font-bold text-blue-600 hover:bg-blue-50 transition-colors">✂️ Crop to Square</button>
                      <button 
                        onClick={async () => {
                          setProcessing('photo-filter')
                          try {
                            const filtered = await magicFilter(photo.preview)
                            setPhoto(prev => prev ? { ...prev, preview: filtered, isEdited: true } : null)
                          } catch { setErr('Filter failed') }
                          finally { setProcessing('') }
                        }}
                        disabled={processing !== ''}
                        className="flex-1 py-2 rounded-xl bg-blue-50 border border-blue-200 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                      >
                        {processing === 'photo-filter' ? <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : '✨ Magic Filter'}
                      </button>
                    </div>
                    <button onClick={() => resizeAndDownload('photo')} disabled={processing !== ''} className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95">
                      {processing === 'photo' ? 'Processing...' : 'Download 300x300 JPG'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">📸</div>
                  <p className="text-xs font-bold text-blue-600">Upload Photo</p>
                  <p className="text-[10px] text-gray-400 mt-1">Supports JPG, PNG</p>
                </div>
              )}
            </div>
          </section>

          {/* Signature Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-800">Signature</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">300×80 PX • Max 60KB</p>
              </div>
              {sig && (
                <button onClick={() => setSig(null)} className="text-[10px] font-bold text-red-500 hover:underline">Remove</button>
              )}
            </div>

            <div className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center transition-all ${
              sig ? 'border-purple-200 bg-purple-50/50' : 'border-gray-200 bg-gray-50 hover:border-purple-400 hover:bg-purple-50/30 cursor-pointer'
            }`} onClick={() => !sig && document.getElementById('sig-input')?.click()}>
              <input id="sig-input" type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleFile('sig', e.target.files[0])}/>
              {sig ? (
                <div className="flex flex-col items-center gap-4 w-full">
                  <img src={sig.preview} className="w-full h-16 object-contain rounded-lg shadow-sm bg-white" alt="Signature Preview"/>
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex gap-2">
                      <button onClick={() => setEditor({ type: 'sig', src: sig.preview })} className="flex-1 py-2 rounded-xl bg-white border border-purple-200 text-[11px] font-bold text-purple-600 hover:bg-purple-50 transition-colors">✂️ Crop to Wide</button>
                      <button 
                        onClick={async () => {
                          setProcessing('sig-filter')
                          try {
                            const filtered = await magicFilter(sig.preview)
                            setSig(prev => prev ? { ...prev, preview: filtered, isEdited: true } : null)
                          } catch { setErr('Filter failed') }
                          finally { setProcessing('') }
                        }}
                        disabled={processing !== ''}
                        className="flex-1 py-2 rounded-xl bg-purple-50 border border-purple-200 text-[11px] font-bold text-purple-700 hover:bg-purple-100 transition-colors flex items-center justify-center gap-1"
                      >
                        {processing === 'sig-filter' ? <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /> : '✨ Magic Filter'}
                      </button>
                    </div>
                    <button onClick={() => resizeAndDownload('sig')} disabled={processing !== ''} className="w-full py-2.5 rounded-xl bg-purple-600 text-white text-xs font-black hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 active:scale-95">
                      {processing === 'sig' ? 'Processing...' : 'Download 300x80 JPG'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">✍️</div>
                  <p className="text-xs font-bold text-purple-600">Upload Signature</p>
                  <p className="text-[10px] text-gray-400 mt-1">Supports JPG, PNG</p>
                </div>
              )}
            </div>
          </section>

          {err && <p className="text-center text-xs font-bold text-red-500">⚠️ {err}</p>}
        </div>

        {/* Footer Info */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 text-[10px] text-gray-500 leading-relaxed">
          <p>This tool ensures your images meet the strict requirements of <strong>Teletalk Bangladesh Limited</strong> job portals. Files are processed entirely in your browser for maximum privacy.</p>
        </div>
      </div>

      {editor && (
        <ImageEditor
          src={editor.src}
          aspectRatio={editor.type === 'photo' ? 1 : 300 / 80}
          onApply={applyEdit}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  )

  return ReactDOM.createPortal(modal, document.body)
}

export default TeletalkResizerModal
