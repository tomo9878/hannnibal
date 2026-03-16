import { useState, useRef, useEffect } from 'react'
import type { City, BoardPiece, SelectionState, DragState, SetPreviewFn } from '../types'
import { SNAP_THRESHOLD, PIECE_SIZE, PC_SIZE } from '../data/generals'

export function MapBoard({ cities, setPreview, setSelection, pieces, setPieces }: {
  cities: City[]
  setPreview: SetPreviewFn
  setSelection: (sel: SelectionState) => void
  pieces: BoardPiece[]
  setPieces: React.Dispatch<React.SetStateAction<BoardPiece[]>>
}) {
  const canvasRef       = useRef<HTMLCanvasElement>(null)
  const wrapperRef      = useRef<HTMLDivElement>(null)
  const dragRef         = useRef<DragState | null>(null)
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null)

  const [drag,        setDrag]        = useState<DragState | null>(null)
  const [contextMenu, setContextMenu] = useState<{ screenX: number; screenY: number; city: City } | null>(null)
  const [, forceUpdate] = useState(0)

  useEffect(() => { dragRef.current = drag }, [drag])

  const getScale = () => {
    const c = canvasRef.current
    if (!c || !c.width) return { sx: 1, sy: 1 }
    const r = c.getBoundingClientRect()
    if (!r.width) return { sx: 1, sy: 1 }
    return { sx: c.width / r.width, sy: c.height / r.height }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.src = '/images/maps-mainmap.png'
    img.onload = () => {
      canvas.width  = img.naturalWidth
      canvas.height = img.naturalHeight
      ctx.drawImage(img, 0, 0)
      for (const city of cities) {
        const isRome = city.name.includes('Rome') || city.name.includes('Rest Position')
        ctx.beginPath()
        ctx.arc(city.x, city.y, 6, 0, Math.PI * 2)
        ctx.fillStyle = isRome ? '#ef4444' : '#facc15'
        ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.75)'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
      forceUpdate(n => n + 1)
    }
    img.onerror = (err) => console.error('[MapBoard] image load FAILED:', err)
  }, [cities])

  useEffect(() => {
    const handler = () => forceUpdate(n => n + 1)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current
      if (!d) return
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      setDrag(prev => prev
        ? { ...prev, currentX: e.clientX - rect.left - d.offsetX, currentY: e.clientY - rect.top - d.offsetY }
        : null
      )
    }

    const onUp = (e: MouseEvent) => {
      const d = dragRef.current
      if (!d) return

      const startPos = mouseDownPosRef.current
      const moved = startPos ? Math.hypot(e.clientX - startPos.x, e.clientY - startPos.y) : 999
      mouseDownPosRef.current = null
      if (moved < 6) {
        setSelection({ kind: 'general', pieceId: d.pieceId })
        setDrag(null)
        return
      }

      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const { sx, sy } = getScale()

      const cx = (e.clientX - rect.left - d.offsetX) * sx
      const cy = (e.clientY - rect.top  - d.offsetY) * sy

      let finalX = cx, finalY = cy, minDist = Infinity
      for (const city of cities) {
        const dist = Math.hypot(city.x - cx, city.y - cy)
        if (dist < SNAP_THRESHOLD && dist < minDist) {
          minDist = dist; finalX = city.x; finalY = city.y
        }
      }

      const canvas = canvasRef.current
      if (canvas) {
        finalX = Math.max(0, Math.min(canvas.width,  finalX))
        finalY = Math.max(0, Math.min(canvas.height, finalY))
      }

      setPieces(prev => prev.map(p => p.id === d.pieceId ? { ...p, x: finalX, y: finalY } : p))
      setDrag(null)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
  }, [cities])

  const handlePieceMouseDown = (pieceId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY }
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const { sx, sy } = getScale()
    const piece = pieces.find(p => p.id === pieceId)!
    const dispX = piece.x / sx
    const dispY = piece.y / sy
    setDrag({ pieceId, offsetX: e.clientX - rect.left - dispX, offsetY: e.clientY - rect.top - dispY, currentX: dispX, currentY: dispY })
  }

  useEffect(() => {
    if (!contextMenu) return
    const close = () => setContextMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [contextMenu])

  const handleContextMenu = (e: React.MouseEvent, fromCanvas = false) => {
    e.preventDefault()
    e.stopPropagation()
    const { sx, sy } = getScale()
    const rect = canvasRef.current!.getBoundingClientRect()
    const cx = (e.clientX - rect.left) * sx
    const cy = (e.clientY - rect.top)  * sy
    let nearest: City | null = null, minDist = Infinity
    const threshold = fromCanvas ? 30 : 60
    for (const city of cities) {
      const d = Math.hypot(city.x - cx, city.y - cy)
      if (d < threshold && d < minDist) { minDist = d; nearest = city }
    }
    if (nearest) setContextMenu({ screenX: e.clientX, screenY: e.clientY, city: nearest })
  }

  const setPCAt = (city: City, side: 'Rome' | 'Carthage' | 'Neutral') => {
    setPieces(prev => {
      const filtered = prev.filter(p =>
        !(p.type === 'PC' && Math.round(p.x) === Math.round(city.x) && Math.round(p.y) === Math.round(city.y))
      )
      if (side === 'Neutral') return filtered
      return [...filtered, {
        id: `pc-${side.toLowerCase()}-${city.name}`,
        type: 'PC' as const,
        x: city.x, y: city.y,
        imagePath: side === 'Rome' ? '/images/tkn-PC-RomePC.png' : '/images/tkn-PC-CarthPC.png',
      }]
    })
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragRef.current) return
    const { sx, sy } = getScale()
    const rect = canvasRef.current!.getBoundingClientRect()
    const cx = (e.clientX - rect.left) * sx
    const cy = (e.clientY - rect.top)  * sy
    let nearest: City | null = null, minDist = Infinity
    for (const city of cities) {
      const d = Math.hypot(city.x - cx, city.y - cy)
      if (d < 20 && d < minDist) { minDist = d; nearest = city }
    }
    if (nearest) {
      const cityPieces = pieces.filter(p =>
        Math.round(p.x) === Math.round(nearest!.x) && Math.round(p.y) === Math.round(nearest!.y)
      )
      setPreview({ kind: 'city', city: nearest, pieces: cityPieces })
    } else {
      setPreview(null)
    }
  }

  const stackMap = new Map<string, string[]>()
  for (const p of pieces) {
    if (p.id === drag?.pieceId || p.type === 'PC') continue
    const key = `${Math.round(p.x)},${Math.round(p.y)}`
    const arr = stackMap.get(key) ?? []
    arr.push(p.id)
    stackMap.set(key, arr)
  }

  const { sx, sy } = getScale()

  return (
    <div ref={wrapperRef} className="relative w-full select-none">
      <canvas
        ref={canvasRef}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={() => { if (!drag) setPreview(null) }}
        onContextMenu={(e) => handleContextMenu(e, true)}
        onClick={(e) => {
          if (dragRef.current) return
          const { sx, sy } = getScale()
          const rect = canvasRef.current!.getBoundingClientRect()
          const cx = (e.clientX - rect.left) * sx
          const cy = (e.clientY - rect.top)  * sy
          let nearest: City | null = null, minDist = Infinity
          for (const city of cities) {
            const d = Math.hypot(city.x - cx, city.y - cy)
            if (d < 20 && d < minDist) { minDist = d; nearest = city }
          }
          if (nearest) setSelection({ kind: 'city', cityName: nearest.name })
          else setSelection(null)
        }}
        style={{ maxWidth: '100%', height: 'auto', display: 'block', cursor: drag ? 'grabbing' : 'crosshair' }}
      />

      {pieces.filter(p => p.type === 'PC').map((piece) => (
        <div
          key={piece.id}
          style={{
            position: 'absolute',
            left: piece.x / sx - PC_SIZE / 2,
            top:  piece.y / sy - PC_SIZE / 2,
            width: PC_SIZE, height: PC_SIZE,
            zIndex: 4, pointerEvents: 'none',
          }}
        >
          <img src={piece.imagePath} alt="PC" draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'contain',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }} />
        </div>
      ))}

      {pieces.filter(p => p.type !== 'PC').map((piece) => {
        const isDragging = drag?.pieceId === piece.id
        let dispX: number, dispY: number

        if (isDragging && drag) {
          dispX = drag.currentX
          dispY = drag.currentY
        } else {
          const key   = `${Math.round(piece.x)},${Math.round(piece.y)}`
          const group = stackMap.get(key) ?? []
          const si    = group.indexOf(piece.id)
          dispX = piece.x / sx + si * 12
          dispY = piece.y / sy + si * -4
        }

        return (
          <div
            key={piece.id}
            onMouseDown={(e) => handlePieceMouseDown(piece.id, e)}
            onContextMenu={(e) => handleContextMenu(e)}
            onMouseEnter={() => {
              if (drag) return
              const key = `${Math.round(piece.x)},${Math.round(piece.y)}`
              const others = pieces.filter(p => p.type !== 'PC' && p.id !== piece.id && `${Math.round(p.x)},${Math.round(p.y)}` === key)
              setPreview({ kind: 'piece', piece, stackedWith: others })
            }}
            onMouseLeave={() => setPreview(null)}
            style={{
              position:  'absolute',
              left:      dispX - PIECE_SIZE / 2,
              top:       dispY - PIECE_SIZE / 2,
              width:     PIECE_SIZE,
              height:    PIECE_SIZE,
              zIndex:    isDragging ? 50 : 10,
              cursor:    isDragging ? 'grabbing' : 'grab',
              filter:    isDragging
                ? 'drop-shadow(0 0 5px rgba(255,220,0,0.95))'
                : 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))',
              transition: isDragging ? 'none' : 'filter 0.1s',
            }}
          >
            <img
              src={piece.imagePath}
              alt={piece.label ?? piece.type}
              draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
            />
            {piece.label && !isDragging && (
              <div style={{
                position: 'absolute', bottom: -10, left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 8, color: 'white', whiteSpace: 'nowrap',
                textShadow: '0 0 3px #000, 0 0 3px #000',
                pointerEvents: 'none',
              }}>
                {piece.label}
              </div>
            )}
            {piece.type === 'General' && piece.strength !== undefined && !isDragging && (
              <div style={{
                position: 'absolute', top: -6, right: -6,
                minWidth: 15, height: 15, borderRadius: 8,
                background: '#1e293b', border: '1px solid #fbbf24',
                fontSize: 9, fontWeight: 900, color: '#fbbf24',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 2px', pointerEvents: 'none',
              }}>
                {piece.strength}
              </div>
            )}
          </div>
        )
      })}

      {contextMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: contextMenu.screenX,
            top:  contextMenu.screenY,
            zIndex: 300,
            background: 'rgba(10, 15, 25, 0.97)',
            border: '1px solid rgba(200,160,50,0.6)',
            borderRadius: 8,
            boxShadow: '0 4px 24px rgba(0,0,0,0.85)',
            minWidth: 170,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '6px 12px 5px', borderBottom: '1px solid rgba(200,160,50,0.2)',
            fontSize: 11, color: '#c8a840', fontWeight: 700 }}>
            {contextMenu.city.name.includes(' - ')
              ? contextMenu.city.name.split(' - ')[1]
              : contextMenu.city.name}
          </div>
          {([
            { label: '🔴 Rome',     side: 'Rome'     as const, color: '#f87171' },
            { label: '🔵 Carthage', side: 'Carthage' as const, color: '#60a5fa' },
            { label: '⚪ Neutral',  side: 'Neutral'  as const, color: '#94a3b8' },
          ] as const).map(({ label, side, color }) => (
            <button
              key={side}
              onClick={() => { setPCAt(contextMenu.city, side); setContextMenu(null) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '7px 14px', fontSize: 12, color,
                background: 'none', border: 'none', cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
