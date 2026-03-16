import { useState } from 'react'
import type { CardSlot, SideDisplay, FateDieFace, SlotId, SetPreviewFn, SelectedCard } from '../types'
import { FATE_SLOTS } from '../data/cdgSolo'
import { PRIORITY_STYLE, SIDE_COLOR } from '../data/cards'

// ── 裏向きカードの描画 ────────────────────────────────────────────────
function CardBack({ size = 'normal' }: { size?: 'normal' | 'small' }) {
  const w = size === 'small' ? 48 : 58
  const h = size === 'small' ? 74 : 88
  return (
    <div style={{
      width: w, height: h, borderRadius: 6, flexShrink: 0,
      border: '1px solid rgba(100,116,139,0.35)',
      background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2040 50%, #1e3a5f 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: 16, opacity: 0.25 }}>🃏</span>
    </div>
  )
}

// ── 表向き1枚のカード描画 ─────────────────────────────────────────────
function CardFace({
  slot,
  highlight,
  selectable,
  constraint,
  onClick,
  onHover,
  onLeave,
}: {
  slot: CardSlot
  highlight: boolean
  selectable: boolean
  constraint: 'free' | 'event_only'
  onClick?: () => void
  onHover?: () => void
  onLeave?: () => void
}) {
  const card = slot.card!
  const [imgErr, setImgErr] = useState(false)

  // e< → オレンジグロー、通常 → ゴールドグロー
  const glowColor = !highlight ? 'transparent'
    : constraint === 'event_only' ? '#fb923c'
    : '#fbbf24'

  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      disabled={!selectable}
      title={card.name}
      style={{
        width: 58, height: 88, borderRadius: 7,
        padding: 0, overflow: 'hidden', flexShrink: 0,
        border: highlight
          ? `2px solid ${glowColor}`
          : '1px solid rgba(100,116,139,0.4)',
        cursor: selectable ? 'pointer' : 'default',
        opacity: selectable ? 1 : 0.45,
        boxShadow: highlight
          ? `0 0 10px ${glowColor}88, 0 0 20px ${glowColor}44`
          : 'none',
        transition: 'box-shadow 0.2s, border-color 0.2s, opacity 0.15s',
        background: 'none',
        position: 'relative',
      }}
    >
      {!imgErr ? (
        <img
          src={card.imagePath}
          alt={card.name}
          onError={() => setImgErr(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
        />
      ) : (
        // 画像なし時のフォールバック
        <div style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 4, padding: 4,
        }}>
          <span style={{
            fontSize: 15, fontWeight: 900, color: SIDE_COLOR[card.side],
          }}>
            {card.ops}
          </span>
          <span style={{ fontSize: 7, color: '#94a3b8', textAlign: 'center', lineHeight: 1.3 }}>
            {card.name}
          </span>
        </div>
      )}

      {/* スロット ID バッジ（左上） */}
      <div style={{
        position: 'absolute', top: 2, left: 2,
        width: 14, height: 14, borderRadius: 3,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 8, fontWeight: 800,
        color: highlight ? '#fbbf24' : '#64748b',
      }}>
        {slot.slotId}
      </div>

      {/* OPS バッジ（右上） */}
      <div style={{
        position: 'absolute', top: 2, right: 2,
        width: 14, height: 14, borderRadius: 3,
        background: PRIORITY_STYLE[card.priority]?.bg ?? '#475569',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 8, fontWeight: 900,
        color: PRIORITY_STYLE[card.priority]?.fg ?? '#fff',
        opacity: 0.9,
      }}>
        {card.ops}
      </div>

      {/* Event 限定バッジ */}
      {constraint === 'event_only' && selectable && (
        <div style={{
          position: 'absolute', bottom: 2, left: 2, right: 2,
          background: 'rgba(251,146,60,0.85)',
          fontSize: 7, fontWeight: 800, color: '#fff',
          textAlign: 'center', borderRadius: 2, padding: '1px 0',
        }}>
          EVT
        </div>
      )}
    </button>
  )
}

// ── スロット枠（裏向き / 空） ─────────────────────────────────────────
function SlotFrame({
  slotId,
  isEmpty,
  highlight,
}: {
  slotId: SlotId
  isEmpty: boolean
  highlight: boolean
}) {
  return (
    <div style={{
      width: 58, height: 88, borderRadius: 7, flexShrink: 0,
      border: `1px dashed ${highlight ? 'rgba(251,191,36,0.5)' : 'rgba(100,116,139,0.2)'}`,
      background: isEmpty ? 'rgba(255,255,255,0.02)' : 'transparent',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 4,
      position: 'relative',
    }}>
      <span style={{ fontSize: 9, color: '#334155', fontWeight: 700 }}>{slotId}</span>
      {isEmpty && <span style={{ fontSize: 8, color: '#1e293b' }}>空</span>}
    </div>
  )
}

// ── Cards Remaining トラッカー ────────────────────────────────────────
function CardsRemainingTrack({
  remaining,
  max,
}: {
  remaining: number
  max: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 9, color: '#475569', whiteSpace: 'nowrap' }}>
        Cards Remaining
      </span>
      <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {Array.from({ length: max }, (_, i) => (
          <div
            key={i}
            style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i < remaining
                ? (remaining <= 2 ? '#f59e0b' : '#34d399')
                : '#1e293b',
              border: `1px solid ${i < remaining ? (remaining <= 2 ? '#f59e0b44' : '#34d39944') : '#334155'}`,
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>
      <span style={{
        fontSize: 12, fontWeight: 900, minWidth: 16, textAlign: 'right',
        color: remaining === 0 ? '#dc2626' : remaining <= 2 ? '#f59e0b' : '#34d399',
      }}>
        {remaining}
      </span>
    </div>
  )
}

// ── メインコンポーネント ──────────────────────────────────────────────
export function CDGCardDisplay({
  side,
  display,
  isActive,
  isPlayerSide,
  fateDieFace,
  constraint,
  onSelectCard,
  setPreview,
}: {
  side: 'Rome' | 'Carthage'
  display: SideDisplay
  isActive: boolean
  isPlayerSide: boolean
  fateDieFace: FateDieFace | null
  constraint: 'free' | 'event_only'
  onSelectCard: (selected: SelectedCard) => void
  setPreview: SetPreviewFn
}) {
  const sideColor = side === 'Carthage' ? '#60a5fa' : '#f87171'
  const availableSlots: SlotId[] = fateDieFace && isActive ? FATE_SLOTS[fateDieFace] : []

  // 選択可能かどうかの判定
  const isSlotSelectable = (slot: CardSlot): boolean => {
    if (!isActive || !isPlayerSide) return false
    if (!fateDieFace) return false
    if (!availableSlots.includes(slot.slotId)) return false
    if (!slot.faceUp || !slot.card) return false
    // e< の場合は最低 OPS のみ
    if (constraint === 'event_only') {
      const minOps = Math.min(
        ...display.slots
          .filter(s => s.faceUp && s.card)
          .map(s => s.card!.ops),
      )
      return slot.card.ops === minOps
    }
    return true
  }

  const handleSelect = (slot: CardSlot) => {
    if (!slot.card) return
    // CardInHand の index は CDG Solo では slotId で代替（index=0 固定）
    onSelectCard({
      fromSide: side,
      index: 0,
      card: { ...slot.card, slotId: slot.slotId },
      slotId: slot.slotId,
      constraint: isSlotSelectable(slot) ? constraint : 'free',
    })
  }

  const handleHover = (slot: CardSlot) => {
    if (!slot.card || !slot.faceUp) return
    setPreview({
      kind: 'card',
      name: slot.card.name,
      imagePath: slot.card.imagePath,
      isBack: false,
      priority: slot.card.priority,
    })
  }

  return (
    <div style={{
      background: isActive
        ? `linear-gradient(160deg, rgba(10,15,25,0.97) 0%, ${sideColor}0a 100%)`
        : 'rgba(10,15,25,0.97)',
      border: `1px solid ${isActive ? `${sideColor}44` : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 10,
      padding: '10px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      transition: 'border-color 0.2s, background 0.2s',
    }}>

      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: sideColor }}>{side}</span>
          {isActive && (
            <span style={{
              fontSize: 9, padding: '1px 6px', borderRadius: 3,
              background: `${sideColor}18`, border: `1px solid ${sideColor}44`,
              color: sideColor, fontWeight: 700,
            }}>
              ACTIVE
            </span>
          )}
          {!isPlayerSide && (
            <span style={{ fontSize: 9, color: '#334155', fontWeight: 600 }}>AI</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 9, color: '#334155' }}>Stock:</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>
            {display.stock.length}
          </span>
        </div>
      </div>

      {/* Cards Remaining トラッカー */}
      <CardsRemainingTrack remaining={display.cardsRemaining} max={display.maxHandSize} />

      {/* 5スロット */}
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
        {display.slots.map(slot => {
          const selectable = isSlotSelectable(slot)
          // e< 時はオレンジグロー、通常時はゴールドグロー
          const glowIsEvent = constraint === 'event_only'
          const highlighted = availableSlots.includes(slot.slotId)

          // AI サイド: 常に裏向き表示（スロット枠のみ）
          if (!isPlayerSide) {
            return (
              <div key={slot.slotId} style={{ position: 'relative' }}>
                {slot.card
                  ? <CardBack key={slot.slotId} />
                  : <SlotFrame slotId={slot.slotId} isEmpty highlight={false} />
                }
                {/* スロット ID */}
                <div style={{
                  position: 'absolute', top: 2, left: 2,
                  width: 14, height: 14, borderRadius: 3,
                  background: 'rgba(0,0,0,0.75)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, fontWeight: 800, color: '#334155',
                }}>
                  {slot.slotId}
                </div>
              </div>
            )
          }

          // プレイヤーサイド: 表/裏に応じて描画
          if (!slot.card) {
            return <SlotFrame key={slot.slotId} slotId={slot.slotId} isEmpty highlight={highlighted} />
          }

          if (!slot.faceUp) {
            const faceDownBorderColor = !highlighted ? 'rgba(100,116,139,0.25)'
              : glowIsEvent ? 'rgba(251,146,60,0.5)'
              : 'rgba(251,191,36,0.5)'
            const faceDownLabelColor = !highlighted ? '#334155'
              : glowIsEvent ? '#fb923c'
              : '#fbbf24'
            return (
              <div key={slot.slotId} style={{ position: 'relative' }}>
                <div style={{
                  width: 58, height: 88, borderRadius: 7, flexShrink: 0,
                  border: `1px solid ${faceDownBorderColor}`,
                  boxShadow: highlighted
                    ? `0 0 8px ${glowIsEvent ? 'rgba(251,146,60,0.35)' : 'rgba(251,191,36,0.35)'}`
                    : 'none',
                  background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2040 50%, #1e3a5f 100%)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 3,
                }}>
                  <span style={{ fontSize: 14, opacity: 0.2 }}>🃏</span>
                </div>
                <div style={{
                  position: 'absolute', top: 2, left: 2,
                  width: 14, height: 14, borderRadius: 3,
                  background: 'rgba(0,0,0,0.75)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, fontWeight: 800,
                  color: faceDownLabelColor,
                }}>
                  {slot.slotId}
                </div>
              </div>
            )
          }

          // 表向きカード（ハイライトは selectable なもののみ）
          return (
            <CardFace
              key={slot.slotId}
              slot={slot}
              highlight={selectable}
              selectable={selectable}
              constraint={constraint}
              onClick={selectable ? () => handleSelect(slot) : undefined}
              onHover={() => handleHover(slot)}
              onLeave={() => setPreview(null)}
            />
          )
        })}
      </div>

      {/* e< 説明 */}
      {constraint === 'event_only' && isActive && isPlayerSide && (
        <div style={{
          fontSize: 9, color: '#fb923c',
          background: 'rgba(251,146,60,0.08)',
          border: '1px solid rgba(251,146,60,0.25)',
          borderRadius: 4, padding: '4px 8px', lineHeight: 1.5,
        }}>
          e&lt; — 最低OPSカードを <strong>Event のみ</strong>でプレイ
        </div>
      )}

      {/* 未ロール時 / 手番外のガイド */}
      {isActive && isPlayerSide && !fateDieFace && display.cardsRemaining > 0 && (
        <p style={{ margin: 0, fontSize: 9, color: '#334155', textAlign: 'center' }}>
          Fate Die を振ってカードを選択
        </p>
      )}
    </div>
  )
}
