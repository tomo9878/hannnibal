import { useState } from 'react'
import type { FateDieFace } from '../types'
import { FATE_SLOTS } from '../data/cdgSolo'

// ── Fate Die 各面の表示定義 ───────────────────────────────────────────
const FACE_META: Record<FateDieFace, { label: string; color: string; desc: string }> = {
  'C<!!' : { label: 'C< !!', color: '#f87171', desc: 'スロット A・B から選択（Hannibal: AB 扱い）' },
  'e<'   : { label: 'e<',    color: '#fb923c', desc: '最低 OPS カードを Event のみで使用' },
  'ABC'  : { label: 'ABC',   color: '#34d399', desc: 'スロット A・B・C から選択' },
  'AB'   : { label: 'AB',    color: '#60a5fa', desc: 'スロット A・B から選択' },
  'CDE'  : { label: 'CDE',   color: '#a78bfa', desc: 'スロット C・D・E から選択' },
  'DE'   : { label: 'DE',    color: '#f59e0b', desc: 'スロット D・E から選択' },
}

// ── アニメーション付きダイス表示 ─────────────────────────────────────
function DieFaceDisplay({ face, rolling }: { face: FateDieFace | null; rolling: boolean }) {
  const meta = face ? FACE_META[face] : null

  return (
    <div style={{
      width: 80, height: 80, borderRadius: 14,
      background: rolling
        ? 'rgba(255,255,255,0.08)'
        : meta
          ? `${meta.color}18`
          : 'rgba(255,255,255,0.05)',
      border: `2px solid ${rolling ? 'rgba(255,255,255,0.2)' : meta ? `${meta.color}66` : 'rgba(255,255,255,0.1)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.15s',
      boxShadow: meta && !rolling ? `0 0 18px ${meta.color}33` : 'none',
      flexShrink: 0,
    }}>
      {rolling ? (
        <span style={{ fontSize: 28, opacity: 0.4, animation: 'spin 0.15s linear infinite' }}>⬡</span>
      ) : meta ? (
        <span style={{
          fontSize: meta.label.length <= 2 ? 26 : 20,
          fontWeight: 900,
          color: meta.color,
          letterSpacing: meta.label.length >= 3 ? -1 : 0,
          fontFamily: 'monospace',
        }}>
          {meta.label}
        </span>
      ) : (
        <span style={{ fontSize: 24, opacity: 0.2 }}>?</span>
      )}
    </div>
  )
}

// ── スロットバッジ ────────────────────────────────────────────────────
function SlotBadge({ slotId, highlight }: { slotId: string; highlight: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 22, height: 22, borderRadius: 5,
      fontSize: 11, fontWeight: 800,
      background: highlight ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.06)',
      border: `1px solid ${highlight ? 'rgba(251,191,36,0.7)' : 'rgba(255,255,255,0.15)'}`,
      color: highlight ? '#fbbf24' : '#475569',
      transition: 'all 0.2s',
    }}>
      {slotId}
    </span>
  )
}

// ── メインコンポーネント ──────────────────────────────────────────────
export function FateDiePanel({
  activeSide,
  cardsRemaining,
  result,
  constraint,
  onRoll,
  disabled,
}: {
  activeSide: 'Rome' | 'Carthage'
  cardsRemaining: number
  result: FateDieFace | null
  constraint: 'free' | 'event_only'
  onRoll: () => void
  disabled: boolean
}) {
  const [rolling, setRolling] = useState(false)

  const handleRoll = () => {
    if (disabled || rolling) return
    setRolling(true)
    // 短いアニメーション後に実際のロール
    setTimeout(() => {
      setRolling(false)
      onRoll()
    }, 350)
  }

  const meta = result ? FACE_META[result] : null
  const availableSlots = result ? FATE_SLOTS[result] : []
  const sideColor = activeSide === 'Carthage' ? '#60a5fa' : '#f87171'
  const exhausted = cardsRemaining === 0

  return (
    <div style={{
      background: 'rgba(0,0,0,0.35)',
      border: '1px solid rgba(200,160,50,0.25)',
      borderRadius: 10,
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>

      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#c8a840', letterSpacing: 0.5 }}>
            🎲 Fate Die
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 4,
            background: `${sideColor}18`, border: `1px solid ${sideColor}44`,
            color: sideColor,
          }}>
            {activeSide}
          </span>
        </div>
        {/* Cards Remaining */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 9, color: '#475569' }}>Cards Remaining</span>
          <span style={{
            fontSize: 14, fontWeight: 900,
            color: exhausted ? '#dc2626' : cardsRemaining <= 2 ? '#f59e0b' : '#34d399',
          }}>
            {cardsRemaining}
          </span>
        </div>
      </div>

      {/* ダイス + 結果 */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <DieFaceDisplay face={result} rolling={rolling} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* 結果テキスト */}
          {meta && !rolling ? (
            <>
              <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
                {meta.desc}
              </p>
              {/* e< 制約バッジ */}
              {constraint === 'event_only' && (
                <div style={{
                  fontSize: 10, fontWeight: 700, color: '#fb923c',
                  background: 'rgba(251,146,60,0.12)',
                  border: '1px solid rgba(251,146,60,0.4)',
                  borderRadius: 4, padding: '2px 7px', alignSelf: 'flex-start',
                }}>
                  ⚠ Event のみ使用可
                </div>
              )}
              {/* 対象スロット */}
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <span style={{ fontSize: 9, color: '#475569' }}>対象:</span>
                {(['A','B','C','D','E'] as const).map(s => (
                  <SlotBadge key={s} slotId={s} highlight={availableSlots.includes(s)} />
                ))}
              </div>
            </>
          ) : !rolling ? (
            <p style={{ margin: 0, fontSize: 11, color: '#475569' }}>
              {exhausted
                ? 'Cards Remaining が 0 になりました。手番終了です。'
                : 'ダイスを振ってカードを選択してください。'}
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>ロール中…</p>
          )}
        </div>
      </div>

      {/* ロールボタン */}
      {!exhausted && !result && (
        <button
          onClick={handleRoll}
          disabled={disabled || rolling}
          style={{
            background: rolling
              ? 'rgba(200,168,64,0.15)'
              : 'linear-gradient(135deg, rgba(200,168,64,0.25), rgba(200,168,64,0.12))',
            border: `1px solid ${rolling ? 'rgba(200,168,64,0.3)' : 'rgba(200,168,64,0.6)'}`,
            borderRadius: 7, padding: '8px 0',
            color: rolling ? '#64748b' : '#c8a840',
            fontWeight: 800, fontSize: 13, cursor: rolling ? 'default' : 'pointer',
            width: '100%', letterSpacing: 0.5,
            transition: 'all 0.15s',
          }}
        >
          {rolling ? '🎲 …' : '🎲 Fate Die を振る'}
        </button>
      )}

      {/* 手番終了メッセージ */}
      {exhausted && (
        <div style={{
          background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)',
          borderRadius: 6, padding: '6px 10px', fontSize: 11,
          color: '#f87171', textAlign: 'center', fontWeight: 700,
        }}>
          手番終了 — 相手サイドへ
        </div>
      )}

      {/* ロール済みインジケーター */}
      {result && !exhausted && (
        <div style={{
          fontSize: 10, color: '#475569', textAlign: 'center',
        }}>
          カードをプレイしてスロットを補充すると次のロールが可能になります
        </div>
      )}
    </div>
  )
}
