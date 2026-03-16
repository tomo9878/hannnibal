import { useState } from 'react'
import type { SelectedCard } from '../types'
import { SIDE_LABEL, SIDE_COLOR } from '../data/cards'

const opsSubBtnStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(59,130,246,0.25)',
  background: 'rgba(59,130,246,0.06)', color: '#bfdbfe',
  fontWeight: 600, fontSize: 12, cursor: 'pointer', textAlign: 'left', display: 'block', width: '100%',
}

export function CardActionModal({ selected, onPlay, onDiscard, onCancel }: {
  selected: SelectedCard
  onPlay: (mode: 'ops' | 'event', opsChoice?: 'move' | 'pc' | 'troops') => void
  onDiscard: () => void
  onCancel: () => void
}) {
  const { card } = selected
  const [imgError, setImgError] = useState(false)
  const [opsOpen, setOpsOpen] = useState(false)

  const sideColor  = SIDE_COLOR[card.side]
  const sideLabel  = SIDE_LABEL[card.side]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div style={{
        background: 'rgba(10,15,25,0.98)',
        border: '1px solid rgba(200,160,50,0.6)',
        borderRadius: 12,
        boxShadow: '0 8px 40px rgba(0,0,0,0.9)',
        width: 460,
        maxWidth: '95vw',
        overflow: 'hidden',
      }}>
        {/* ヘッダー */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16,
          borderBottom: '1px solid rgba(200,160,50,0.2)' }}>
          {/* カード画像 */}
          <div style={{ width: 70, height: 110, flexShrink: 0, borderRadius: 6,
            overflow: 'hidden', border: '1px solid rgba(200,160,50,0.4)' }}>
            {!imgError
              ? <img src={card.imagePath} alt={card.name} onError={() => setImgError(true)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', background: '#1e293b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                  <span style={{ fontSize: 8, color: '#94a3b8', textAlign: 'center' }}>{card.name}</span>
                </div>
            }
          </div>

          {/* カード情報 */}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#f0e6b0', margin: '0 0 6px', lineHeight: 1.3 }}>
              {card.name}
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
              {/* OPs バッジ */}
              <span style={{
                background: '#1e3a5f', border: '1px solid #3b82f6',
                color: '#93c5fd', fontSize: 11, fontWeight: 800,
                padding: '2px 8px', borderRadius: 4,
              }}>
                OPs: {card.ops}
              </span>
              {/* Side バッジ */}
              <span style={{
                background: `${sideColor}22`, border: `1px solid ${sideColor}66`,
                color: sideColor, fontSize: 11, fontWeight: 700,
                padding: '2px 8px', borderRadius: 4,
              }}>
                {sideLabel}
              </span>
              {card.counter && (
                <span style={{ background: '#78350f', border: '1px solid #d97706',
                  color: '#fbbf24', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                  Counter Event
                </span>
              )}
              {card.remove && (
                <span style={{ background: '#3f0a0a', border: '1px solid #dc2626',
                  color: '#fca5a5', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                  REMOVE IF PLAYED
                </span>
              )}
              {card.naval && (
                <span style={{ background: '#0c2a4a', border: '1px solid #0ea5e9',
                  color: '#7dd3fc', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                  海上移動可
                </span>
              )}
            </div>
            <p style={{ fontSize: 10, color: '#64748b', margin: 0 }}>
              {selected.fromSide} の手札 • Priority: {card.priority}
            </p>
          </div>
          <button onClick={onCancel}
            style={{ background: 'none', border: 'none', color: '#64748b',
              fontSize: 20, cursor: 'pointer', alignSelf: 'flex-start' }}>✕</button>
        </div>

        {/* アクション選択 */}
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* OPs 使用 */}
          <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: 8, overflow: 'hidden' }}>
            <button
              onClick={() => setOpsOpen(o => !o)}
              style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none',
                color: '#93c5fd', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left' }}
            >
              <span>OPs {card.ops} として使用</span>
              <span style={{ fontSize: 10, opacity: 0.7 }}>{opsOpen ? '▲' : '▼'} 使用目的を選択</span>
            </button>
            {opsOpen && (
              <div style={{ borderTop: '1px solid rgba(59,130,246,0.2)', padding: '8px 14px 12px',
                display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ fontSize: 10, color: '#64748b', margin: '0 0 6px' }}>
                  ※ 実際の移動・配置はマップ上で行ってください
                </p>
                <button
                  onClick={() => onPlay('ops', 'move')}
                  style={opsSubBtnStyle}
                >
                  将軍を活性化して移動
                  <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 6 }}>
                    SR ≤ {card.ops} の将軍、最大{card.ops === 3 ? 4 : card.ops === 2 ? 4 : 4}スペース
                  </span>
                </button>
                <button
                  onClick={() => onPlay('ops', 'pc')}
                  style={opsSubBtnStyle}
                >
                  PC を配置
                  <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 6 }}>
                    最大 {card.ops} 個、敵CU/PCのないスペース
                  </span>
                </button>
                {card.ops === 3 && (
                  <button
                    onClick={() => onPlay('ops', 'troops')}
                    style={opsSubBtnStyle}
                  >
                    補充 (Raise Troops)
                    <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 6 }}>
                      友軍将軍のいる友軍支配省に CU 1 個
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Event 使用 */}
          <button
            onClick={() => onPlay('event')}
            style={{
              padding: '10px 14px', borderRadius: 8, border: `1px solid ${sideColor}55`,
              background: `${sideColor}11`, color: sideColor,
              fontWeight: 700, fontSize: 13, cursor: 'pointer', textAlign: 'left',
            }}
          >
            Event として使用
            {card.remove && (
              <span style={{ marginLeft: 8, fontSize: 10, color: '#fca5a5' }}>
                → 使用後ゲームから廃棄
              </span>
            )}
          </button>

          {/* 捨て札 */}
          <button
            onClick={onDiscard}
            style={{
              padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(100,116,139,0.4)',
              background: 'rgba(100,116,139,0.08)', color: '#94a3b8',
              fontWeight: 700, fontSize: 13, cursor: 'pointer', textAlign: 'left',
            }}
          >
            捨て札にする（使用しない）
            <span style={{ marginLeft: 8, fontSize: 10, opacity: 0.7 }}>
              → 捨て札山へ（山札切れ時に再シャッフル）
            </span>
          </button>

          {/* 行き先の説明（自動処理） */}
          <div style={{
            padding: '8px 12px', borderRadius: 6, fontSize: 10, color: '#64748b',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(100,116,139,0.2)',
            lineHeight: 1.6,
          }}>
            <strong style={{ color: '#94a3b8' }}>カードの行き先（自動処理）：</strong><br />
            OPs使用 → 捨て札（再シャッフル対象）<br />
            Event使用{card.remove
              ? <span style={{ color: '#fca5a5' }}> → <strong>ゲームから廃棄</strong>（REMOVE IF PLAYED）</span>
              : ' → 捨て札（再シャッフル対象）'
            }
          </div>
        </div>
      </div>
    </div>
  )
}
