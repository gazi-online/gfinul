import React, { useRef, useState, useCallback, useEffect } from 'react'
import ReactDOM from 'react-dom'

interface Rect { x: number; y: number; w: number; h: number }
type Handle = 'tl'|'tc'|'tr'|'ml'|'mr'|'bl'|'bc'|'br'|'move'
type ToolMode = 'crop' | 'zoom' | 'contrast' | 'preview'

interface Props {
  src: string
  onApply: (dataUrl: string) => void
  onClose: () => void
  aspectRatio?: number // width / height
}

function clamp(v: number, lo = 0, hi = 1) { return Math.max(lo, Math.min(hi, v)) }

/** Render current state (rotation + contrast + crop) to a canvas and return dataURL */
async function renderPreview(
  src: string,
  rotation: number,
  contrast: number,
  crop: Rect
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const iw = img.naturalWidth, ih = img.naturalHeight
      const rad = (rotation * Math.PI) / 180
      const cos = Math.abs(Math.cos(rad)), sin = Math.abs(Math.sin(rad))
      const rw = Math.round(iw * cos + ih * sin)
      const rh = Math.round(iw * sin + ih * cos)

      // Step 1: rotate + contrast
      const rc = document.createElement('canvas')
      rc.width = rw; rc.height = rh
      const rctx = rc.getContext('2d')!
      rctx.filter = `contrast(${contrast}%)`
      rctx.translate(rw / 2, rh / 2)
      rctx.rotate(rad)
      rctx.drawImage(img, -iw / 2, -ih / 2)

      // Step 2: crop
      const cx = Math.round(crop.x * rw), cy = Math.round(crop.y * rh)
      const cw = Math.max(1, Math.round(crop.w * rw))
      const ch = Math.max(1, Math.round(crop.h * rh))
      const out = document.createElement('canvas')
      out.width = cw; out.height = ch
      out.getContext('2d')!.drawImage(rc, cx, cy, cw, ch, 0, 0, cw, ch)
      resolve(out.toDataURL('image/jpeg', 0.92))
    }
    img.src = src
  })
}

