import { useState, useEffect, useMemo } from 'react'
import hannibalData from './hannibal_data.json'

import type { City, CardInHand, ActivePlayer, SelectedCard, LogEntry, BoardPiece, SelectionState, PreviewData, RemovedCard } from './types'
import { GAME_PHASES, PHASE_RULES, PRIORITIES, getCardCounts, ROME_GENERALS_LIST, ROME_CITY_POS } from './data/gameConstants'
import { STRATEGY_DECK } from './data/cards'
import { INITIAL_PIECES } from './data/generals'
import { calculateVictoryScore, checkCapitalFall } from './data/provinces'
import { shuffle } from './utils'

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
  const [stratDeck,    setStratDeck]    = useState(() => _save?.stratDeck    ?? shuffle([...STRATEGY_DECK]))
  const [stratDiscard, setStratDiscard] = useState(() => _save?.stratDiscard ?? [])
  const [stratRemoved, setStratRemoved] = useState<RemovedCard[]>(() => _save?.stratRemoved ?? [])
  const [romeHand,     setRomeHand]     = useState<CardInHand[]>(() => _save?.romeHand     ?? [])
  const [carthageHand, setCarthageHand] = useState<CardInHand[]>(() => _save?.carthageHand ?? [])
  const [cardsDealt,   setCardsDealt]   = useState(() => _save?.cardsDealt ?? false)

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
    if (victory) return  // already ended
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
      romeHand, carthageHand, cardsDealt, activePlayer,
      savedAt: new Date().toISOString(),
    })
  }, [playerSide, pieces, currentTurn, currentPhase, consul, proconsul,
      stratDeck, stratDiscard, stratRemoved, romeHand, carthageHand, cardsDealt, activePlayer])

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
        // Turn 9 end → final victory judgment
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

    const humanSide = playerSide ?? 'Carthage'
    const rCards: CardInHand[] = drawn.slice(0, romeCount).map((c, i) => ({
      name: c.name, imagePath: c.imagePath,
      ops: c.ops, side: c.side, counter: c.counter, remove: c.remove, naval: c.naval,
      priority: i < PRIORITIES.length ? PRIORITIES[i] : String(i + 1),
      isRevealed: humanSide === 'Rome',  // プレイヤーが Rome なら表向き
    }))
    const cCards: CardInHand[] = drawn.slice(romeCount).map((c, i) => ({
      name: c.name, imagePath: c.imagePath,
      ops: c.ops, side: c.side, counter: c.counter, remove: c.remove, naval: c.naval,
      priority: i < PRIORITIES.length ? PRIORITIES[i] : String(i + 1),
      isRevealed: humanSide === 'Carthage',  // プレイヤーが Carthage なら表向き
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
    // ── 6.4 Electing Consuls and Proconsuls ──────────────────────────
    // Turn 6+: Scipio Africanus は盤上に残り続ける（6.7）
    const scipioInPlay = currentTurn >= 6

    // 6.4.1 現 Proconsul は盤上に留まる（keepProconsul）
    // 6.4.2 他の全ローマ将軍を盤面から除去（Scipio Africanus は除く）
    // 6.4.3 抽選プール = Proconsul と Scipio Africanus（在籍中）を除く全員
    //        ※旧 Consul も除外しない（再抽選可能）
    const keepProconsul = proconsul  // 現 Proconsul は盤上に残す
    const excluded = new Set([keepProconsul, ...(scipioInPlay ? ['Scipio Africanus'] : [])])
    const pool     = shuffle(ROME_GENERALS_LIST.filter(g => !excluded.has(g)))
    const newConsul1 = pool[0]
    const newConsul2 = pool[1]

    setConsul(newConsul1)
    setProconsul(keepProconsul)  // Proconsul は継続

    setPieces(prev => {
      let updated = [...prev]

      // 6.4.2: 旧 Consul（およびその他の非 Proconsul ローマ将軍）を盤面から除去
      const keepOnMap = new Set([keepProconsul, newConsul1, newConsul2, ...(scipioInPlay ? ['Scipio Africanus'] : [])])
      updated = updated.filter(p => {
        if (p.type !== 'General') return true
        const isRomeGeneral = ROME_GENERALS_LIST.includes(p.label ?? '')
        if (!isRomeGeneral) return true
        return keepOnMap.has(p.label ?? '')
      })

      // 6.4.4: 新 Consul 2名を Rome に配置（5 CU）
      const placeConsulAtRome = (name: string) => {
        const existing = updated.find(p => p.label === name)
        if (existing) {
          updated = updated.map(p =>
            p.label === name
              ? { ...p, x: ROME_CITY_POS.x, y: ROME_CITY_POS.y, strength: 5 }
              : p
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
            strength: 5,
          })
        }
      }
      placeConsulAtRome(newConsul1)
      placeConsulAtRome(newConsul2)

      // 6.7: Turn 6 に Scipio Africanus が Proconsul として登場
      if (currentTurn === 6 && !updated.find(p => p.label === 'Scipio Africanus')) {
        updated.push({
          id: 'general-scipio-africanus',
          type: 'General',
          x: ROME_CITY_POS.x,
          y: ROME_CITY_POS.y,
          imagePath: '/images/tkn-gnrl-Scipio Africanus.png',
          label: 'Scipio Africanus',
          strength: 5,
        })
      }

      return updated
    })

    // ログ
    const flav1 = ELECTION_FLAVOR[newConsul1] ?? `${newConsul1}が執政官に就任。`
    const flav2 = ELECTION_FLAVOR[newConsul2] ?? `${newConsul2}が第二執政官として就任。`
    addLog(currentTurn, 'Consular', `【執政官選出 6.4】Consul I: ${newConsul1} / Consul II: ${newConsul2} / Proconsul: ${keepProconsul}（継続）`)
    addLog(currentTurn, 'Consular', flav1)
    addLog(currentTurn, 'Consular', flav2)
    addLog(currentTurn, 'Consular', `新 Consul 2名を Rome に5 CUで配置。補充（6.2）: 5 CUをローマ将軍または Rome に配置してください（うち3以上はイタリア）。`)
    if (currentTurn === 6) {
      addLog(currentTurn, 'Consular', `【6.7】スキピオ・アフリカヌスが第二 Proconsul として登場！5 CU を伴いイタリアまたはスペインの適切なスペースに配置してください。`)
    }

    // モーダル表示
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
        cardsDealt={cardsDealt}
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
