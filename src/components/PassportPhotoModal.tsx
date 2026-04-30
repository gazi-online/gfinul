import React, { useState, useCallback, useRef } from 'react'
import ReactDOM from 'react-dom'
import { useDropzone } from 'react-dropzone'
import { PDFDocument, rgb } from 'pdf-lib'
import ImageEditor from './ImageEditor'
import { magicFilter } from '../lib/imageProcessing'

interface PhotoFile {
  file: File
  preview: string
  isEdited: boolean
}

const PassportPhotoModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [photo, setPhoto] = useState<PhotoFile | null>(null)
  const [processing, setProcessing] = useState('')
  const [numCopies, setNumCopies] = useState(8)
  const [err, setErr] = useState('')
  const [editor, setEditor] = useState<string | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleFile = useCallback((file: File) => {
    setPhoto({ file, preview: URL.createObjectURL(file), isEdited: false })
    setErr('')
  }, [])

  const applyEdit = useCallback((dataUrl: string) => {
    setPhoto(prev => prev ? { ...prev, preview: dataUrl, isEdited: true } : null)
    setEditor(null)
  }, [])

  const generatePDF = async () => {
    if (!photo) return
    setProcessing('pdf')
    try {
      const pdf = await PDFDocument.create()
      const A4W = 595.28, A4H = 841.89
      const page = pdf.addPage([A4W, A4H])
      
      const CM = 28.346
      const pw = 3.5 * CM
      const ph = 4.5 * CM
      
      const imgRes = await fetch(photo.preview)
      const imgBytes = await imgRes.arrayBuffer()
      const embedded = await pdf.embedJpg(imgBytes)

      const margin = 50
      const gap = 15
      const cols = 4
      
      for (let i = 0; i < numCopies; i++) {
        const col = i % cols
        const row = Math.floor(i / cols)
        const x = margin + col * (pw + gap)
        const y = A4H - margin - ph - row * (ph + gap)
        
        page.drawImage(embedded, { x, y, width: pw, height: ph })
      }

      const bytes = await pdf.save()
      const blob = new Blob([bytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `passport_photos_${numCopies}.pdf`
      a.click(); URL.revokeObjectURL(url)
    } catch (e) {
      setErr('PDF generation failed.')
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
        <button onClick={onClose} className="absolute top-4 right-4 z-20 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">×</button>

        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 text-white">
          <h2 className="text-xl font-black uppercase tracking-tight text-center">Passport Photo Maker</h2>
          <p className="text-xs font-medium text-emerald-100 mt-1 text-center opacity-90">Generate Print-Ready Passport Photo Sheets</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <section className="flex flex-col items-center">
            <div className={`w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all ${
              photo ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-200 bg-gray-50 hover:border-emerald-400 hover:bg-emerald-50/30 cursor-pointer'
            }`} onClick={() => !photo && document.getElementById('photo-input')?.click()}>
              <input id="photo-input" type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}/>
              
              {photo ? (
                <div className="flex flex-col items-center gap-6 w-full">
                  <div className="relative group">
                    <img src={photo.preview} className="w-32 h-40 object-cover rounded-lg shadow-xl border-4 border-white" alt="Passport Preview"/>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                       <button onClick={(e) => { e.stopPropagation(); setPhoto(null) }} className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
                         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                         </svg>
                       </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <button onClick={() => setEditor(photo.preview)} className="py-2.5 rounded-xl bg-white border border-emerald-200 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2">
                      ✂️ Crop & Rotate
                    </button>
                    <button 
                      onClick={async () => {
                        setProcessing('filter')
                        try {
                          const f = await magicFilter(photo.preview)
                          setPhoto(prev => prev ? { ...prev, preview: f, isEdited: true } : null)
                        } catch { setErr('Filter failed') }
                        finally { setProcessing('') }
                      }}
                      disabled={processing !== ''}
                      className="py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
                    >
                      {processing === 'filter' ? <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"/> : '✨ Magic Filter'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8">
                      <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-sm font-black text-emerald-700 uppercase tracking-tight">Upload Your Photo</p>
                  <p className="text-xs text-gray-400 mt-1">Single photo will be multiplied in sheet</p>
                </div>
              )}
            </div>
          </section>

          {photo && (
            <section className="animate-fade-in space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Select Sheet Layout:</p>
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{numCopies} Photos</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[4, 8, 12, 16].map(n => (
                  <button 
                    key={n} 
                    onClick={() => setNumCopies(n)}
                    className={`py-3 rounded-xl border-2 transition-all font-black text-sm ${
                      numCopies === n ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-gray-100 bg-white text-gray-400 hover:border-emerald-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={generatePDF} 
                disabled={processing !== ''}
                className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 active:scale-95"
              >
                {processing === 'pdf' ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"/>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    Download Print Ready A4 PDF
                  </>
                )}
              </button>
            </section>
          )}

          {err && <p className="text-center text-xs font-bold text-red-500 bg-red-50 py-2 rounded-lg border border-red-100">⚠️ {err}</p>}
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 text-[10px] text-gray-500 leading-relaxed text-center">
          <p>Photos are set to official <strong>3.5cm x 4.5cm</strong> dimensions. For best results, use a plain background photo.</p>
        </div>
      </div>

      {editor && (
        <ImageEditor
          src={editor}
          aspectRatio={3.5 / 4.5}
          onApply={applyEdit}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  )

  return ReactDOM.createPortal(modal, document.body)
}

export default PassportPhotoModal