export const ImageEditor: React.FC<Props> = ({ src, onApply, onClose, aspectRatio }) => {
  const imgRef       = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [rotation, setRotation] = useState(0)
  const [zoom,     setZoom]     = useState(1)
  const [contrast, setContrast] = useState(100)
  const [activeTool, setActiveTool] = useState<ToolMode>('crop')
  const [crop, setCrop]   = useState<Rect>({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 })
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const dragRef = useRef<{ handle: Handle; startX: number; startY: number; startCrop: Rect } | null>(null)

  const isPreview = activeTool === 'preview'

  // Generate actual rendered preview when preview mode is toggled on
  useEffect(() => {
    if (!isPreview) { setPreviewUrl(null); return }
    setIsLoadingPreview(true)
    renderPreview(src, rotation, contrast, crop)
      .then(url => { setPreviewUrl(url); setIsLoadingPreview(false) })
      .catch(() => setIsLoadingPreview(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreview])

  const sliderMin   = activeTool === 'zoom' ? 50 : activeTool === 'contrast' ? 50 : -180
  const sliderMax   = activeTool === 'zoom' ? 300 : activeTool === 'contrast' ? 200 : 180
  const sliderValue = activeTool === 'zoom' ? Math.round(zoom * 100) : activeTool === 'contrast' ? contrast : rotation

  const handleSlider = (v: number) => {
    if (activeTool === 'zoom')     setZoom(v / 100)
    if (activeTool === 'contrast') setContrast(v)
    if (activeTool === 'crop')     setRotation(v)
  }

  const rotateCCW  = () => setRotation(r => Math.max(-180, r - 90))
  const rotateCW   = () => setRotation(r => Math.min(180, r + 90))
  const resetRotate = () => setRotation(0)

  // Final apply
  const handleApply = useCallback(async () => {
    const url = await renderPreview(src, rotation, contrast, crop)
    onApply(url)
  }, [src, rotation, contrast, crop, onApply])

  // Drag crop handles
  const getRect = () => containerRef.current?.getBoundingClientRect()

  const startDrag = useCallback((e: React.MouseEvent, handle: Handle) => {
    e.preventDefault(); e.stopPropagation()
    const rect = getRect(); if (!rect) return
    dragRef.current = { handle, startX: e.clientX, startY: e.clientY, startCrop: { ...crop } }

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return
      const r = getRect(); if (!r) return
      const dx = (ev.clientX - dragRef.current.startX) / r.width
      const dy = (ev.clientY - dragRef.current.startY) / r.height
      const sc = dragRef.current.startCrop, h = dragRef.current.handle
      const min = 0.06
      setCrop(() => {
        let { x, y, w, ph } = { ...sc, ph: sc.h }
        if (h==='move') { x=clamp(sc.x+dx,0,1-sc.w); y=clamp(sc.y+dy,0,1-sc.h) }
        else if (aspectRatio) {
          const centerX = sc.x + sc.w / 2
          const centerY = sc.y + sc.h / 2
          let nw = sc.w
          if (h.includes('l')) nw = sc.w - dx * 2
          if (h.includes('r')) nw = sc.w + dx * 2
          if (h.includes('t')) nw = Math.max(nw, (sc.h - dy * 2) * aspectRatio)
          if (h.includes('b')) nw = Math.max(nw, (sc.h + dy * 2) * aspectRatio)
          nw = clamp(nw, min, 1)
          let nh = nw / aspectRatio
          if (nh > 1) { nh = 1; nw = nh * aspectRatio }
          x = clamp(centerX - nw / 2, 0, 1 - nw)
          y = clamp(centerY - nh / 2, 0, 1 - nh)
          w = nw; ph = nh
        } else {
          if (h==='tl'||h==='tc'||h==='tr') { const ny=clamp(sc.y+dy,0,sc.y+sc.h-min); ph=sc.h+(sc.y-ny); y=ny }
          if (h==='bl'||h==='bc'||h==='br') { ph=clamp(sc.h+dy,min,1-sc.y) }
          if (h==='tl'||h==='ml'||h==='bl') { const nx=clamp(sc.x+dx,0,sc.x+sc.w-min); w=sc.w+(sc.x-nx); x=nx }
          if (h==='tr'||h==='mr'||h==='br') { w=clamp(sc.w+dx,min,1-sc.x) }
        }
        return { x:clamp(x), y:clamp(y), w:clamp(w,min,1-x), h:clamp(ph,min,1-y) }
      })
    }
    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [crop])

  // Touch support for mobile
  const startTouchDrag = useCallback((e: React.TouchEvent, handle: Handle) => {
    e.stopPropagation()
    const rect = getRect(); if (!rect) return
    const t0 = e.touches[0]
    dragRef.current = { handle, startX: t0.clientX, startY: t0.clientY, startCrop: { ...crop } }

    const onMove = (ev: TouchEvent) => {
      if (!dragRef.current) return
      const r = getRect(); if (!r) return
      const t = ev.touches[0]
      const dx = (t.clientX - dragRef.current.startX) / r.width
      const dy = (t.clientY - dragRef.current.startY) / r.height
      const sc = dragRef.current.startCrop, h = dragRef.current.handle
      const min = 0.06
      setCrop(() => {
        let { x, y, w, ph } = { ...sc, ph: sc.h }
        if (h==='move') { x=clamp(sc.x+dx,0,1-sc.w); y=clamp(sc.y+dy,0,1-sc.h) }
        else if (aspectRatio) {
           const centerX = sc.x + sc.w / 2
           const centerY = sc.y + sc.h / 2
           let nw = sc.w
           if (h.includes('l')) nw = sc.w - dx * 2
           if (h.includes('r')) nw = sc.w + dx * 2
           if (h.includes('t')) nw = Math.max(nw, (sc.h - dy * 2) * aspectRatio)
           if (h.includes('b')) nw = Math.max(nw, (sc.h + dy * 2) * aspectRatio)
           nw = clamp(nw, min, 1)
           let nh = nw / aspectRatio
           if (nh > 1) { nh = 1; nw = nh * aspectRatio }
           x = clamp(centerX - nw / 2, 0, 1 - nw)
           y = clamp(centerY - nh / 2, 0, 1 - nh)
           w = nw; ph = nh
        } else {
          if (h==='tl'||h==='tc'||h==='tr') { const ny=clamp(sc.y+dy,0,sc.y+sc.h-min); ph=sc.h+(sc.y-ny); y=ny }
          if (h==='bl'||h==='bc'||h==='br') { ph=clamp(sc.h+dy,min,1-sc.y) }
          if (h==='tl'||h==='ml'||h==='bl') { const nx=clamp(sc.x+dx,0,sc.x+sc.w-min); w=sc.w+(sc.x-nx); x=nx }
          if (h==='tr'||h==='mr'||h==='br') { w=clamp(sc.w+dx,min,1-sc.x) }
        }
        return { x:clamp(x), y:clamp(y), w:clamp(w,min,1-x), h:clamp(ph,min,1-y) }
      })
    }
    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onUp)
  }, [crop])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const handles: { id: Handle; style: React.CSSProperties }[] = [
    { id:'tl', style:{top:-7,left:-7,cursor:'nw-resize'} },
    { id:'tc', style:{top:-7,left:'50%',transform:'translateX(-50%)',cursor:'n-resize'} },
    { id:'tr', style:{top:-7,right:-7,cursor:'ne-resize'} },
    { id:'ml', style:{top:'50%',left:-7,transform:'translateY(-50%)',cursor:'w-resize'} },
    { id:'mr', style:{top:'50%',right:-7,transform:'translateY(-50%)',cursor:'e-resize'} },
    { id:'bl', style:{bottom:-7,left:-7,cursor:'sw-resize'} },
    { id:'bc', style:{bottom:-7,left:'50%',transform:'translateX(-50%)',cursor:'s-resize'} },
    { id:'br', style:{bottom:-7,right:-7,cursor:'se-resize'} },
  ]

  const toolLabels: Record<ToolMode, string> = {
    crop: 'Rotate Angle', zoom: 'Zoom', contrast: 'Contrast', preview: 'Preview'
  }

  const modal = (
    <div
      className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
    >
      <div className="bg-white w-full sm:max-w-xl sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '96vh' }}>

        {/* ── Toolbar ── */}
        <div className="flex items-center border-b border-gray-200 bg-gray-50 shrink-0">
          {/* Back/rotate CCW quick icon */}
          <button onClick={rotateCCW} title="Rotate Left"
            className="px-4 py-3.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 border-r border-gray-200 transition-colors touch-manipulation">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"/>
            </svg>
          </button>

          {/* Tool buttons */}
          {([
            { id:'crop',    label:'Crop', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><circle cx="10" cy="10" r="6"/><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75L21 21M10.5 7.5v6m-3-3h6"/></svg> },
            { id:'zoom',    label:'Zoom', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><circle cx="10.5" cy="10.5" r="6.75"/><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75L21 21M10.5 7.5v6m-3-3h6"/></svg> },
            { id:'contrast',label:'Contrast', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 010 18V3z" fill="currentColor"/></svg> },
            { id:'preview', label:'Preview', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg> },
          ] as const).map(({ id, label, icon }) => (
            <button key={id}
              onClick={() => setActiveTool(id as ToolMode)}
              title={label}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors border-r border-gray-200 last:border-r-0 touch-manipulation ${
                activeTool === id ? 'text-blue-600 bg-blue-50 border-b-2 border-b-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}>
              {icon}
              <span className="text-[9px] font-bold hidden sm:block">{label}</span>
            </button>
          ))}
        </div>

        {/* ── Slider ── */}
        {!isPreview && (
          <div className="px-6 py-2.5 bg-gray-50 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-400 w-8 text-right">{sliderMin}</span>
              <input type="range" min={sliderMin} max={sliderMax} step={1}
                value={sliderValue}
                onChange={e => handleSlider(Number(e.target.value))}
                className="flex-1 h-2 rounded-full appearance-none cursor-pointer touch-manipulation"
                style={{
                  accentColor: '#2563eb',
                  background: `linear-gradient(to right,#2563eb ${((sliderValue-sliderMin)/(sliderMax-sliderMin))*100}%,#e5e7eb ${((sliderValue-sliderMin)/(sliderMax-sliderMin))*100}%)`
                }}
              />
              <span className="text-[10px] text-gray-400 w-8">{sliderMax}</span>
            </div>
            <p className="text-center text-[10px] font-bold text-blue-600 mt-1">
              {toolLabels[activeTool]}: {sliderValue}{activeTool === 'crop' ? '°' : activeTool === 'zoom' ? '%' : '%'}
            </p>
          </div>
        )}

        {/* ── Canvas area ── */}
        <div className="bg-gray-800 flex items-center justify-center relative overflow-hidden flex-1"
          style={{ minHeight: 200, maxHeight: 340 }}>

          {isPreview ? (
            /* ── Preview: show actual cropped+rotated+contrast result ── */
            isLoadingPreview ? (
              <div className="flex flex-col items-center gap-2 text-white/60">
                <svg className="w-7 h-7 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <span className="text-xs">Rendering preview…</span>
              </div>
            ) : previewUrl ? (
              <div className="flex flex-col items-center gap-2 p-3 w-full h-full">
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest shrink-0">Preview — final output</p>
                <img src={previewUrl} alt="Preview" className="max-h-[280px] max-w-full object-contain rounded shadow-lg border-2 border-white/20"/>
              </div>
            ) : (
              <p className="text-white/50 text-sm">Preview unavailable</p>
            )
          ) : (
            /* ── Edit mode: show image with crop overlay ── */
            <div ref={containerRef} className="relative select-none" style={{ display: 'inline-block' }}>
              <img
                ref={imgRef} src={src} alt="Edit" draggable={false}
                style={{
                  display: 'block', maxHeight: 320, maxWidth: '100%', objectFit: 'contain',
                  transform: `rotate(${rotation}deg) scale(${zoom})`,
                  transition: 'transform 0.25s ease',
                  filter: `contrast(${contrast}%)`,
                  userSelect: 'none',
                }}
              />
              {/* Dark mask */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'rgba(0,0,0,0.48)',
                clipPath: `polygon(0% 0%,100% 0%,100% 100%,0% 100%,0% ${crop.y*100}%,${crop.x*100}% ${crop.y*100}%,${crop.x*100}% ${(crop.y+crop.h)*100}%,${(crop.x+crop.w)*100}% ${(crop.y+crop.h)*100}%,${(crop.x+crop.w)*100}% ${crop.y*100}%,0% ${crop.y*100}%)`,
              }}/>
              {/* Crop box */}
              <div
                className="absolute border-2 border-white"
                style={{ left:`${crop.x*100}%`, top:`${crop.y*100}%`, width:`${crop.w*100}%`, height:`${crop.h*100}%`, cursor:'move', touchAction:'none' }}
                onMouseDown={e => startDrag(e, 'move')}
                onTouchStart={e => startTouchDrag(e, 'move')}
              >
                {/* Rule-of-thirds grid */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage:'linear-gradient(rgba(255,255,255,0.18) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.18) 1px,transparent 1px)',
                  backgroundSize:'33.33% 33.33%',
                }}/>
                {handles.map(({ id, style }) => (
                  <div key={id}
                    onMouseDown={e => startDrag(e, id)}
                    onTouchStart={e => startTouchDrag(e, id)}
                    style={{
                      position:'absolute', width:14, height:14, touchAction:'none',
                      background:'#fff', border:'2.5px solid #2563eb', borderRadius:3,
                      ...style,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Rotate buttons ── */}
        <div className="flex flex-col items-center gap-2.5 py-3.5 bg-white border-t border-gray-100 shrink-0">
          <div className="flex gap-3">
            <button onClick={rotateCCW}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-bold transition-all shadow-sm touch-manipulation">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"/>
              </svg>
              Rotate Left
            </button>
            <button onClick={rotateCW}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-bold transition-all shadow-sm touch-manipulation">
              Rotate Right
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3"/>
              </svg>
            </button>
          </div>
          <button onClick={resetRotate}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 font-semibold transition-colors touch-manipulation">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"/>
            </svg>
            Reset Rotate
          </button>
        </div>

        {/* ── Apply / Cancel ── */}
        <div className="flex gap-2 px-4 pb-4 pt-1 shrink-0">
          <button onClick={() => setCrop({ x:0.05,y:0.05,w:0.9,h:0.9 })}
            className="px-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors touch-manipulation">
            Reset
          </button>
          <button onClick={onClose}
            className="px-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors touch-manipulation">
            Cancel
          </button>
          <button onClick={handleApply}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-black transition-all shadow-sm touch-manipulation">
            ✓ Apply Crop &amp; Rotate
          </button>
        </div>
      </div>
    </div>
  )

  return ReactDOM.createPortal(modal, document.body)
}

export default ImageEditor
