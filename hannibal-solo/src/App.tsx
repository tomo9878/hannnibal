import { useState, useEffect, useMemo } from 'react'
import hannibalData from './hannibal_data.json'

import type { City, CardInHand, ActivePlayer, SelectedCard, LogEntry, BoardPiece, SelectionState, PreviewData, RemovedCard, CDGSoloState, SlotId } from './types'
import { GAME_PHASES, PHASE_RULES, PRIORITIES, getCardCounts, ROME_GENERALS_LIST, ROME_CITY_POS } from './data/gameConstants'
import { STRATEGY_DECK } from './data/cards'
import { INITIAL_PIECES } from './data/generals'
import { calculateVictoryScore, checkCapitalFall } from './data/provinces'
import { shuffle } from './utils'
import { dealInitialHands, applyFateDieRoll, applyCardPlayed, popFromStock, rollFateDie } from './data/cdgSolo'

import { loadSave, writeSave, deleteSave } from './saveLoad'

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
import { VictoryScorePanel }   from './components/VictoryScorePanel'
import { VictoryModal }        from './components/VictoryModal'
import { ElectionModal }       from './components/ElectionModal'
import { SideSelectModal }     from './components/SideSelectModal'

export default function App() {
  const cities = hannibalData.cities as City[]

  // ── セーブデータをアプリ起動時に一度だけ読む ──────────────────────
  const [_save] = useState(() => loadSave())

  // ── Board state ───────────────────────────────────────────────────
  const [pieces,    setPieces]    = useState<BoardPiece[]>(() => _save?.pieces    ?? INITIAL_PIECES)
  const [selection, setSelection] = useState<SelectionState>(null)
  const [battleOpen, setBattleOpen] = useState(false)
  const [preview,    setPreview]    = useState<PreviewData>(null)
  const [cursor,     setCursor]     = useState({ x: 0, y: 0 })

  // ── Side selection ────────────────────────────────────────────────
  const [playerSide, setPlayerSide] = useState<'Rome' | 'Carthage' | null>(() => _save?.playerSide ?? null)

  // ── Victory state ─────────────────────────────────────────────────
  const [victory,        setVictory]        = useState<{ winner: 'Rome' | 'Carthage'; reason: string } | null>(null)
  const [electionResult, setElectionResult] = useState<{ consul: string; proconsul: string } | null>(null)

  // ── Game Engine state ─────────────────────────────────────────────
  const [currentTurn,  setCurrentTurn]  = useState(() => _save?.currentTurn  ?? 1)
  const [currentPhase, setCurrentPhase] = useState<'Strategy' | 'Action' | 'Attrition' | 'PC' | 'Consular'>(() => _save?.currentPhase ?? 'Strategy')
  const [consul,       setConsul]       = useState(() => _save?.consul    ?? 'P. Scipio')
  const [proconsul,    setProconsul]    = useState(() => _save?.proconsul ?? 'T. Longus')
  const [gameLog,      setGameLog]      = useState<LogEntry[]>(() => _save?.gameLog ?? [
    {
      id: 0, turn: 1, phase: 'Strategy',
      message: 'ゲーム開始 — Turn 1 / Strategy Phase。' + PHASE_RULES['Strategy'],
    },
  ])

  // ── Strategy card state ───────────────────────────────────────────
  const [stratDeck,    setStratDeck]    = useState<CardInHand[]>(() =>
    _save?.stratDeck ?? shuffle(STRATEGY_DECK.map(c => ({ ...c, priority: 'A', isRevealed: false })))
  )
  const [stratDiscard, setStratDiscard] = useState<RemovedCard[]>(() => _save?.stratDiscard ?? [])
  const [stratRemoved, setStratRemoved] = useState<RemovedCard[]>(() => _save?.stratRemoved ?? [])

  // ── CDG Solo System state（romeHand / carthageHand / cardsDealt を置き換え）
  const [cdgSolo, setCdgSolo] = useState<CDGSoloState | null>(() => _save?.cdgSolo ?? null)

  // ── Action Phase ──────────────────────────────────────────────────
  const [activePlayer,  setActivePlayer]  = useState<ActivePlayer>(() => _save?.activePlayer ?? 'Carthage')
  const [selectedCard,  setSelectedCard]  = useState<SelectedCard | null>(null)

  // ── Province score (memoized) ─────────────────────────────────────
  const victoryScore = useMemo(
    () => calculateVictoryScore(cities, pieces),
    [cities, pieces],
  )

  // ── Capital fall detection ────────────────────────────────────────
  useEffect(() => {
    if (victory) return
    const fallen = checkCapitalFall(cities, pieces)
    if (fallen === 'Carthage') {
      setVictory({ winner: 'Carthage', reason: 'Rome（首都）にカルタゴのPCが置かれました。カルタゴの即時勝利！' })
    } else if (fallen === 'Rome') {
      setVictory({ winner: 'Rome', reason: 'Carthage（首都）にローマのPCが置かれました。ローマの即時勝利！' })
    }
  }, [pieces])

  // グローバルカーソル追跡
  useEffect(() => {
    const h = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [])

  // ── 自動セーブ ────────────────────────────────────────────────────
  useEffect(() => {
    if (!playerSide) return
    writeSave({
      playerSide, pieces, currentTurn, currentPhase,
      consul, proconsul, gameLog,
      stratDeck, stratDiscard, stratRemoved,
      cdgSolo, activePlayer,
      savedAt: new Date().toISOString(),
    })
  }, [playerSide, pieces, currentTurn, currentPhase, consul, proconsul,
      stratDeck, stratDiscard, stratRemoved, cdgSolo, activePlayer])

  // ── New Game ──────────────────────────────────────────────────────
  const handleNewGame = () => {
    if (!confirm('セーブデータを削除して最初からやり直しますか？')) return
    deleteSave()
    location.reload()
  }

  const addLog = (turn: number, phase: typeof currentPhase, message: string) => {
    setGameLog(prev => [...prev, { id: prev.length, turn, phase, message }])
  }

  // ── Next Phase ────────────────────────────────────────────────────
  const handleNextPhase = () => {
    const idx = GAME_PHASES.indexOf(currentPhase)
    if (idx === GAME_PHASES.length - 1) {
      // Consular → next turn
      if (currentTurn >= 9) {
        const { rome, carthage } = victoryScore
        const winner: 'Rome' | 'Carthage' = rome > carthage ? 'Rome' : 'Carthage'
        const reason = rome === carthage
          ? `Turn 9 終了 — 同数（Rome ${rome} : Carthage ${carthage}）。同点はカルタゴ（Hannibal）の勝利！`
          : `Turn 9 終了 — Rome ${rome} : Carthage ${carthage}。${winner} の勝利！`
        addLog(currentTurn, 'Consular', reason)
        setVictory({ winner, reason })
        return
      }
      const nextTurn = currentTurn + 1
      setCurrentTurn(nextTurn)
      setCurrentPhase('Strategy')
      setCdgSolo(null)  // 次ターンの配布待ちにリセット
      addLog(nextTurn, 'Strategy', `Turn ${nextTurn} 開始。${PHASE_RULES['Strategy']}`)
    } else {
      const next = GAME_PHASES[idx + 1]
      setCurrentPhase(next)
      if (next === 'Action') setActivePlayer('Carthage')
      addLog(currentTurn, next, PHASE_RULES[next])
    }
  }

  // ── Deal Strategy Cards（CDG Solo System） ────────────────────────
  const handleDealCards = () => {
    const { rome: romeMax, carthage: carthMax } = getCardCounts(currentTurn)
    const totalNeeded = romeMax + carthMax

    let deck = [...stratDeck]
    let discard = [...stratDiscard]

    if (deck.length < totalNeeded) {
      // 捨て札（RemovedCard）を CardInHand に変換してリシャッフル
      const recycled: CardInHand[] = discard.map(c => ({ ...c, priority: 'A', isRevealed: false }))
      deck = shuffle([...deck, ...recycled])
      discard = []
      addLog(currentTurn, currentPhase, '山札が切れました。捨て札をシャッフルして新しい山札を作成します。')
    }

    // priority を付与してから渡す
    const deckWithPriority: CardInHand[] = deck.map((c, i) => ({
      ...c,
      priority: i < PRIORITIES.length ? PRIORITIES[i] : String(i + 1),
      isRevealed: false,
    }))

    const { rome, carthage, remainingDeck } = dealInitialHands(
      deckWithPriority,
      romeMax,
      carthMax,
    )

    setCdgSolo({
      rome,
      carthage,
      fateDieResult: null,
      availableSlots: [],
      constraint: 'free',
      phase: 'idle',
    })
    setStratDeck(remainingDeck)
    setStratDiscard(discard)

    addLog(
      currentTurn, currentPhase,
      `【CDG Solo】カード配布完了 — Rome: ${romeMax}枚 (5スロット+${romeMax - 5}ストック), Carthage: ${carthMax}枚 (5スロット+${carthMax - 5}ストック)。山札残り: ${remainingDeck.length}枚。`,
    )
  }

  // ── Fate Die ロール ───────────────────────────────────────────────
  const handleFateRoll = () => {
    if (!cdgSolo) return
    if (cdgSolo[activePlayer === 'Rome' ? 'rome' : 'carthage'].cardsRemaining <= 0) return

    const face = rollFateDie()
    const next = applyFateDieRoll(cdgSolo, face, activePlayer)
    setCdgSolo(next)
    addLog(
      currentTurn, currentPhase,
      `[${activePlayer}] 🎲 Fate Die → ${face}  利用可能スロット: ${next.availableSlots.join('・')}${face === 'e<' ? '（最低OPS カードを Event のみで使用）' : ''}`,
    )
  }

  // ── 山札から1枚引くヘルパー（ストック → 山札 → リシャッフル） ────
  const drawOneCard = (
    display: CDGSoloState['rome'],
    deck: CardInHand[],
    discard: RemovedCard[],
  ): { card: CardInHand; newDisplay: typeof display; newDeck: CardInHand[]; newDiscard: RemovedCard[] } => {
    // まずストックから
    const fromStock = popFromStock(display)
    if (fromStock) {
      return {
        card: fromStock.card,
        newDisplay: fromStock.updatedDisplay,
        newDeck: deck,
        newDiscard: discard,
      }
    }
    // ストック枯渇 → 山札から
    let d = [...deck]
    let dis = [...discard]
    if (d.length === 0) {
      // 捨て札（RemovedCard）を CardInHand に変換してリシャッフル
      d = shuffle(dis.map(c => ({ ...c, priority: 'A', isRevealed: false })))
      dis = []
    }
    const [card, ...rest] = d
    return { card: { ...card, isRevealed: false }, newDisplay: display, newDeck: rest, newDiscard: dis }
  }

  // ── 次の手番へ（CDG Solo 版） ─────────────────────────────────────
  const advanceTurnCDG = (playedSide: 'Rome' | 'Carthage') => {
    setSelectedCard(null)
    if (!cdgSolo) return
    const remaining = cdgSolo[playedSide === 'Rome' ? 'rome' : 'carthage'].cardsRemaining
    const otherSide: 'Rome' | 'Carthage' = playedSide === 'Rome' ? 'Carthage' : 'Rome'
    const otherRemaining = cdgSolo[otherSide === 'Rome' ? 'rome' : 'carthage'].cardsRemaining

    if (remaining > 0) {
      // まだ自分の手番が残っているが、先に相手に渡す（交互プレイ）
      setActivePlayer(otherSide)
    } else if (otherRemaining > 0) {
      setActivePlayer(otherSide)
    }
    // 両方 0 → Strategy Phase 終了はプレイヤーが Next Phase を押す
  }

  // ── OPs / Event 使用 ─────────────────────────────────────────────
  const handlePlayCard = (mode: 'ops' | 'event', opsChoice?: 'move' | 'pc' | 'troops') => {
    if (!selectedCard || !cdgSolo) return
    const { fromSide, card, slotId, constraint } = selectedCard

    // e< 制約チェック
    if (constraint === 'event_only' && mode === 'ops') {
      addLog(currentTurn, currentPhase, `⚠ e< 判定のため「${card.name}」は OPS 使用不可。Event として使用してください。`)
      return
    }

    let logMsg = ''
    if (mode === 'ops') {
      const choiceLabel = opsChoice === 'move'   ? '将軍を活性化して移動'
                        : opsChoice === 'pc'     ? `PC を ${card.ops} 個まで配置`
                        : opsChoice === 'troops' ? '補充 (Raise Troops)'
                        : 'OPs使用'
      logMsg = `[${fromSide}] 「${card.name}」を OPs ${card.ops} として使用 — ${choiceLabel}`
    } else {
      logMsg = `[${fromSide}] 「${card.name}」を Event として使用${card.remove ? '（廃棄）' : ''}${constraint === 'event_only' ? ' [e< 制約]' : ''}`
    }

    // 捨て札 / 除外処理
    const baseCard: RemovedCard = { name: card.name, imagePath: card.imagePath, ops: card.ops, side: card.side, counter: card.counter, remove: card.remove, naval: card.naval }
    if (mode === 'event' && card.remove) {
      setStratRemoved(prev => [...prev, baseCard])
    } else {
      setStratDiscard(prev => [...prev, baseCard])
    }

    // スロット補充（即時）
    const sideKey: 'rome' | 'carthage' = fromSide === 'Rome' ? 'rome' : 'carthage'
    const usedSlotId: SlotId = slotId ?? 'A'
    const { card: newCard, newDisplay, newDeck, newDiscard } = drawOneCard(
      cdgSolo[sideKey],
      stratDeck,
      stratDiscard,
    )

    if (newDeck.length === 0 && stratDeck.length > 0) {
      addLog(currentTurn, currentPhase, '山札が切れました。捨て札をシャッフルして新しい山札を作成します。')
    }

    const updatedSolo = applyCardPlayed(
      { ...cdgSolo, [sideKey]: newDisplay },
      fromSide,
      usedSlotId,
      newCard,
    )

    setCdgSolo(updatedSolo)
    setStratDeck(newDeck)
    setStratDiscard(newDiscard)
    addLog(currentTurn, currentPhase, logMsg)
    advanceTurnCDG(fromSide)
  }

  // ── 捨て札（カードを使わずに捨てる） ──────────────────────────────
  const handleDiscardCard = () => {
    if (!selectedCard || !cdgSolo) return
    const { fromSide, card, slotId } = selectedCard
    const baseCard: RemovedCard = { name: card.name, imagePath: card.imagePath, ops: card.ops, side: card.side, counter: card.counter, remove: card.remove, naval: card.naval }
    setStratDiscard(prev => [...prev, baseCard])

    const sideKey: 'rome' | 'carthage' = fromSide === 'Rome' ? 'rome' : 'carthage'
    const usedSlotId: SlotId = slotId ?? 'A'
    const { card: newCard, newDisplay, newDeck, newDiscard } = drawOneCard(
      cdgSolo[sideKey],
      stratDeck,
      stratDiscard,
    )
    const updatedSolo = applyCardPlayed(
      { ...cdgSolo, [sideKey]: newDisplay },
      fromSide,
      usedSlotId,
      newCard,
    )

    setCdgSolo(updatedSolo)
    setStratDeck(newDeck)
    setStratDiscard(newDiscard)
    addLog(currentTurn, currentPhase, `[${fromSide}] 「${card.name}」を捨て札`)
    advanceTurnCDG(fromSide)
  }

  // ── Execute Election ──────────────────────────────────────────────
  const ELECTION_FLAVOR: Record<string, string> = {
    'Varro':            '無能な扇動家ウァッロが就任！カンナエの悪夢再び……ハンニバルが微笑む。',
    'Flaminius':        '猪突のフラミニウスが選出！トラシメヌス湖の教訓はどこへ？神々よローマをお守りを。',
    'A. Paulus':        '慎重派の貴族パウッルスが登板。元老院は胸を撫で下ろすが、民会は不満顔だ。',
    'Fabius':           '「のろま」ファビウス・マクシムスが再び！影のように追い回す遅延戦術でハンニバルを消耗させよ。',
    'Marcellus':        'ローマの剣マルケッルスが帰還！五度の執政官経験が示す最高の野戦指揮官だ。',
    'G. Nero':          '電撃のネロが選出！メタウルス川でハスドルバルを撃破した北の鷹が舞う。',
    'P. Scipio':        'イベリアの守護者スキピオ（父）が選ばれた。若き息子の活躍を祈りながら戦場へ。',
    'T. Longus':        'ロングスが就任……トレッビアの失態を繰り返すな。今度こそ罠に嵌まるな！',
    'Scipio Africanus': '！！ スキピオ・アフリカヌスが元老院に立った ！！　カルタゴよ、ザマの足音が聞こえるか！？',
  }

  const handleElection = () => {
    const scipioInPlay = currentTurn >= 6
    const keepProconsul = proconsul
    const excluded = new Set([keepProconsul, ...(scipioInPlay ? ['Scipio Africanus'] : [])])
    const pool     = shuffle(ROME_GENERALS_LIST.filter(g => !excluded.has(g)))
    const newConsul1 = pool[0]
    const newConsul2 = pool[1]

    setConsul(newConsul1)
    setProconsul(keepProconsul)

    setPieces(prev => {
      let updated = [...prev]
      const keepOnMap = new Set([keepProconsul, newConsul1, newConsul2, ...(scipioInPlay ? ['Scipio Africanus'] : [])])
      updated = updated.filter(p => {
        if (p.type !== 'General') return true
        const isRomeGeneral = ROME_GENERALS_LIST.includes(p.label ?? '')
        if (!isRomeGeneral) return true
        return keepOnMap.has(p.label ?? '')
      })

      const placeConsulAtRome = (name: string) => {
        const existing = updated.find(p => p.label === name)
        if (existing) {
          updated = updated.map(p =>
            p.label === name ? { ...p, x: ROME_CITY_POS.x, y: ROME_CITY_POS.y, strength: 5 } : p
          )
        } else {
          const idStr = name.toLowerCase().replace(/[\s.]/g, '-')
          updated.push({
            id: `general-${idStr}`, type: 'General',
            x: ROME_CITY_POS.x, y: ROME_CITY_POS.y,
            imagePath: `/images/tkn-gnrl-${name}.png`,
            label: name, strength: 5,
          })
        }
      }
      placeConsulAtRome(newConsul1)
      placeConsulAtRome(newConsul2)

      if (currentTurn === 6 && !updated.find(p => p.label === 'Scipio Africanus')) {
        updated.push({
          id: 'general-scipio-africanus', type: 'General',
          x: ROME_CITY_POS.x, y: ROME_CITY_POS.y,
          imagePath: '/images/tkn-gnrl-Scipio Africanus.png',
          label: 'Scipio Africanus', strength: 5,
        })
      }
      return updated
    })

    const flav1 = ELECTION_FLAVOR[newConsul1] ?? `${newConsul1}が執政官に就任。`
    const flav2 = ELECTION_FLAVOR[newConsul2] ?? `${newConsul2}が第二執政官として就任。`
    addLog(currentTurn, 'Consular', `【執政官選出 6.4】Consul I: ${newConsul1} / Consul II: ${newConsul2} / Proconsul: ${keepProconsul}（継続）`)
    addLog(currentTurn, 'Consular', flav1)
    addLog(currentTurn, 'Consular', flav2)
    addLog(currentTurn, 'Consular', `新 Consul 2名を Rome に5 CUで配置。補充（6.2）: 5 CUをローマ将軍または Rome に配置してください（うち3以上はイタリア）。`)
    if (currentTurn === 6) {
      addLog(currentTurn, 'Consular', `【6.7】スキピオ・アフリカヌスが第二 Proconsul として登場！5 CU を伴いイタリアまたはスペインの適切なスペースに配置してください。`)
    }
    setElectionResult({ consul: newConsul1, proconsul: newConsul2 })
  }

  if (!playerSide) {
    return (
      <SideSelectModal
        onSelect={setPlayerSide}
        onContinue={() => setPlayerSide(loadSave()!.playerSide)}
      />
    )
  }

  return (
    <div className="flex flex-col bg-slate-900 text-white" style={{ height: '100vh', overflow: 'hidden' }}>

      {/* 上部: Game Engine Bar */}
      <GameEngineBar
        currentTurn={currentTurn}
        currentPhase={currentPhase}
        cardsDealt={cdgSolo !== null}
        stratDeckSize={stratDeck.length}
        consul={consul}
        proconsul={proconsul}
        playerSide={playerSide}
        onNextPhase={handleNextPhase}
        onDealCards={handleDealCards}
        onElection={handleElection}
        onNewGame={handleNewGame}
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
          <VictoryScorePanel score={victoryScore} currentTurn={currentTurn} />
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
            cdgSolo={cdgSolo}
            activePlayer={activePlayer}
            isActionPhase={currentPhase === 'Action'}
            playerSide={playerSide}
            onFateRoll={handleFateRoll}
            onSelectCard={setSelectedCard}
            setPreview={setPreview}
          />
        </div>
      </div>

      {battleOpen && <BattleResolverModal onClose={() => setBattleOpen(false)} setPreview={setPreview} humanSide={playerSide ?? 'Carthage'} />}

      {selectedCard && (
        <CardActionModal
          selected={selectedCard}
          onPlay={handlePlayCard}
          onDiscard={handleDiscardCard}
          onCancel={() => setSelectedCard(null)}
        />
      )}

      {electionResult && (
        <ElectionModal
          consul={electionResult.consul}
          proconsul={electionResult.proconsul}
          onClose={() => setElectionResult(null)}
        />
      )}

      {victory && (
        <VictoryModal
          winner={victory.winner}
          reason={victory.reason}
          score={victoryScore}
          onClose={() => setVictory(null)}
        />
      )}

      <PreviewPanel data={preview} cursor={cursor} />
    </div>
  )
}
