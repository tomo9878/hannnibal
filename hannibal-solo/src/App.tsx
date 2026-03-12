import { useState, useRef, useEffect } from 'react'
import hannibalData from './hannibal_data.json'
// App.css は使用しない（Tailwind に統一）

// ── カード名リスト（buildFile解析結果） ──────────────────────────────
const STRATEGY_CARD_NAMES: string[] = [
  'Corsica and Sardinia Revolt', 'Sicilia Revolts', 'Numidia Revolts',
  'Celtiberia Revolts', 'Native Guide', "Marharbal's Cavalry",
  'Hostile Tribes', 'Hostile Tribes',
  'Philip V Of Macedon Allies with Carthage', 'Macedonian Reinforcements',
  'Balearic Slingers', 'African Reinforcements', 'Bruttium Recruits',
  'Ligurian Recruits', 'Iberian Recruits', 'Gallic Recruits',
  'Surprise Sortie', 'Traitor in Tarentum', 'Senate Dismisses Proconsul',
  'Spy in Enemy Camp', 'Mercenaries Desert', "Mutin's Numidians",
  'Numidian Ally', 'The beautiful Sophonisba seduces a Numidian king',
  'Capua Sides with Carthage', 'Syracuse allies with Carthage',
  'I have come into Italy', 'Hannibal Charms Italy',
  'Carthaginian Naval Victory', 'Carthaginian Siege Train',
  'Spanish Allies Desert', 'Numumidian Allies Desert',
  'Major Campaign', 'Major Campaign', 'Diplomacy', 'Diplomacy',
  'Minor Campaign', 'Minor Campaign', 'Minor Campaign', 'Minor Campaign',
  'Bad Weather', 'Elephant Fright',
  'Two Legions of Slaves Raised The Volones', 'Allied Auxiliaries',
  'Allied Auxiliaries', 'Allied Auxiliaries', 'Allied Auxiliaries',
  'Allied Auxiliaries', 'Opposing Fleet Breaks Siege', 'Adriatic Pirates',
  'Epidemic', 'Pestilence', 'Tribal Resistance', 'Treachery within City',
  'Messenger Intercepted', 'Grain Shortage', 'Hanno Counsels Carthage',
  'Cato Counsels Rome', 'Ally Deserts', 'Storms at Sea',
  'Force March', 'Force March', 'Force March', 'Truce',
]

// ── 配布枚数（将来的に変更可能） ─────────────────────────────────────
const INITIAL_DRAW_COUNT = 5
const PRIORITIES = ['A', 'B', 'C', 'D', 'E'] as const

type City = { name: string; x: number; y: number }

interface CardInHand {
  name: string
  priority: string   // 'A'〜'E'
  isRevealed: boolean
}

interface DiceResult {
  d1: number
  d2: number
  total: number
  verdict: string
}

// ── MapCanvas ────────────────────────────────────────────────────────

function MapCanvas({ cities }: { cities: City[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<{ name: string; x: number; y: number } | null>(null)

  // 地図画像を読み込み、キャンバスを実寸にセットして都市ドットを描画
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const MAP_SRC = '/images/maps-mainmap.png'
    console.log('[MapCanvas] loading image:', MAP_SRC)

    const img = new Image()
    img.src = MAP_SRC
    img.onload = () => {
      console.log('[MapCanvas] image loaded:', img.naturalWidth, 'x', img.naturalHeight)

      // キャンバスサイズを画像の実サイズに合わせる
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight

      // 地図を描画
      ctx.drawImage(img, 0, 0)

      // 都市ドットを描画（半径 6px）
      for (const city of cities) {
        const isRome =
          city.name.includes('Rome') || city.name.includes('Rest Position')
        ctx.beginPath()
        ctx.arc(city.x, city.y, 6, 0, Math.PI * 2)
        ctx.fillStyle = isRome ? '#ef4444' : '#facc15'
        ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.75)'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
    }
    img.onerror = (err) => {
      console.error('[MapCanvas] image load FAILED:', MAP_SRC, err)
    }
  }, [cities])

  // マウス移動: CSSスケールを逆算してキャンバス座標に変換し、最近傍都市を探す
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()

    // CSS で縮小されている場合の比率
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const cx = (e.clientX - rect.left) * scaleX
    const cy = (e.clientY - rect.top) * scaleY

    // 閾値 20px（キャンバス座標系）以内の最近傍都市
    const THRESHOLD = 20
    let nearest: City | null = null
    let minDist = Infinity
    for (const city of cities) {
      const d = Math.hypot(city.x - cx, city.y - cy)
      if (d < THRESHOLD && d < minDist) {
        minDist = d
        nearest = city
      }
    }

    if (nearest) {
      // ツールチップ位置はラッパー要素相対の画面座標
      const wRect = wrapperRef.current?.getBoundingClientRect()
      setTooltip({
        name: nearest.name,
        x: e.clientX - (wRect?.left ?? 0) + 12,
        y: Math.max(0, e.clientY - (wRect?.top ?? 0) - 30),
      })
    } else {
      setTooltip(null)
    }
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        style={{ maxWidth: '100%', height: 'auto', display: 'block', cursor: 'crosshair' }}
      />
      {tooltip && (
        <div
          className="absolute z-10 bg-black/90 text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.name}
        </div>
      )}
    </div>
  )
}

