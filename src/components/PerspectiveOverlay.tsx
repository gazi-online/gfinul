import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Point } from '../lib/perspective'

interface Props {
  width: number
  height: number
  points: Point[]
  onChange: (points: Point[]) => void
}

export const PerspectiveOverlay: React.FC<Props> = ({ width, height, points, onChange }) => {
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (idx: number) => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setDraggingIdx(idx)
  }

  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (draggingIdx === null || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    const x = Math.max(0, Math.min(width, clientX - rect.left))
    const y = Math.max(0, Math.min(height, clientY - rect.top))

    const newPoints = [...points]
    newPoints[draggingIdx] = { x, y }
    onChange(newPoints)
  }, [draggingIdx, points, width, height, onChange])

  const handleEnd = useCallback(() => {
    setDraggingIdx(null)
  }, [])

  useEffect(() => {
    if (draggingIdx !== null) {
      window.addEventListener('mousemove', handleMove)
      window.addEventListener('mouseup', handleEnd)
      window.addEventListener('touchmove', handleMove)
      window.addEventListener('touchend', handleEnd)
    } else {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleEnd)
    }
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [draggingIdx, handleMove, handleEnd])

  const polyPoints = points.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 z-10 overflow-hidden cursor-crosshair touch-none"
      style={{ width, height }}
    >
      <svg className="absolute inset-0 w-full h-full drop-shadow-lg">
        {/* Shadow Polygon */}
        <polygon 
          points={polyPoints} 
          fill="rgba(59, 130, 246, 0.1)" 
          stroke="rgba(59, 130, 246, 0.5)" 
          strokeWidth="2" 
        />
        {/* Connecting Lines */}
        <line x1={points[0].x} y1={points[0].y} x2={points[1].x} y2={points[1].y} stroke="white" strokeWidth="1" strokeDasharray="4 2" />
        <line x1={points[1].x} y1={points[1].y} x2={points[2].x} y2={points[2].y} stroke="white" strokeWidth="1" strokeDasharray="4 2" />
        <line x1={points[2].x} y1={points[2].y} x2={points[3].x} y2={points[3].y} stroke="white" strokeWidth="1" strokeDasharray="4 2" />
        <line x1={points[3].x} y1={points[3].y} x2={points[0].x} y2={points[0].y} stroke="white" strokeWidth="1" strokeDasharray="4 2" />
      </svg>

      {points.map((p, i) => (
        <div
          key={i}
          onMouseDown={handleMouseDown(i)}
          onTouchStart={handleMouseDown(i)}
          className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-white shadow-lg transition-transform active:scale-125 cursor-move flex items-center justify-center ${
            draggingIdx === i ? 'bg-blue-600 scale-125' : 'bg-blue-500 hover:bg-blue-600'
          }`}
          style={{ left: p.x, top: p.y }}
        >
          <div className="w-1.5 h-1.5 bg-white rounded-full" />
        </div>
      ))}
      
      {/* Label Indicators */}
      {points.map((p, i) => (
        <div key={`lbl-${i}`}
          className="absolute pointer-events-none text-[8px] font-black text-white bg-blue-600/80 px-1 rounded uppercase tracking-tighter shadow-sm"
          style={{ left: p.x + 8, top: p.y + 8 }}
        >
          {['TL', 'TR', 'BR', 'BL'][i]}
        </div>
      ))}
    </div>
  )
}
