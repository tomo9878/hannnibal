import { useState, useEffect } from 'react'
import hannibalData from './hannibal_data.json'

import type { City, CardInHand, ActivePlayer, SelectedCard, LogEntry, BoardPiece, SelectionState, PreviewData, RemovedCard } from './types'
import { GAME_PHASES, PHASE_RULES, PRIORITIES, getCardCounts, ROME_GENERALS_LIST, ROME_CITY_POS } from './data/gameConstants'
import { STRATEGY_DECK } from './data/cards'
import { INITIAL_PIECES } from './data/generals'
import { shuffle } from './utils'

import { MapBoard }            from './components/MapBoard'
import { SelectionPanel }      from './components/SelectionPanel'
import { StukaJoePanel }       from './components/StukaJoePanel'
import { CardActionModal }     from './components/CardActionModal'
import { StrategyHandPanel }   from './components/StrategyHandPanel'
import { BattleResolverModal } from './components/BattleResolverModal'
import { GameEngineBar }       from './components/GameEngineBar'
import { GameLog }             from './components/GameLog'
import { RemovedCardsPanel }   from './components/RemovedCardsPanel'
import { PreviewPanel }        from './components/PreviewPanel'

export default function App() {
  const cities = hannibalData.cities as City[]

  // ── Board state ───────────────────────────────────────────────────
  const [pieces,    setPieces]    = useState<BoardPiece[]>(INITIAL_PIECES)
  const [selection, setSelection] = useState<SelectionState>(null)
  const [battleOpen, setBattleOpen] = useState(false)
  const [preview,    setPreview]    = useState<PreviewData>(null)
  const [cursor,     setCursor]     = useState({ x: 0, y: 0 })

  // ── Game Engine state ─────────────────────────────────────────────
  const [currentTurn,  setCurrentTurn]  = useState(1)
  const [currentPhase, setCurrentPhase] = useState<'Strategy' | 'Action' | 'Attrition' | 'PC' | 'Consular'>('Strategy')
  const [consul,       setConsul]       = useState('P. Scipio')
  const [proconsul,    setProconsul]    = useState('T. Longus')
  const [gameLog,      setGameLog]      = useState<LogEntry[]>([
    {
      id: 0, turn: 1, phase: 'Strategy',
      message: 'ゲーム開始 — Turn 1 / Strategy Phase。' + PHASE_RULES['Strategy'],
    },
  ])

  // ── Strategy card state ───────────────────────────────────────────
  const [stratDeck,    setStratDeck]    = useState(() => shuffle([...STRATEGY_DECK]))
  const [stratDiscard, setStratDiscard] = useState<typeof STRATEGY_DECK>([])
  const [stratRemoved, setStratRemoved] = useState<RemovedCard[]>([])
  const [romeHand,     setRomeHand]     = useState<CardInHand[]>([])
  const [carthageHand, setCarthageHand] = useState<CardInHand[]>([])
  const [cardsDealt,   setCardsDealt]   = useState(false)

  // ── Action Phase ──────────────────────────────────────────────────
  const [activePlayer,  setActivePlayer]  = useState<ActivePlayer>('Carthage')
  const [selectedCard,  setSelectedCard]  = useState<SelectedCard | null>(null)

  // グローバルカーソル追跡
  useEffect(() => {
    const h = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [])

  const addLog = (turn: number, phase: typeof currentPhase, message: string) => {
    setGameLog(prev => [...prev, { id: prev.length, turn, phase, message }])
  }

  // ── Next Phase ────────────────────────────────────────────────────
  const handleNextPhase = () => {
    const idx = GAME_PHASES.indexOf(currentPhase)
    if (idx === GAME_PHASES.length - 1) {
      // Consular → next turn
      const nextTurn = currentTurn >= 9 ? 9 : currentTurn + 1
      if (currentTurn >= 9) {
        addLog(currentTurn, 'Consular', 'Turn 9 終了。ゲーム終了条件を確認してください。')
        return
      }
      setCurrentTurn(nextTurn)
      setCurrentPhase('Strategy')
      setCardsDealt(false)
      setRomeHand([])
      setCarthageHand([])
      addLog(nextTurn, 'Strategy', `Turn ${nextTurn} 開始。${PHASE_RULES['Strategy']}`)
    } else {
      const next = GAME_PHASES[idx + 1]
      setCurrentPhase(next)
      if (next === 'Action') setActivePlayer('Carthage')  // Carthage先手リセット
      addLog(currentTurn, next, PHASE_RULES[next])
    }
  }

  // ── Deal Strategy Cards ───────────────────────────────────────────
  const handleDealCards = () => {
    const { rome: romeCount, carthage: carthCount } = getCardCounts(currentTurn)
    const needed = romeCount + carthCount

    let deck = [...stratDeck]
    let discard = [...stratDiscard]

    if (deck.length < needed) {
      deck = shuffle([...deck, ...discard])
      discard = []
      addLog(currentTurn, currentPhase, '山札が不足しているため、捨て札をシャッフルして補充しました。')
    }

    const drawn = deck.slice(0, needed)
    const remaining = deck.slice(needed)

    const rCards: CardInHand[] = drawn.slice(0, romeCount).map((c, i) => ({
      name: c.name, imagePath: c.imagePath,
      ops: c.ops, side: c.side, counter: c.counter, remove: c.remove, naval: c.naval,
      priority: i < PRIORITIES.length ? PRIORITIES[i] : String(i + 1),
      isRevealed: false,  // Rome = 裏向き
    }))
    const cCards: CardInHand[] = drawn.slice(romeCount).map((c, i) => ({
      name: c.name, imagePath: c.imagePath,
      ops: c.ops, side: c.side, counter: c.counter, remove: c.remove, naval: c.naval,
      priority: i < PRIORITIES.length ? PRIORITIES[i] : String(i + 1),
      isRevealed: true,   // Carthage = 表向き
    }))

    setStratDeck(remaining)
    setStratDiscard(discard)
    setRomeHand(rCards)
    setCarthageHand(cCards)
    setCardsDealt(true)
    addLog(
      currentTurn, currentPhase,
      `カード配布完了 — Rome: ${romeCount}枚（裏向き）、Carthage: ${carthCount}枚（表向き）。山札残り: ${remaining.length}枚。`,
    )
  }

  // ── Reveal Rome card ──────────────────────────────────────────────
  const handleRevealRome = (idx: number) => {
    setRomeHand(prev => prev.map((c, i) => i === idx ? { ...c, isRevealed: true } : c))
  }

  // ── カードを手札から取り除く ────────────────────────────────────────
  const removeFromHand = (fromSide: 'Rome' | 'Carthage', index: number) => {
    if (fromSide === 'Rome') {
      setRomeHand(prev => prev.filter((_, i) => i !== index))
    } else {
      setCarthageHand(prev => prev.filter((_, i) => i !== index))
    }
  }

  // ── 次の手番へ ────────────────────────────────────────────────────
  const advanceTurn = (currentSide: 'Rome' | 'Carthage') => {
    setSelectedCard(null)
    const romeLeft     = romeHand.length     - (currentSide === 'Rome' ? 1 : 0)
    const carthageLeft = carthageHand.length - (currentSide === 'Carthage' ? 1 : 0)
    if (currentSide === 'Carthage' && romeLeft > 0) setActivePlayer('Rome')
    else if (currentSide === 'Rome' && carthageLeft > 0) setActivePlayer('Carthage')
  }

  // ── OPs / Event 使用 ─────────────────────────────────────────────
  const handlePlayCard = (mode: 'ops' | 'event', opsChoice?: 'move' | 'pc' | 'troops') => {
    if (!selectedCard) return
    const { fromSide, index, card } = selectedCard

    let logMsg = ''
    if (mode === 'ops') {
      const choiceLabel = opsChoice === 'move'   ? '将軍を活性化して移動'
                        : opsChoice === 'pc'     ? `PC を ${card.ops} 個まで配置`
                        : opsChoice === 'troops' ? '補充 (Raise Troops)'
                        : 'OPs使用'
      logMsg = `[${fromSide}] 「${card.name}」を OPs ${card.ops} として使用 — ${choiceLabel}`
    } else {
      logMsg = `[${fromSide}] 「${card.name}」を Event として使用${card.remove ? '（廃棄）' : ''}`
    }

    const baseCard: RemovedCard = { name: card.name, imagePath: card.imagePath, ops: card.ops, side: card.side, counter: card.counter, remove: card.remove, naval: card.naval }
    if (mode === 'event' && card.remove) {
      setStratRemoved(prev => [...prev, baseCard])
    } else {
      setStratDiscard(prev => [...prev, baseCard])
    }

    removeFromHand(fromSide, index)
    addLog(currentTurn, currentPhase, logMsg)
    advanceTurn(fromSide)
  }

  // ── 捨て札 ────────────────────────────────────────────────────────
  const handleDiscardCard = () => {
    if (!selectedCard) return
    const { fromSide, index, card } = selectedCard
    const baseCard: RemovedCard = { name: card.name, imagePath: card.imagePath, ops: card.ops, side: card.side, counter: card.counter, remove: card.remove, naval: card.naval }
    setStratDiscard(prev => [...prev, baseCard])
    removeFromHand(fromSide, index)
    addLog(currentTurn, currentPhase, `[${fromSide}] 「${card.name}」を捨て札`)
    advanceTurn(fromSide)
  }

  // ── Execute Election ──────────────────────────────────────────────
  const handleElection = () => {
    const pool = shuffle(ROME_GENERALS_LIST.filter(g => g !== consul && g !== proconsul))
    const newConsul    = pool[0]
    const newProconsul = pool[1]

    setConsul(newConsul)
    setProconsul(newProconsul)

    setPieces(prev => {
      let updated = [...prev]

      const moveOrAdd = (name: string) => {
        const existing = updated.find(p => p.label === name)
        if (existing) {
          updated = updated.map(p =>
            p.label === name ? { ...p, x: ROME_CITY_POS.x, y: ROME_CITY_POS.y } : p
          )
        } else {
          const idStr = name.toLowerCase().replace(/[\s.]/g, '-')
          updated.push({
            id: `general-${idStr}`,
            type: 'General',
            x: ROME_CITY_POS.x,
            y: ROME_CITY_POS.y,
            imagePath: `/images/tkn-gnrl-${name}.png`,
            label: name,
            strength: 0,
          })
        }
      }

      moveOrAdd(newConsul)
      moveOrAdd(newProconsul)
      return updated
    })

    addLog(
      currentTurn, 'Consular',
      `執政官選出完了 — Consul: ${newConsul}、Proconsul: ${newProconsul}。両名をRomeに配置しました。`,
    )
  }

  return (
    <div className="flex flex-col bg-slate-900 text-white" style={{ height: '100vh', overflow: 'hidden' }}>

      {/* 上部: Game Engine Bar */}
      <GameEngineBar
        currentTurn={currentTurn}
        currentPhase={currentPhase}
        cardsDealt={cardsDealt}
        stratDeckSize={stratDeck.length}
        consul={consul}
        proconsul={proconsul}
        onNextPhase={handleNextPhase}
        onDealCards={handleDealCards}
        onElection={handleElection}
      />

      {/* 下部: マップ + 右パネル */}
      <div className="flex flex-1 min-h-0">

        {/* 左: メインマップ */}
        <div className="flex-1 flex flex-col min-w-0 p-3 gap-2 overflow-hidden">
          <div className="flex-1 overflow-auto">
            <MapBoard
              cities={cities}
              setPreview={setPreview}
              setSelection={setSelection}
              pieces={pieces}
              setPieces={setPieces}
            />
          </div>
          <p className="shrink-0 text-xs text-slate-500">
            都市数: {cities.length}　将軍・都市をクリックで詳細表示、右クリックでPC変更
          </p>
        </div>

        {/* 右: 情報パネル */}
        <div className="w-80 shrink-0 flex flex-col gap-3 p-3 overflow-y-auto border-l border-slate-700">
          <button
            onClick={() => setBattleOpen(true)}
            className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-2 rounded transition-colors"
          >
            ⚔ Start Battle
          </button>
          <SelectionPanel
            selection={selection}
            pieces={pieces}
            setPieces={setPieces}
            cities={cities}
            setSelection={setSelection}
          />
          <StukaJoePanel />
          <GameLog entries={gameLog} />
          <RemovedCardsPanel cards={stratRemoved} />
          <StrategyHandPanel
            romeHand={romeHand}
            carthageHand={carthageHand}
            activePlayer={activePlayer}
            isActionPhase={currentPhase === 'Action'}
            onRevealRome={handleRevealRome}
            onSelectCard={setSelectedCard}
            setPreview={setPreview}
          />
        </div>
      </div>

      {battleOpen && <BattleResolverModal onClose={() => setBattleOpen(false)} setPreview={setPreview} />}

      {selectedCard && (
        <CardActionModal
          selected={selectedCard}
          onPlay={handlePlayCard}
          onDiscard={handleDiscardCard}
          onCancel={() => setSelectedCard(null)}
        />
      )}

      <PreviewPanel data={preview} cursor={cursor} />
    </div>
  )
}
