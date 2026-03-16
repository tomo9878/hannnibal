import { useState } from 'react'
import type { CardInHand, SetPreviewFn } from '../types'
import { PRIORITY_STYLE } from '../data/cards'

export function CardTile({ card, onReveal, onPreview, onPreviewEnd, selectable }: {
  card: CardInHand
  onReveal?: () => void
  onPreview?: SetPreviewFn
  onPreviewEnd?: () => void
  selectable?: boolean
}) {
  const [imgError, setImgError] = useState(false)
  const ps = PRIORITY_STYLE[card.priority] ?? { bg: '#475569', fg: '#fff' }
  const opsColor = card.ops === 3 ? '#fbbf24' : card.ops === 2 ? '#86efac' : '#94a3b8'

  const hoverIn  = () => onPreview?.({ kind: 'card', name: card.name, imagePath: card.imagePath, isBack: !card.isRevealed, priority: card.priority })
  const hoverOut = () => onPreviewEnd?.()

  if (!card.isRevealed) {
    return (
      <button
        onClick={onReveal}
        onMouseEnter={hoverIn} onMouseLeave={hoverOut}
        title="クリックで公開"
        className="relative flex flex-col items-center justify-center gap-1 rounded-md border-2 border-slate-600 bg-slate-700 hover:border-yellow-400 hover:bg-slate-600 transition-colors"
        style={{ width: 52, height: 82 }}
      >
        <span className="text-2xl font-black leading-none rounded px-1" style={{ color: ps.fg, backgroundColor: ps.bg }}>
          {card.priority}
        </span>
        <span className="text-slate-500 text-lg leading-none">?</span>
      </button>
    )
  }

  return (
    <div
      className="relative flex flex-col rounded-md overflow-hidden"
      onMouseEnter={hoverIn} onMouseLeave={hoverOut}
      style={{
        width: 52, height: 82,
        border: selectable ? '2px solid #fbbf24' : '1px solid #475569',
        boxShadow: selectable ? '0 0 8px rgba(251,191,36,0.5)' : 'none',
        transition: 'box-shadow 0.15s, border 0.15s',
        cursor: selectable ? 'pointer' : 'default',
      }}
    >
      {/* OPs バッジ（左上） */}
      <div style={{
        position: 'absolute', top: 0, left: 0, zIndex: 10,
        background: ps.bg, color: ps.fg,
        fontSize: 9, fontWeight: 800, padding: '1px 4px', lineHeight: '16px',
      }}>
        {card.priority}
      </div>
      {/* OPs数（右上） */}
      <div style={{
        position: 'absolute', top: 0, right: 0, zIndex: 10,
        background: 'rgba(0,0,0,0.75)', color: opsColor,
        fontSize: 10, fontWeight: 900, padding: '1px 4px', lineHeight: '16px',
      }}>
        {card.ops}
      </div>
      {!imgError ? (
        <img src={card.imagePath} alt={card.name} onError={() => setImgError(true)} className="w-full h-full object-cover" />
      ) : (
        <div className="flex-1 flex items-center justify-center px-1 pt-5 pb-1 bg-slate-600">
          <span className="text-slate-100 text-center leading-tight" style={{ fontSize: 8 }}>{card.name}</span>
        </div>
      )}
      {/* Remove if played インジケーター */}
      {card.remove && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'rgba(220,38,38,0.85)', height: 3,
        }} />
      )}
      {/* Counter event インジケーター */}
      {card.counter && (
        <div style={{
          position: 'absolute', bottom: card.remove ? 3 : 0, left: 0, right: 0,
          background: 'rgba(217,119,6,0.85)', height: 3,
        }} />
      )}
    </div>
  )
}
