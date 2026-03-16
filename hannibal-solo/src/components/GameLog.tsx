import { useRef, useEffect } from 'react'
import type { LogEntry, GamePhase } from '../types'
import { PHASE_LABELS } from '../data/gameConstants'

const PHASE_COLORS: Record<GamePhase, string> = {
  Strategy:  '#10b981',
  Action:    '#3b82f6',
  Attrition: '#f59e0b',
  PC:        '#8b5cf6',
  Consular:  '#ef4444',
}

export function GameLog({ entries }: { entries: LogEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries])

  return (
    <div className="bg-slate-800 rounded flex flex-col" style={{ minHeight: 0, maxHeight: 240 }}>
      <div style={{ padding: '8px 12px 4px', borderBottom: '1px solid rgba(200,160,50,0.2)', flexShrink: 0 }}>
        <h2 className="text-yellow-400 font-bold text-xs tracking-wide uppercase">Game Log / Assistant</h2>
      </div>
      <div ref={scrollRef} style={{ overflowY: 'auto', flex: 1, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {entries.map(entry => (
          <div key={entry.id} style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${PHASE_COLORS[entry.phase]}33`,
            borderLeft: `3px solid ${PHASE_COLORS[entry.phase]}`,
            borderRadius: 4, padding: '5px 8px',
          }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
              <span style={{
                fontSize: 9, fontWeight: 700, color: PHASE_COLORS[entry.phase],
                textTransform: 'uppercase', letterSpacing: 0.5,
              }}>
                T{entry.turn} {PHASE_LABELS[entry.phase]}
              </span>
            </div>
            <p style={{ fontSize: 10, color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>{entry.message}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
