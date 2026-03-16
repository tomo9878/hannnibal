import { useState, useRef, useEffect } from 'react'
import type { BattleRoundRecord, SetPreviewFn } from '../types'
import { BATTLE_CARD_TYPES } from '../data/cards'
import { GENERAL_STATS, ELITE_GENERALS } from '../data/generals'
import { shuffle } from '../utils'

const spinBtnStyle = (bg: string): React.CSSProperties => ({
  width: 26, height: 26, borderRadius: 5, background: bg,
  border: 'none', color: 'white', fontSize: 16, fontWeight: 700,
  cursor: 'pointer', lineHeight: 1, flexShrink: 0,
})

function BattleCardBack() {
  return (
    <div style={{
      width: 58, height: 90, borderRadius: 6, overflow: 'hidden', flexShrink: 0,
      border: '1px solid rgba(100,116,139,0.4)',
      background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2040 50%, #1e3a5f 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: 20, opacity: 0.35 }}>🛡</span>
    </div>
  )
}

function BattleCardBtn({ name, onClick, disabled, highlight }: {
  name: string
  onClick?: () => void
  disabled?: boolean
  highlight?: boolean
}) {
  const [imgErr, setImgErr] = useState(false)
  const imgPath = BATTLE_CARD_TYPES.find(b => b.name === name)?.imagePath ?? ''
  const clickable = !!onClick && !disabled
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={name}
      style={{
        width: 58, height: 90, borderRadius: 6, overflow: 'hidden', padding: 0, flexShrink: 0,
        border: highlight ? '2px solid #fbbf24' : '1px solid rgba(100,116,139,0.5)',
        background: 'none', cursor: clickable ? 'pointer' : 'default',
        opacity: disabled ? 0.45 : 1,
        boxShadow: highlight ? '0 0 8px rgba(251,191,36,0.5)' : 'none',
        transition: 'opacity 0.15s, box-shadow 0.15s',
      }}
    >
      {!imgErr
        ? <img src={imgPath} alt={name} onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
        : <div style={{ width: '100%', height: '100%', background: '#1e293b',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 3 }}>
            <span style={{ fontSize: 7, color: '#cbd5e1', textAlign: 'center', lineHeight: 1.3 }}>{name}</span>
          </div>
      }
    </button>
  )
}

export function BattleResolverModal({ onClose, setPreview: _sv, humanSide = 'Carthage' }: { onClose: () => void; setPreview: SetPreviewFn; humanSide?: 'Rome' | 'Carthage' }) {
  // ── Setup state ──────────────────────────────────────────────────────
  const [atkSide,    setAtkSide]    = useState<'Rome' | 'Carthage'>(humanSide)
  const [atkGeneral, setAtkGeneral] = useState('Hannibal')
  const [defGeneral, setDefGeneral] = useState('P. Scipio')
  const [atkCU,      setAtkCU]      = useState(5)
  const [defCU,      setDefCU]      = useState(5)
  const [atkMods,    setAtkMods]    = useState(0)
  const [defMods,    setDefMods]    = useState(0)

  // ── Battle state ─────────────────────────────────────────────────────
  type BPhase = 'setup' | 'attack' | 'defend' | 'resolve' | 'ended'
  const [bPhase,          setBPhase]         = useState<BPhase>('setup')
  const [atkHand,         setAtkHand]        = useState<string[]>([])
  const [defHand,         setDefHand]        = useState<string[]>([])
  const [atkCard,         setAtkCard]        = useState<string | null>(null)
  const [defCard,         setDefCard]        = useState<string | null>(null)
  const [round,           setRound]          = useState(1)
  const [history,         setHistory]        = useState<BattleRoundRecord[]>([])
  const [aiLog,           setAiLog]          = useState<string[]>([])
  const [result,          setResult]         = useState<string | null>(null)
  const [resHeld,         setResHeld]        = useState(false)
  // currentAtkSide: 攻守交代後に変化する「現在の攻撃側」
  const [currentAtkSide,  setCurrentAtkSide] = useState<'Rome' | 'Carthage'>(atkSide)

  const logRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [aiLog])

  // ── Derived ───────────────────────────────────────────────────────────
  // currentAtkSide ベースで毎レンダー再計算（攻守交代に対応）
  const currentDefSide: 'Rome' | 'Carthage' = currentAtkSide === 'Rome' ? 'Carthage' : 'Rome'
  const aiSide   = humanSide === 'Rome' ? 'Carthage' : 'Rome'
  const AI_ATKS  = currentAtkSide === aiSide   // AI が現在の攻撃側
  const AI_DEFS  = currentAtkSide !== aiSide   // AI が現在の防御側

  // 初期設定の atkSide と比較して、現在どちらの将軍が攻撃/防御しているか
  const currentAtkGeneral = currentAtkSide === atkSide ? atkGeneral : defGeneral
  const currentDefGeneral = currentAtkSide === atkSide ? defGeneral : atkGeneral
  // AI 将軍（撤退判定で精鋭チェックに使用）
  const romeGeneral = atkSide === aiSide ? atkGeneral : defGeneral

  // setup 画面用（初期設定の defSide）
  const initialDefSide = atkSide === 'Rome' ? 'Carthage' : 'Rome'

  const getBR       = (n: string) => GENERAL_STATS[n]?.combat ?? 2
  const atkCards    = getBR(atkGeneral) + Math.min(atkCU, 10) + atkMods
  const defCards    = getBR(defGeneral) + Math.min(defCU, 10) + defMods
  const generals    = Object.keys(GENERAL_STATS)

  const appendLog = (msgs: string[]) => setAiLog(prev => [...prev, ...msgs])

  const endBattle = (resultMsg: string) => {
    setResult(resultMsg)
    setAiLog(prev => [...prev, '🔄 戦闘終了 — 場のカードと両陣営の手札を回収し、バトルデッキを初期状態にリセットします。'])
    setBPhase('ended')
  }

  const defHistory = history.map(h => h.def).filter(c => c !== '【敗走】')
  const atkHistory = history.map(h => h.atk)
  const mostCommon = (arr: string[]): string => {
    const c: Record<string, number> = {}
    for (const t of arr) c[t] = (c[t] ?? 0) + 1
    return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Frontal Assault'
  }

  // ── Start battle ──────────────────────────────────────────────────────
  const FULL_BATTLE_DECK = BATTLE_CARD_TYPES.flatMap(({ name, count }) =>
    Array.from({ length: count }, () => name)
  )

  const handleStart = () => {
    const total = atkCards + defCards
    const startLogs: string[] = [
      `⚔ 戦闘開始！`,
      `▶ 攻撃側: ${atkGeneral} (${atkSide}) — ${atkCards}枚  [BR:${getBR(atkGeneral)} + CU:${Math.min(atkCU,10)} + MOD:${atkMods}]`,
      `▷ 防御側: ${defGeneral} (${initialDefSide}) — ${defCards}枚  [BR:${getBR(defGeneral)} + CU:${Math.min(defCU,10)} + MOD:${defMods}]`,
    ]

    // デッキから必要枚数を引く。途中で切れたらリシャッフルして補充
    let deck = shuffle([...FULL_BATTLE_DECK])
    let drawn: string[] = []
    while (drawn.length < total) {
      if (deck.length === 0) {
        startLogs.push('⚠ 山札が切れました。バトルデッキをリシャッフルして新しい山札を作成します。')
        deck = shuffle([...FULL_BATTLE_DECK])
      }
      const need = total - drawn.length
      drawn = [...drawn, ...deck.splice(0, Math.min(need, deck.length))]
    }

    startLogs.push(`--- Round 1 ---`)

    setAtkHand(drawn.slice(0, atkCards))
    setDefHand(drawn.slice(atkCards))
    setAtkCard(null); setDefCard(null)
    setRound(1); setHistory([]); setResult(null); setResHeld(false)
    setCurrentAtkSide(atkSide)
    setAiLog(startLogs)
    setBPhase('attack')
  }

  // ── AI Attack algorithm ───────────────────────────────────────────────
  const doAIAttack = () => {
    const hand = [...(AI_ATKS ? atkHand : defHand)]
    if (hand.length === 0) { appendLog(['[AI] 手札なし']); return }

    // AI撤退判定: 元々の攻撃側が Rome の場合のみ（攻守交代後は撤退しない）
    if (currentAtkSide === atkSide) {
      const playerHandLeft = defHand.length
      if (hand.length < playerHandLeft) {
        const isElite = ELITE_GENERALS.has(romeGeneral)
        appendLog([
          `[AI撤退判定] AI手札:${hand.length} < Player手札:${playerHandLeft}`,
          isElite
            ? `  精鋭将軍(${romeGeneral}) — 撤退ロールに +1 修正（ルール参照）`
            : `  通常将軍 — 撤退実行`,
        ])
        if (!isElite) {
          endBattle(`AI撤退 → ${currentDefSide}（Player）の勝利！`)
          return
        }
      }
    }

    const msgs: string[] = [`[AI(${currentAtkSide})攻撃 R${round}] 手札: [${hand.join(' | ')}]`]
    let rHeld  = resHeld
    const consider = hand.slice(0, Math.min(2, hand.length))
    msgs.push(`仮ドロー: [${consider.join(', ')}]`)
    let pool = [...consider]

    // Reserve → holding slot
    const ri = pool.indexOf('Reserve')
    if (ri !== -1 && !rHeld) {
      pool.splice(ri, 1)
      rHeld = true
      msgs.push(`  → Reserve を温存スロットへ移動`)
      const rep = hand[2]
      if (rep) { pool.push(rep); msgs.push(`  → 代替: ${rep}`) }
    }

    let chosen: string

    if (pool.length >= 2 && pool[0] === pool[1]) {
      // 2 same type → check 3rd
      const used = new Set(consider)
      const third = hand.find(c => !used.has(c)) ?? hand[consider.length]
      msgs.push(`2枚同タイプ(${pool[0]}) — 3枚目: ${third ?? 'なし'}`)
      if (!third) {
        chosen = pool[0]
      } else if (third === pool[0]) {
        chosen = pool[0]
        msgs.push(`  3枚すべて同タイプ → 1枚使用、2枚を戻す`)
      } else {
        const oppH = AI_ATKS ? defHistory : atkHistory
        chosen = oppH.includes(pool[0]) ? pool[0] : third
        msgs.push(`  最適選択: ${chosen}（相手既出: [${oppH.join(', ') || 'なし'}]）`)
      }
    } else if (pool.length >= 1) {
      // Priority: type opponent has played (drain their matching cards)
      const oppH = AI_ATKS ? defHistory : atkHistory
      const preferred = pool.find(c => oppH.includes(c))
      if (preferred) {
        chosen = preferred
        msgs.push(`既出タイプ優先: ${chosen} (相手 ×${oppH.filter(t => t === chosen).length})`)
      } else if (rHeld) {
        const mc = oppH.length > 0 ? mostCommon(oppH) : 'Frontal Assault'
        chosen = 'Reserve'
        rHeld = false
        msgs.push(`Reserve → 最多既出タイプ(${mc})として使用`)
      } else {
        chosen = pool[0]
        msgs.push(`フォールバック → ${chosen}`)
      }
    } else if (rHeld) {
      chosen = 'Reserve'
      rHeld = false
      msgs.push(`Reserve のみ → 使用`)
    } else {
      chosen = hand[0]
      msgs.push(`緊急フォールバック → ${chosen}`)
    }

    const newHand = [...hand]
    const ci = newHand.indexOf(chosen)
    if (ci !== -1) newHand.splice(ci, 1)
    if (AI_ATKS) setAtkHand(newHand); else setDefHand(newHand)
    setResHeld(rHeld)
    setAtkCard(chosen)
    appendLog(msgs)
    setBPhase('defend')
  }

  // ── AI Defend algorithm (called with captured state) ──────────────────
  const computeAIDefend = (attackCard: string, hand: string[]): { chosen: string; msgs: string[]; newHand: string[] } => {
    const msgs: string[] = [
      `[AI防御 R${round}] 攻撃: ${attackCard}`,
      `手札スキャン: [${hand.join(' | ')}]`,
    ]
    const mi = hand.findIndex(c => c === attackCard)
    if (mi !== -1) {
      const chosen = hand[mi]
      msgs.push(`  ✓ 一致カード発見: ${chosen} — マッチ！`)
      const newHand = hand.filter((_, i) => i !== mi)
      return { chosen, msgs, newHand }
    }
    const ri = hand.indexOf('Reserve')
    if (ri !== -1) {
      msgs.push(`  ✗ 一致なし → Reserve で対応`)
      const newHand = hand.filter((_, i) => i !== ri)
      return { chosen: 'Reserve', msgs, newHand }
    }
    msgs.push(`  ✗ 一致なし、Reserve なし → 敗走宣言！`)
    return { chosen: '【敗走】', msgs, newHand: hand }
  }

  // ── Player Attack (Carthage attacks) ─────────────────────────────────
  const handlePlayerAttack = (card: string) => {
    if (bPhase !== 'attack' || AI_ATKS) return
    const newHand = [...atkHand]
    const i = newHand.indexOf(card)
    if (i === -1) return
    newHand.splice(i, 1)
    setAtkHand(newHand)
    setAtkCard(card)
    appendLog([`[${currentAtkSide}攻撃 R${round}] ${card} をプレイ`])
    setBPhase('defend')

    // AI(Rome) defends after delay (capture current defHand)
    const capturedDefHand = [...defHand]
    setTimeout(() => {
      const { chosen, msgs, newHand: dh } = computeAIDefend(card, capturedDefHand)
      if (AI_DEFS) setDefHand(dh)
      setDefCard(chosen)
      appendLog(msgs)
      setBPhase('resolve')
    }, 700)
  }

  // ── Player Defend (Carthage defends) ──────────────────────────────────
  const handlePlayerDefend = (card: string) => {
    if (bPhase !== 'defend' || AI_DEFS) return
    const newHand = [...defHand]
    const i = newHand.indexOf(card)
    if (i === -1) return
    newHand.splice(i, 1)
    setDefHand(newHand)
    setDefCard(card)
    appendLog([`[${currentDefSide}防御 R${round}] ${card} をプレイ`])
    setBPhase('resolve')
  }

  const handlePlayerDefeat = () => {
    appendLog([`[${currentDefSide}防御 R${round}] 敗走宣言`])
    setDefCard('【敗走】')
    setBPhase('resolve')
  }

  // ── Resolve round ─────────────────────────────────────────────────────
  const handleResolve = () => {
    if (!atkCard || !defCard) return
    const isDefeat = defCard === '【敗走】'
    // マッチ条件: 同タイプ または どちらかが Reserve（ワイルド）
    const matched  = !isDefeat && (atkCard === defCard || atkCard === 'Reserve' || defCard === 'Reserve')

    const rec: BattleRoundRecord = {
      round, atk: atkCard, def: defCard, matched,
      result: isDefeat ? 'defeat' : matched ? 'matched' : 'unmatched',
    }
    setHistory(prev => [...prev, rec])
    appendLog([
      isDefeat  ? `◆ R${round}: ${atkCard} vs 敗走 → 攻撃側（${currentAtkSide}）勝利！`
      : matched ? `◆ R${round}: ${atkCard} ↔ ${defCard} — マッチ！攻守交代`
                : `◆ R${round}: ${atkCard} vs ${defCard} — 防御失敗 → 攻撃側（${currentAtkSide}）勝利！`,
    ])

    // ── 敗走 → 攻撃側の勝利 ──────────────────────────────────────────
    if (isDefeat) {
      endBattle(`防御側が敗走 → 攻撃側（${currentAtkSide}）の勝利！実際の損害はCRTで確認してください。`)
      return
    }

    // ── 不一致 → 防御失敗、攻撃側の勝利 ─────────────────────────────
    if (!matched) {
      endBattle(`防御失敗 → 攻撃側（${currentAtkSide}）の勝利！実際の損害はCRTで確認してください。`)
      return
    }

    // ── マッチ → 攻守交代（Role Switch）─────────────────────────────
    const newAtkSide: 'Rome' | 'Carthage' = currentAtkSide === 'Rome' ? 'Carthage' : 'Rome'

    appendLog([`✅ 防御成功！${newAtkSide} のカウンター攻撃が始まります`])

    // 手札を swap（atkHand ↔ defHand で役割も入れ替え）
    const capturedAtkHand = [...atkHand]
    const capturedDefHand = [...defHand]

    // 手札消耗チェック（swap後の新攻撃側 = 旧防御側）
    if (capturedDefHand.length === 0 && capturedAtkHand.length === 0) {
      endBattle('両軍手札消耗。ルールに従い最終判定を行ってください。')
      return
    }
    if (capturedDefHand.length === 0) {
      endBattle(`${newAtkSide} 手札消耗 → ${currentAtkSide} 優勢！`)
      return
    }
    if (capturedAtkHand.length === 0) {
      endBattle(`${currentAtkSide} 手札消耗 → ${newAtkSide} 優勢！`)
      return
    }

    // 役割交代を確定
    setAtkHand(capturedDefHand)
    setDefHand(capturedAtkHand)
    setCurrentAtkSide(newAtkSide)

    const nextRound = round + 1
    setRound(nextRound)
    setAtkCard(null); setDefCard(null)
    setBPhase('attack')
    appendLog([`--- Round ${nextRound} ---`])
  }

  const handleReset = () => {
    setAtkHand([]); setDefHand([])
    setAtkCard(null); setDefCard(null)
    setRound(1); setHistory([]); setAiLog([]); setResult(null); setResHeld(false)
    setCurrentAtkSide(atkSide)
    setBPhase('setup')
    // バトルデッキは次回 handleStart 時に自動的に初期状態へリセット＆シャッフルされる
  }

  // ── Render ────────────────────────────────────────────────────────────
  const PHASE_COLORS: Record<BPhase, string> = {
    setup: '#64748b', attack: '#f59e0b', defend: '#3b82f6', resolve: '#8b5cf6', ended: '#10b981',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 overflow-auto p-3">
      <div style={{
        background: 'rgba(10,15,25,0.99)',
        border: '1px solid rgba(200,160,50,0.55)',
        borderRadius: 12, width: '100%', maxWidth: 780,
        boxShadow: '0 8px 48px rgba(0,0,0,0.9)',
        overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', borderBottom: '1px solid rgba(200,160,50,0.2)',
          background: 'rgba(0,0,0,0.35)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#fbbf24' }}>⚔ Battle Resolver V2</span>
            {bPhase !== 'setup' && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                background: `${PHASE_COLORS[bPhase]}22`,
                border: `1px solid ${PHASE_COLORS[bPhase]}55`,
                color: PHASE_COLORS[bPhase],
              }}>
                Round {round}{result ? ' — 終了' : ''}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {bPhase !== 'setup' && (
              <button onClick={handleReset} style={{
                fontSize: 11, color: '#94a3b8', background: 'none',
                border: '1px solid #475569', borderRadius: 4, padding: '3px 10px', cursor: 'pointer',
              }}>リセット</button>
            )}
            <button onClick={onClose} style={{
              background: 'none', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer',
            }}>✕</button>
          </div>
        </div>

        {/* ── Setup Phase ── */}
        {bPhase === 'setup' && (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

              {/* Attacker */}
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24' }}>▶ 攻撃側</span>
                  <select value={atkSide} onChange={e => setAtkSide(e.target.value as 'Rome' | 'Carthage')}
                    style={{ fontSize: 11, background: '#1e293b', color: '#f0e6b0', border: '1px solid #475569', borderRadius: 4, padding: '2px 6px' }}>
                    <option value="Carthage">Carthage（Player）</option>
                    <option value="Rome">Rome（AI）</option>
                  </select>
                </div>
                <label style={{ display: 'block', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>将軍</span>
                  <select value={atkGeneral} onChange={e => setAtkGeneral(e.target.value)}
                    style={{ display: 'block', width: '100%', marginTop: 3, fontSize: 11, background: '#1e293b', color: '#f0e6b0', border: '1px solid #475569', borderRadius: 4, padding: '4px 6px' }}>
                    {generals.map(g => <option key={g} value={g}>{g} (BR:{getBR(g)})</option>)}
                  </select>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: '#94a3b8', width: 32 }}>CU</span>
                  <button onClick={() => setAtkCU(n => Math.max(0, n - 1))} style={spinBtnStyle('#dc2626')}>−</button>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#fbbf24', minWidth: 30, textAlign: 'center' }}>{atkCU}</span>
                  <button onClick={() => setAtkCU(n => n + 1)} style={spinBtnStyle('#16a34a')}>＋</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: '#94a3b8', width: 32 }}>MOD</span>
                  <button onClick={() => setAtkMods(n => n - 1)} style={spinBtnStyle('#dc2626')}>−</button>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#94a3b8', minWidth: 30, textAlign: 'center' }}>{atkMods >= 0 ? `+${atkMods}` : atkMods}</span>
                  <button onClick={() => setAtkMods(n => n + 1)} style={spinBtnStyle('#16a34a')}>＋</button>
                </div>
                <div style={{ fontSize: 14, color: '#fbbf24', fontWeight: 800, background: 'rgba(251,191,36,0.08)', borderRadius: 6, padding: '7px 10px', textAlign: 'center' }}>
                  カード: {atkCards}枚
                  <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 400, display: 'block', marginTop: 1 }}>
                    BR:{getBR(atkGeneral)} + CU:{Math.min(atkCU,10)} + MOD:{atkMods}
                  </span>
                </div>
              </div>

              {/* Defender */}
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 14 }}>
                <div style={{ marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>▷ 防御側</span>
                  <span style={{ marginLeft: 8, fontSize: 11, color: initialDefSide === 'Carthage' ? '#60a5fa' : '#f87171' }}>
                    {initialDefSide} ({initialDefSide === 'Rome' ? 'AI' : 'Player'})
                  </span>
                </div>
                <label style={{ display: 'block', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>将軍</span>
                  <select value={defGeneral} onChange={e => setDefGeneral(e.target.value)}
                    style={{ display: 'block', width: '100%', marginTop: 3, fontSize: 11, background: '#1e293b', color: '#f0e6b0', border: '1px solid #475569', borderRadius: 4, padding: '4px 6px' }}>
                    {generals.map(g => <option key={g} value={g}>{g} (BR:{getBR(g)})</option>)}
                  </select>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: '#94a3b8', width: 32 }}>CU</span>
                  <button onClick={() => setDefCU(n => Math.max(0, n - 1))} style={spinBtnStyle('#dc2626')}>−</button>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#fbbf24', minWidth: 30, textAlign: 'center' }}>{defCU}</span>
                  <button onClick={() => setDefCU(n => n + 1)} style={spinBtnStyle('#16a34a')}>＋</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: '#94a3b8', width: 32 }}>MOD</span>
                  <button onClick={() => setDefMods(n => n - 1)} style={spinBtnStyle('#dc2626')}>−</button>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#94a3b8', minWidth: 30, textAlign: 'center' }}>{defMods >= 0 ? `+${defMods}` : defMods}</span>
                  <button onClick={() => setDefMods(n => n + 1)} style={spinBtnStyle('#16a34a')}>＋</button>
                </div>
                <div style={{ fontSize: 14, color: '#fbbf24', fontWeight: 800, background: 'rgba(251,191,36,0.08)', borderRadius: 6, padding: '7px 10px', textAlign: 'center' }}>
                  カード: {defCards}枚
                  <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 400, display: 'block', marginTop: 1 }}>
                    BR:{getBR(defGeneral)} + CU:{Math.min(defCU,10)} + MOD:{defMods}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ fontSize: 10, color: '#64748b', background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '8px 12px', lineHeight: 1.7 }}>
              <strong style={{ color: '#94a3b8' }}>カード枚数:</strong> 将軍BR + min(CU, 10) + MOD（象兵/同盟軍/義勇兵などの修正）<br />
              <strong style={{ color: '#94a3b8' }}>マッチ判定:</strong> 同タイプ = マッチ。Reserve = ワイルド（任意のタイプにマッチ）<br />
              <strong style={{ color: '#94a3b8' }}>AI:</strong> Rome側を自動制御。精鋭将軍（Hannibal / Scipio Africanus）は撤退判定に +1 修正。
            </div>

            <button onClick={handleStart} style={{
              background: '#92400e', border: 'none', color: 'white',
              fontWeight: 800, fontSize: 14, padding: '12px', borderRadius: 8, cursor: 'pointer', letterSpacing: 1,
            }}>
              ⚔ 戦闘開始！
            </button>
          </div>
        )}

        {/* ── Combat Phase ── */}
        {bPhase !== 'setup' && (
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Round history pills */}
            {history.length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {history.map((h, i) => (
                  <div key={i} style={{
                    fontSize: 10, borderRadius: 4, padding: '2px 8px',
                    background: h.result === 'matched'   ? 'rgba(16,185,129,0.15)'
                              : h.result === 'defeat'    ? 'rgba(220,38,38,0.15)'
                              : 'rgba(245,158,11,0.15)',
                    border: `1px solid ${h.result === 'matched' ? '#10b981' : h.result === 'defeat' ? '#dc2626' : '#f59e0b'}44`,
                    color:  h.result === 'matched' ? '#6ee7b7' : h.result === 'defeat' ? '#fca5a5' : '#fcd34d',
                  }}>
                    R{h.round}: {h.atk} / {h.def}
                  </div>
                ))}
              </div>
            )}

            {/* Main battle grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr', gap: 10, alignItems: 'start' }}>

              {/* Attacker */}
              <div style={{
                background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 12,
                border: `1px solid ${currentAtkSide === 'Carthage' ? 'rgba(96,165,250,0.3)' : 'rgba(239,68,68,0.3)'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: currentAtkSide === 'Carthage' ? '#60a5fa' : '#f87171' }}>
                    ▶ 攻撃: {currentAtkGeneral} ({currentAtkSide === 'Rome' ? 'AI' : 'Player'})
                  </span>
                  <span style={{ fontSize: 10, color: '#64748b' }}>手札 {atkHand.length}</span>
                </div>
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 8, minHeight: 30 }}>
                  {atkHand.map((c, i) => (
                    AI_ATKS
                      ? <BattleCardBack key={i} />
                      : <BattleCardBtn key={i} name={c}
                          onClick={bPhase === 'attack' ? () => handlePlayerAttack(c) : undefined}
                          disabled={bPhase !== 'attack'}
                        />
                  ))}
                  {atkHand.length === 0 && <span style={{ fontSize: 10, color: '#475569', alignSelf: 'center' }}>手札なし</span>}
                </div>
                {atkCard && (
                  <div style={{ marginBottom: 8 }}>
                    <p style={{ fontSize: 9, color: '#64748b', margin: '0 0 3px' }}>プレイ中:</p>
                    <BattleCardBtn name={atkCard} highlight />
                  </div>
                )}
                {AI_ATKS && bPhase === 'attack' && (
                  <button onClick={doAIAttack} style={{
                    width: '100%', background: '#1d4ed8', border: 'none',
                    color: 'white', fontWeight: 700, fontSize: 11, padding: '7px', borderRadius: 6, cursor: 'pointer',
                  }}>
                    🎲 AI が攻撃カードを選択
                  </button>
                )}
                {!AI_ATKS && bPhase === 'attack' && (
                  <p style={{ fontSize: 10, color: '#fbbf24', margin: 0 }}>↑ カードをクリックして攻撃</p>
                )}
              </div>

              {/* VS + resolve */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, paddingTop: 24 }}>
                <span style={{ fontSize: 20, fontWeight: 900, color: '#dc2626' }}>VS</span>
                <span style={{ fontSize: 10, color: '#64748b' }}>R{round}</span>
                {bPhase === 'resolve' && (
                  <button onClick={handleResolve} style={{
                    background: '#7c3aed', border: 'none', color: 'white',
                    fontWeight: 700, fontSize: 10, padding: '7px 8px', borderRadius: 6, cursor: 'pointer',
                    writingMode: 'horizontal-tb',
                  }}>
                    確定
                  </button>
                )}
              </div>

              {/* Defender */}
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: currentDefSide === 'Carthage' ? '#60a5fa' : '#f87171' }}>
                    ▷ 防御: {currentDefGeneral} ({currentDefSide === 'Rome' ? 'AI' : 'Player'})
                  </span>
                  <span style={{ fontSize: 10, color: '#64748b' }}>手札 {defHand.length}</span>
                </div>
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 8, minHeight: 30 }}>
                  {defHand.map((c, i) => (
                    AI_DEFS
                      ? <BattleCardBack key={i} />
                      : <BattleCardBtn key={i} name={c}
                          onClick={bPhase === 'defend' ? () => handlePlayerDefend(c) : undefined}
                          disabled={bPhase !== 'defend'}
                        />
                  ))}
                  {defHand.length === 0 && <span style={{ fontSize: 10, color: '#475569', alignSelf: 'center' }}>手札なし</span>}
                </div>
                {defCard && (
                  <div style={{ marginBottom: 8 }}>
                    <p style={{ fontSize: 9, color: '#64748b', margin: '0 0 3px' }}>プレイ中:</p>
                    {defCard === '【敗走】'
                      ? <span style={{ fontSize: 13, color: '#f87171', fontWeight: 700 }}>🏃 敗走宣言</span>
                      : <BattleCardBtn name={defCard} highlight />
                    }
                  </div>
                )}
                {AI_DEFS && bPhase === 'defend' && (
                  <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>AI 応答中…</p>
                )}
                {!AI_DEFS && bPhase === 'defend' && (
                  <div>
                    <p style={{ fontSize: 10, color: '#fbbf24', margin: '0 0 6px' }}>↑ カードをクリックして防御</p>
                    <button onClick={handlePlayerDefeat} style={{
                      fontSize: 10, color: '#f87171', background: 'rgba(220,38,38,0.08)',
                      border: '1px solid rgba(220,38,38,0.35)', borderRadius: 4, padding: '3px 8px', cursor: 'pointer',
                    }}>
                      🏃 敗走宣言（一致カードなし）
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Battle result banner */}
            {result && (
              <div style={{
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.35)',
                borderRadius: 8, padding: '10px 14px', textAlign: 'center',
              }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#10b981', margin: 0 }}>🏁 {result}</p>
              </div>
            )}

            {/* AI Thought Log */}
            <div style={{ background: 'rgba(0,0,0,0.45)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{
                padding: '5px 10px', borderBottom: '1px solid rgba(200,160,50,0.15)',
                fontSize: 9, fontWeight: 700, color: '#c8a840', textTransform: 'uppercase', letterSpacing: 1,
              }}>
                AI プロセスログ
              </div>
              <div ref={logRef} style={{
                padding: '6px 10px', maxHeight: 150, overflowY: 'auto',
                display: 'flex', flexDirection: 'column', gap: 1,
              }}>
                {aiLog.map((line, i) => (
                  <p key={i} style={{
                    fontSize: 10, margin: 0, lineHeight: 1.55, fontFamily: 'monospace',
                    color: line.startsWith('◆')   ? '#fbbf24'
                         : line.startsWith('⚔')   ? '#34d399'
                         : line.startsWith('---')  ? '#334155'
                         : line.includes('✓')      ? '#6ee7b7'
                         : line.includes('✗') || line.includes('敗走') ? '#fca5a5'
                         : line.startsWith('[AI撤退') ? '#fb923c'
                         : '#94a3b8',
                  }}>{line}</p>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
