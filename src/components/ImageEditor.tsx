import React, { useRef, useState, useCallback, useEffect } from 'react'
import ReactDOM from 'react-dom'
import ReactCrop, { centerCrop, makeAspectCrop, Crop, PixelCrop, convertToPixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { PerspectiveOverlay } from './PerspectiveOverlay'
import { warpPerspective, getHomography, toMatrix3d, type Point } from '../lib/perspective'

interface Rect { x: number; y: number; w: number; h: number }
type ToolMode = 'crop' | 'perspective' | 'zoom' | 'contrast' | 'preview'

interface Props {
  src: string
  onApply: (dataUrl: string) => void
  onClose: () => void
  aspectRatio?: number // width / height
}

/** Render current state (rotation + contrast + crop) to a canvas and return dataURL */
async function getCroppedImg(
  image: HTMLImageElement,
  pixelCrop: PixelCrop,
  rotation: number,
  contrast: number
): Promise<string> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No 2d context')

  // Calculate scaling between displayed image and natural image
  // Since we rotate the container, image.width/height reflect the local coords
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height

  const cropX = pixelCrop.x * scaleX
  const cropY = pixelCrop.y * scaleY
  const cropW = pixelCrop.width * scaleX
  const cropH = pixelCrop.height * scaleY

  const rotateRads = (rotation * Math.PI) / 180
  
  // 1. Create a canvas for the rotated and filtered full image
  const absCos = Math.abs(Math.cos(rotateRads))
  const absSin = Math.abs(Math.sin(rotateRads))
  const rw = Math.round(image.naturalWidth * absCos + image.naturalHeight * absSin)
  const rh = Math.round(image.naturalWidth * absSin + image.naturalHeight * absCos)
  
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = rw
  tempCanvas.height = rh
  const tempCtx = tempCanvas.getContext('2d')!
  
  tempCtx.filter = `contrast(${contrast}%)`
  tempCtx.translate(rw / 2, rh / 2)
  tempCtx.rotate(rotateRads)
  tempCtx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2)

  // 2. Extract the cropped area from the rotated canvas
  const finalCanvas = document.createElement('canvas')
  finalCanvas.width = cropW
  finalCanvas.height = cropH
  const finalCtx = finalCanvas.getContext('2d')!
  
  finalCtx.drawImage(
    tempCanvas,
    cropX, cropY, cropW, cropH,
    0, 0, cropW, cropH
  )

  return finalCanvas.toDataURL('image/jpeg', 0.95)
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  )
}