// ── StukaJoePanel ────────────────────────────────────────────────────

function StukaJoePanel() {
  const [result, setResult] = useState<DiceResult | null>(null)
  const [rolling, setRolling] = useState(false)

  const roll = () => {
    setRolling(true)
    setTimeout(() => {
      const d1 = Math.ceil(Math.random() * 6)
      const d2 = Math.ceil(Math.random() * 6)
      const total = d1 + d2
      // Stuka Joe Universal System 2.0: 2–7 → Ops, 8–12 → Event
      const verdict = total <= 7 ? 'Ops（作戦値）としてプレイ' : 'Event（イベント）としてプレイ'
      setResult({ d1, d2, total, verdict })
      setRolling(false)
    }, 350)
  }

  const DICE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

  return (
    <div className="bg-slate-800 rounded p-4 space-y-3">
      <h2 className="text-yellow-400 font-bold text-sm tracking-wide uppercase">
        Stuka Joe ソロ判定
        <span className="ml-2 text-slate-400 font-normal normal-case text-xs">
          Universal System 2.0
        </span>
      </h2>

      <button
        onClick={roll}
        disabled={rolling}
        className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-slate-900 font-bold py-2 rounded transition-colors"
      >
        {rolling ? '振っています…' : '🎲 2d6 を振る'}
      </button>

      {result && (
        <div className="bg-slate-700 rounded p-3 text-center space-y-2">
          <div className="text-3xl tracking-widest">
            {DICE[result.d1]} {DICE[result.d2]}
          </div>
          <div className="text-lg font-mono font-bold">
            {result.d1} + {result.d2} ＝ <span className="text-yellow-300">{result.total}</span>
          </div>
          <div
            className={`text-sm font-bold px-3 py-1.5 rounded ${
              result.total <= 7
                ? 'bg-blue-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {result.verdict}
          </div>
          <p className="text-xs text-slate-400">2–7 → Ops　8–12 → Event</p>
        </div>
      )}
    </div>
  )
}

// ── 優先順位ごとの色定義 ─────────────────────────────────────────────
const PRIORITY_STYLE: Record<string, { bg: string; fg: string }> = {
  A: { bg: '#dc2626', fg: '#fff' },
  B: { bg: '#ea580c', fg: '#fff' },
  C: { bg: '#ca8a04', fg: '#000' },
  D: { bg: '#16a34a', fg: '#fff' },
  E: { bg: '#475569', fg: '#fff' },
}

// ── CardTile ─────────────────────────────────────────────────────────
// 1枚のカードを表示するタイル（56×88px）
function CardTile({
  card,
  onReveal,
}: {
  card: CardInHand
  onReveal?: () => void
}) {
  const ps = PRIORITY_STYLE[card.priority]

  if (!card.isRevealed) {
    // 裏向き: 優先順位ラベルを大きく表示、クリックで公開
    return (
      <button
        onClick={onReveal}
        title="クリックで公開"
        className="relative flex flex-col items-center justify-center gap-1 rounded-md border-2 border-slate-600 bg-slate-700 hover:border-yellow-400 hover:bg-slate-600 transition-colors"
        style={{ width: 52, height: 82 }}
      >
        <span
          className="text-2xl font-black leading-none rounded px-1"
          style={{ color: ps.fg, backgroundColor: ps.bg }}
        >
          {card.priority}
        </span>
        <span className="text-slate-500 text-lg leading-none">?</span>
      </button>
    )
  }

  // 表向き
  return (
    <div
      className="relative flex flex-col rounded-md border border-slate-500 bg-slate-600 overflow-hidden"
      style={{ width: 52, height: 82 }}
    >
      {/* 優先順位バッジ（左上） */}
      <div
        className="text-xs font-bold px-1 leading-5 shrink-0"
        style={{ backgroundColor: ps.bg, color: ps.fg }}
      >
        {card.priority}
      </div>
      {/* カード名（中央） */}
      <div className="flex-1 flex items-center justify-center px-1 pb-1">
        <span className="text-slate-100 text-center leading-tight" style={{ fontSize: 8 }}>
          {card.name}
        </span>
      </div>
    </div>
  )
}

// ── CardDealPanel ────────────────────────────────────────────────────
function CardDealPanel() {
  const [playerHand, setPlayerHand] = useState<CardInHand[]>([])
  const [opponentHand, setOpponentHand] = useState<CardInHand[]>([])

  // 山札をシャッフルして交互に INITIAL_DRAW_COUNT 枚ずつ配布
  const dealCards = () => {
    const shuffled = [...STRATEGY_CARD_NAMES].sort(() => Math.random() - 0.5)
    const pCards: CardInHand[] = []
    const oCards: CardInHand[] = []

    for (let i = 0; i < INITIAL_DRAW_COUNT * 2; i++) {
      const entry: CardInHand = { name: shuffled[i], priority: '', isRevealed: false }
      if (i % 2 === 0) pCards.push(entry)
      else oCards.push(entry)
    }

    // 優先順位を A〜E で割り当て、プレイヤーは表向き・相手は裏向き
    pCards.forEach((c, i) => { c.priority = PRIORITIES[i]; c.isRevealed = true })
    oCards.forEach((c, i) => { c.priority = PRIORITIES[i]; c.isRevealed = false })

    setPlayerHand(pCards)
    setOpponentHand(oCards)
  }

  const revealOpponentCard = (idx: number) => {
    setOpponentHand(prev =>
      prev.map((c, i) => i === idx ? { ...c, isRevealed: true } : c)
    )
  }

  const hasHands = playerHand.length > 0 || opponentHand.length > 0

  return (
    <div className="flex flex-col gap-3">
      {/* Deal ボタン */}
      <button
        onClick={dealCards}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded transition-colors"
      >
        🂠 Deal Cards ({INITIAL_DRAW_COUNT} each)
      </button>

      {hasHands && (
        <>
          {/* 上: Opponent AI Hand */}
          <div className="bg-slate-800 rounded p-3 space-y-2">
            <h2 className="text-red-400 font-bold text-xs tracking-wide uppercase">
              Opponent AI Hand
              <span className="ml-2 text-slate-500 font-normal normal-case">
                — クリックで公開
              </span>
            </h2>
            <div className="flex gap-1 justify-center">
              {opponentHand.map((card, i) => (
                <CardTile
                  key={i}
                  card={card}
                  onReveal={() => revealOpponentCard(i)}
                />
              ))}
            </div>
          </div>

          {/* 下: Player Hand */}
          <div className="bg-slate-800 rounded p-3 space-y-2">
            <h2 className="text-blue-400 font-bold text-xs tracking-wide uppercase">
              Player Hand
            </h2>
            <div className="flex gap-1 justify-center">
              {playerHand.map((card, i) => (
                <CardTile key={i} card={card} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── App ──────────────────────────────────────────────────────────────

export default function App() {
  const cities = hannibalData.cities as City[]

  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
      {/* 左: メインマップ */}
      <div className="flex-1 flex flex-col min-w-0 p-3 gap-2 overflow-hidden">
        <h1 className="shrink-0 text-base font-bold text-white">
          Hannibal: Rome vs Carthage — Solo Aid
        </h1>
        <div className="flex-1 overflow-auto">
          <MapCanvas cities={cities} />
        </div>
        <p className="shrink-0 text-xs text-slate-500">
          都市数: {cities.length}　ドットにホバーで都市名を表示
        </p>
      </div>

      {/* 右: 情報パネル */}
      <div className="w-80 shrink-0 flex flex-col gap-3 p-3 overflow-y-auto border-l border-slate-700">
        <StukaJoePanel />
        <CardDealPanel />
      </div>
    </div>
  )
}