export const ImageEditor: React.FC<Props> = ({ src, onApply, onClose, aspectRatio }) => {
  const imgRef = useRef<HTMLImageElement>(null)
  const [rotation, setRotation] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [contrast, setContrast] = useState(100)
  const [activeTool, setActiveTool] = useState<ToolMode>(aspectRatio ? 'perspective' : 'crop')
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
  const [perspectivePoints, setPerspectivePoints] = useState<Point[]>([
    { x: 50, y: 50 }, { x: 250, y: 50 }, { x: 250, y: 350 }, { x: 50, y: 350 }
  ])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)

  const isPreview = activeTool === 'preview'

  // Initialize crop when image loads or aspect ratio changes
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    if (aspectRatio) {
      setCrop(centerAspectCrop(width, height, aspectRatio))
    }
    // Initialize perspective points to a document-like shape in the center
    const margin = 40
    setPerspectivePoints([
      { x: margin, y: margin },
      { x: width - margin, y: margin },
      { x: width - margin, y: height - margin },
      { x: margin, y: height - margin }
    ])
  }, [aspectRatio])

  // Generate actual rendered preview when preview mode is toggled on
  useEffect(() => {
    if (!isPreview || !imgRef.current) { setPreviewUrl(null); return }
    setIsLoadingPreview(true)
    
    const image = imgRef.current
    if (activeTool === 'perspective') {
      // For perspective, we define target size based on aspect ratio
      const targetW = aspectRatio ? 1000 : image.naturalWidth
      const targetH = aspectRatio ? 1000 / aspectRatio : image.naturalHeight
      
      // Scale points to natural dimensions
      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height
      const scaledPoints = perspectivePoints.map(p => ({ x: p.x * scaleX, y: p.y * scaleY }))

      try {
        const canvas = warpPerspective(image, scaledPoints, targetW, targetH, contrast)
        setPreviewUrl(canvas.toDataURL('image/jpeg', 0.9))
      } catch (e) {
        console.error(e)
      }
      setIsLoadingPreview(false)
    } else if (completedCrop) {
      getCroppedImg(image, completedCrop, rotation, contrast)
        .then(url => { setPreviewUrl(url); setIsLoadingPreview(false) })
        .catch(() => setIsLoadingPreview(false))
    } else {
      setIsLoadingPreview(false)
    }
  }, [isPreview, rotation, contrast, completedCrop, perspectivePoints, aspectRatio, activeTool])

  const sliderMin = activeTool === 'zoom' ? 50 : activeTool === 'contrast' ? 50 : -180
  const sliderMax = activeTool === 'zoom' ? 300 : activeTool === 'contrast' ? 200 : 180
  const sliderValue = activeTool === 'zoom' ? Math.round(zoom * 100) : activeTool === 'contrast' ? contrast : rotation

  const handleSlider = (v: number) => {
    if (activeTool === 'zoom') setZoom(v / 100)
    if (activeTool === 'contrast') setContrast(v)
    if (activeTool === 'crop') setRotation(v)
  }

  const rotateCCW = () => setRotation(r => (r - 90 < -180 ? 180 : r - 90))
  const rotateCW = () => setRotation(r => (r + 90 > 180 ? -180 : r + 90))
  const resetRotate = () => setRotation(0)

  // Final apply
  const handleApply = useCallback(async () => {
    if (!imgRef.current) return
    const image = imgRef.current
    
    let url: string
    if (activeTool === 'perspective') {
      const targetW = aspectRatio ? 1200 : image.naturalWidth
      const targetH = aspectRatio ? 1200 / aspectRatio : image.naturalHeight
      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height
      const scaledPoints = perspectivePoints.map(p => ({ x: p.x * scaleX, y: p.y * scaleY }))
      
      const canvas = warpPerspective(image, scaledPoints, targetW, targetH, contrast)
      url = canvas.toDataURL('image/jpeg', 0.95)
    } else {
      if (!completedCrop) return
      url = await getCroppedImg(image, completedCrop, rotation, contrast)
    }
    
    onApply(url)
  }, [rotation, contrast, completedCrop, perspectivePoints, aspectRatio, activeTool, onApply])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const toolLabels: Record<ToolMode, string> = {
    crop: 'Rotate Angle', zoom: 'Zoom Scale', contrast: 'Contrast', preview: 'Final Preview'
  }

  const modal = (
    <div
      className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
    >
      <div className="bg-white w-full sm:max-w-xl sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '96vh' }}>

        {/* ── Header ── */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Manual Crop & Enhance</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{aspectRatio ? 'Aspect Ratio Locked' : 'Free Transform'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5 text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Toolbar ── */}
        <div className="flex items-center border-b border-gray-100 bg-gray-50/50 shrink-0">
          <button onClick={rotateCCW} title="Rotate Left"
            className="px-5 py-4 text-gray-500 hover:text-blue-600 hover:bg-white transition-all border-r border-gray-100 touch-manipulation">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"/>
            </svg>
          </button>

          {([
            { id:'crop',    label:'Crop', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"/></svg> },
            { id:'perspective', label:'Perspective', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 21l3-18h12l3 18H3z"/></svg> },
            { id:'zoom',    label:'Zoom', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-5 h-5"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg> },
            { id:'contrast',label:'Contrast', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-5 h-5"><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 010 18V3z" fill="currentColor"/></svg> },
            { id:'preview', label:'Preview', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg> },
          ] as const).map(({ id, label, icon }) => (
            <button key={id}
              onClick={() => setActiveTool(id as ToolMode)}
              className={`flex-1 flex flex-col items-center justify-center py-3.5 gap-1 transition-all border-r border-gray-100 last:border-r-0 touch-manipulation relative ${
                activeTool === id ? 'text-blue-600 bg-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}>
              {icon}
              <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
              {activeTool === id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
            </button>
          ))}
        </div>

        {/* ── Slider ── */}
        {!isPreview && (
          <div className="px-6 py-4 bg-white shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-gray-300 w-8 text-right tabular-nums">{sliderMin}</span>
              <input type="range" min={sliderMin} max={sliderMax} step={1}
                value={sliderValue}
                onChange={e => handleSlider(Number(e.target.value))}
                className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer touch-manipulation bg-gray-100 accent-blue-600"
              />
              <span className="text-[10px] font-black text-gray-300 w-8 tabular-nums">{sliderMax}</span>
            </div>
            <div className="flex justify-center mt-2">
              <div className="px-3 py-0.5 rounded-full bg-blue-50 border border-blue-100">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                  {toolLabels[activeTool]}: {sliderValue}{activeTool === 'crop' ? '°' : activeTool === 'zoom' ? '%' : '%'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Canvas area ── */}
        <div className="bg-gray-900 flex items-center justify-center relative overflow-hidden flex-1"
          style={{ minHeight: 280, maxHeight: 400 }}>

          {isPreview ? (
            isLoadingPreview ? (
              <div className="flex flex-col items-center gap-3 text-white/40">
                <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <span className="text-[10px] font-black uppercase tracking-widest">Rendering preview…</span>
              </div>
            ) : previewUrl ? (
              <div className="flex flex-col items-center gap-4 p-6 w-full h-full">
                <img src={previewUrl} alt="Preview" className="max-h-[320px] max-w-full object-contain rounded-xl shadow-2xl border-4 border-white/10"/>
                <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em]">Final Output Result</p>
              </div>
            ) : (
              <p className="text-white/20 text-xs font-bold">Preview unavailable</p>
            )
          ) : (
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <div style={{ 
                transform: `rotate(${rotation}deg) scale(${zoom})`,
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}>
                {activeTool === 'perspective' ? (
                  <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
                    <div className="relative">
                      <img
                        ref={imgRef}
                        src={src}
                        alt="Edit"
                        onLoad={onImageLoad}
                        draggable={false}
                        style={{
                          display: 'block',
                          maxHeight: 280,
                          maxWidth: '100%',
                          objectFit: 'contain',
                          filter: `contrast(${contrast}%)`,
                          opacity: 0.8
                        }}
                      />
                      {imgRef.current && (
                        <PerspectiveOverlay
                          width={imgRef.current.width}
                          height={imgRef.current.height}
                          points={perspectivePoints}
                          onChange={setPerspectivePoints}
                        />
                      )}
                    </div>

                    {/* Live Preview Window */}
                    {imgRef.current && (
                      <div className="hidden sm:flex flex-col items-center gap-2">
                        <div className="w-[180px] h-[120px] bg-black/40 rounded-lg overflow-hidden border border-white/10 relative flex items-center justify-center">
                          <img 
                            src={src} 
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              filter: `contrast(${contrast}%)`,
                              transform: toMatrix3d(getHomography(
                                perspectivePoints.map(p => ({ x: p.x / imgRef.current!.width * 100, y: p.y / imgRef.current!.height * 100 })),
                                [{x:0, y:0}, {x:100, y:0}, {x:100, y:100}, {x:0, y:100}]
                              )),
                              transformOrigin: '0 0'
                            }}
                          />
                        </div>
                        <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Live Rectify</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <ReactCrop
                    crop={crop}
                    onChange={c => setCrop(c)}
                    onComplete={c => setCompletedCrop(c)}
                    aspect={aspectRatio}
                    className="max-h-full"
                  >
                    <img
                      ref={imgRef}
                      src={src}
                      alt="Edit"
                      onLoad={onImageLoad}
                      draggable={false}
                      style={{
                        display: 'block',
                        maxHeight: 360,
                        maxWidth: '100%',
                        objectFit: 'contain',
                        filter: `contrast(${contrast}%)`,
                      }}
                    />
                  </ReactCrop>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer Actions ── */}
        <div className="p-5 bg-white border-t border-gray-50 flex gap-3 shrink-0">
          <button onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-xs font-black text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all active:scale-[0.98]">
            CANCEL
          </button>
          <button onClick={handleApply}
            className="flex-[2] py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all shadow-lg shadow-blue-200 active:scale-[0.98] flex items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            APPLY CHANGES
          </button>
        </div>
      </div>
    </div>
  )

  return ReactDOM.createPortal(modal, document.body)
}

export default ImageEditor

