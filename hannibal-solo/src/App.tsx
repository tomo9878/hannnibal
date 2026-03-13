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
  'Epidemic', 'Prestilence', 'Tribal Resistance', 'Treachery within City',
  'Messenger Intercepted', 'Grain Shortage', 'Hanno Counsels Carthage',
  'Cato Counsels Rome', 'Ally Deserts', 'Storms at Sea',
  'Force March', 'Force March', 'Force March', 'Truce',
]

// ── 配布枚数（将来的に変更可能） ─────────────────────────────────────
const INITIAL_DRAW_COUNT = 5
const PRIORITIES = ['A', 'B', 'C', 'D', 'E'] as const

// インデックスから画像パスを生成（実ファイル名: cards-strg-01 Corsica and Sardinia Revolt.png）
const STRATEGY_DECK = STRATEGY_CARD_NAMES.map((name, i) => ({
  name,
  imagePath: `/images/cards-strg-${String(i + 1).padStart(2, '0')} ${name}.png`,
}))

// ── バトルカードデッキ定義 ────────────────────────────────────────────
const BATTLE_CARD_TYPES = [
  { name: 'Frontal Assault',    count: 12, imagePath: '/images/cards-btl-Frontal Assault.png' },
  { name: 'Flank Left',         count: 9,  imagePath: '/images/cards-btl-Flank Left.png' },
  { name: 'Flank Right',        count: 9,  imagePath: '/images/cards-btl-Flank Right.png' },
  { name: 'Probe',              count: 8,  imagePath: '/images/cards-btl-Probe.png' },
  { name: 'Double Envelopment', count: 6,  imagePath: '/images/cards-btl-Double Envelopment.png' },
  { name: 'Reserve',            count: 4,  imagePath: '/images/cards-btl-Reserve.png' },
] as const

// 48枚の初期バトルデッキ（シャッフル前のマスターコピー）
const FULL_BATTLE_DECK = BATTLE_CARD_TYPES.flatMap(({ name, count, imagePath }) =>
  Array.from({ length: count }, () => ({ name, imagePath }))
)

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5)

type City = { name: string; x: number; y: number }

interface CardInHand {
  name: string
  imagePath: string  // /images/cards-strg-XX.png
  priority: string   // 'A'〜'E'
  isRevealed: boolean
}

interface BattleCard {
  name: string
  imagePath: string  // /images/cards-btl-XXX.png
  priority: string   // AI側のみ 'A','B','C'...、プレイヤー側は ''
  isRevealed: boolean
}

interface DiceResult {
  d1: number
  d2: number
  total: number
  verdict: string
}

// ── ボードコマ ───────────────────────────────────────────────────────
const SNAP_THRESHOLD = 30     // スナップ判定距離（canvas座標系px）
const PIECE_SIZE = 36         // 画面上の表示サイズ（px）
const PC_SIZE    = 38         // PCマーカーの表示サイズ（px）

interface BoardPiece {
  id: string
  type: 'General' | 'CU' | 'PC'
  x: number          // canvas座標 (0〜2362)
  y: number          // canvas座標 (0〜1532)
  imagePath: string
  label?: string
}

// ── シナリオ1 初期配置 ────────────────────────────────────────────────

// PC支配省マッピング
// ※ Umbria / Magna Graecia はデータ上の省名として存在しないため省略
// ※ Carthaginensis → Orospeda（Carthago Nova含む）、Africa → Carthage + Carthaginia
const ROME_PC_PROVINCES     = new Set(['Latium', 'Etruria', 'Samnium', 'Apulia', 'Campania', 'Lucania'])
const CARTHAGE_PC_PROVINCES = new Set(['Baetica', 'Carthage', 'Carthaginia', 'Orospeda'])

function makeCUs(side: 'Rome' | 'Carthage', count: number, x: number, y: number, prefix: string): BoardPiece[] {
  const img1 = side === 'Carthage' ? '/images/tkn-cus-CarthCU.png'  : '/images/tkn-cus-RomanCU.png'
  const img2 = side === 'Carthage' ? '/images/tkn-cus-CarthCU1.png' : '/images/tkn-cus-RomanCU1.png'
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i}`, type: 'CU' as const, x, y,
    imagePath: i % 2 === 0 ? img1 : img2,
  }))
}

function buildScenario1(): BoardPiece[] {
  const allCities = hannibalData.cities as City[]
  const find = (name: string) => {
    const c = allCities.find(city => city.name === name)
    if (!c) throw new Error(`City not found: ${name}`)
    return { x: c.x, y: c.y }
  }

  const nc  = find('Orospeda - New Carthage')  // Carthago Nova (ID:32)
  const crt = find('Carthage - Carthage')        // Carthage       (ID:41)
  const mas = find('Massilia - Massilia')         // Massilia       (ID:15)
  const lil = find('Sicilia - Lilybaeum')         // Lilybaeum      (ID:94)

  const generals: BoardPiece[] = [
    { id: 'hannibal',  type: 'General', x: nc.x,  y: nc.y,  imagePath: '/images/tkn-gnrl-Hannibal.png',  label: 'Hannibal'  },
    { id: 'hasdrubal', type: 'General', x: nc.x,  y: nc.y,  imagePath: '/images/tkn-gnrl-Hasdrubal.png', label: 'Hasdrubal' },
    { id: 'hanno',     type: 'General', x: crt.x, y: crt.y, imagePath: '/images/tkn-gnrl-Hanno.png',     label: 'Hanno'     },
    { id: 'p-scipio',  type: 'General', x: mas.x, y: mas.y, imagePath: '/images/tkn-gnrl-P. Scipio.png', label: 'P. Scipio' },
    { id: 't-longus',  type: 'General', x: lil.x, y: lil.y, imagePath: '/images/tkn-gnrl-T. Longus.png', label: 'T. Longus' },
  ]

  const cus: BoardPiece[] = [
    ...makeCUs('Carthage', 10, nc.x,  nc.y,  'cu-nc'),
    ...makeCUs('Carthage',  2, crt.x, crt.y, 'cu-crt'),
    ...makeCUs('Rome',      4, mas.x, mas.y, 'cu-mas'),
    ...makeCUs('Rome',      4, lil.x, lil.y, 'cu-lil'),
  ]

  const pcs: BoardPiece[] = []
  for (const city of allCities) {
    if (!city.name.includes(' - ')) continue
    const prov = city.name.split(' - ')[0]
    if (ROME_PC_PROVINCES.has(prov)) {
      pcs.push({ id: `pc-r-${city.name}`, type: 'PC', x: city.x, y: city.y, imagePath: '/images/tkn-PC-RomePC.png' })
    } else if (CARTHAGE_PC_PROVINCES.has(prov)) {
      pcs.push({ id: `pc-c-${city.name}`, type: 'PC', x: city.x, y: city.y, imagePath: '/images/tkn-PC-CarthPC.png' })
    }
  }

  return [...generals, ...cus, ...pcs]
}

const INITIAL_PIECES: BoardPiece[] = buildScenario1()

interface DragState {
  pieceId: string
  offsetX: number
  offsetY: number
  currentX: number
  currentY: number
}

// ── 将軍ステータス ────────────────────────────────────────────────────
const GENERAL_STATS: Record<string, { side: 'Rome' | 'Carthage'; strategy: number; combat: number }> = {
  'Hannibal':          { side: 'Carthage', strategy: 6, combat: 5 },
  'Hasdrubal':         { side: 'Carthage', strategy: 4, combat: 3 },
  'Hanno':             { side: 'Carthage', strategy: 2, combat: 1 },
  'Mago':              { side: 'Carthage', strategy: 3, combat: 2 },
  'H. Gisbo':          { side: 'Carthage', strategy: 2, combat: 2 },
  'Fabius':            { side: 'Rome',     strategy: 3, combat: 2 },
  'Flaminius':         { side: 'Rome',     strategy: 1, combat: 3 },
  'Varro':             { side: 'Rome',     strategy: 1, combat: 2 },
  'A. Paulus':         { side: 'Rome',     strategy: 2, combat: 3 },
  'Marcellus':         { side: 'Rome',     strategy: 3, combat: 4 },
  'G. Nero':           { side: 'Rome',     strategy: 3, combat: 3 },
  'P. Scipio':         { side: 'Rome',     strategy: 3, combat: 2 },
  'Scipio Africanus':  { side: 'Rome',     strategy: 5, combat: 4 },
  'T. Longus':         { side: 'Rome',     strategy: 1, combat: 2 },
}

// ── プレビューデータ型 ────────────────────────────────────────────────
type PreviewData =
  | { kind: 'card';   name: string; imagePath: string; isBack: boolean; priority: string }
  | { kind: 'piece';  piece: BoardPiece; stackedWith: BoardPiece[] }
  | { kind: 'city';   city: City; pieces: BoardPiece[] }
  | null

type SetPreviewFn = (data: PreviewData) => void

// ── MapBoard ─────────────────────────────────────────────────────────

function MapBoard({ cities, setPreview }: { cities: City[]; setPreview: SetPreviewFn }) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const dragRef    = useRef<DragState | null>(null)

  const [pieces, setPieces] = useState<BoardPiece[]>(INITIAL_PIECES)
  const [drag,   setDrag]   = useState<DragState | null>(null)
  // 画像ロード後・リサイズ後にコマ位置を再計算するためのトリガー
  const [, forceUpdate] = useState(0)

  // dragRef を最新の drag と同期（window イベントハンドラ内の stale closure 対策）
  useEffect(() => { dragRef.current = drag }, [drag])

  // canvas scale: canvas の自然サイズ ÷ CSS 表示サイズ
  const getScale = () => {
    const c = canvasRef.current
    if (!c || !c.width) return { sx: 1, sy: 1 }
    const r = c.getBoundingClientRect()
    if (!r.width) return { sx: 1, sy: 1 }
    return { sx: c.width / r.width, sy: c.height / r.height }
  }

  // 地図画像のロードと都市ドットの描画
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.src = '/images/maps-mainmap.png'
    img.onload = () => {
      canvas.width  = img.naturalWidth
      canvas.height = img.naturalHeight
      ctx.drawImage(img, 0, 0)
      for (const city of cities) {
        const isRome = city.name.includes('Rome') || city.name.includes('Rest Position')
        ctx.beginPath()
        ctx.arc(city.x, city.y, 6, 0, Math.PI * 2)
        ctx.fillStyle = isRome ? '#ef4444' : '#facc15'
        ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.75)'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
      forceUpdate(n => n + 1)  // コマ位置を正しいスケールで再計算
    }
    img.onerror = (err) => console.error('[MapBoard] image load FAILED:', err)
  }, [cities])

  // リサイズ時もコマ位置を再計算
  useEffect(() => {
    const handler = () => forceUpdate(n => n + 1)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  // ドラッグ中の window-level マウスイベント
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current
      if (!d) return
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      setDrag(prev => prev
        ? { ...prev, currentX: e.clientX - rect.left - d.offsetX, currentY: e.clientY - rect.top - d.offsetY }
        : null
      )
    }

    const onUp = (e: MouseEvent) => {
      const d = dragRef.current
      if (!d) return
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const { sx, sy } = getScale()

      // display座標 → canvas座標
      const cx = (e.clientX - rect.left - d.offsetX) * sx
      const cy = (e.clientY - rect.top  - d.offsetY) * sy

      // スナップ判定
      let finalX = cx, finalY = cy, minDist = Infinity
      for (const city of cities) {
        const dist = Math.hypot(city.x - cx, city.y - cy)
        if (dist < SNAP_THRESHOLD && dist < minDist) {
          minDist = dist; finalX = city.x; finalY = city.y
        }
      }

      // canvas 範囲内にクランプ
      const canvas = canvasRef.current
      if (canvas) {
        finalX = Math.max(0, Math.min(canvas.width,  finalX))
        finalY = Math.max(0, Math.min(canvas.height, finalY))
      }

      setPieces(prev => prev.map(p => p.id === d.pieceId ? { ...p, x: finalX, y: finalY } : p))
      setDrag(null)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
  }, [cities])

  const handlePieceMouseDown = (pieceId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const { sx, sy } = getScale()
    const piece = pieces.find(p => p.id === pieceId)!
    const dispX = piece.x / sx
    const dispY = piece.y / sy
    setDrag({ pieceId, offsetX: e.clientX - rect.left - dispX, offsetY: e.clientY - rect.top - dispY, currentX: dispX, currentY: dispY })
  }

  // canvas のマウス移動 → 都市プレビュー（ドラッグ中は無効）
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragRef.current) return
    const { sx, sy } = getScale()
    const rect = canvasRef.current!.getBoundingClientRect()
    const cx = (e.clientX - rect.left) * sx
    const cy = (e.clientY - rect.top)  * sy
    let nearest: City | null = null, minDist = Infinity
    for (const city of cities) {
      const d = Math.hypot(city.x - cx, city.y - cy)
      if (d < 20 && d < minDist) { minDist = d; nearest = city }
    }
    if (nearest) {
      const cityPieces = pieces.filter(p =>
        Math.round(p.x) === Math.round(nearest!.x) && Math.round(p.y) === Math.round(nearest!.y)
      )
      setPreview({ kind: 'city', city: nearest, pieces: cityPieces })
    } else {
      setPreview(null)
    }
  }

  // スタック: PCマーカーを除く軍事ユニットのみグループ化
  const stackMap = new Map<string, string[]>()
  for (const p of pieces) {
    if (p.id === drag?.pieceId || p.type === 'PC') continue
    const key = `${Math.round(p.x)},${Math.round(p.y)}`
    const arr = stackMap.get(key) ?? []
    arr.push(p.id)
    stackMap.set(key, arr)
  }

  const { sx, sy } = getScale()

  return (
    <div ref={wrapperRef} className="relative w-full select-none">
      <canvas
        ref={canvasRef}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={() => { if (!drag) setPreview(null) }}
        style={{ maxWidth: '100%', height: 'auto', display: 'block', cursor: drag ? 'grabbing' : 'crosshair' }}
      />

      {/* PCマーカーオーバーレイ（小さく固定、ドラッグなし） */}
      {pieces.filter(p => p.type === 'PC').map((piece) => (
        <div
          key={piece.id}
          style={{
            position: 'absolute',
            left: piece.x / sx - PC_SIZE / 2,
            top:  piece.y / sy - PC_SIZE / 2,
            width: PC_SIZE, height: PC_SIZE,
            zIndex: 4, pointerEvents: 'none',
          }}
        >
          <img src={piece.imagePath} alt="PC" draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'contain',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }} />
        </div>
      ))}

      {/* 軍事ユニットオーバーレイ（将軍・CU、ドラッグ可） */}
      {pieces.filter(p => p.type !== 'PC').map((piece) => {
        const isDragging = drag?.pieceId === piece.id
        let dispX: number, dispY: number

        if (isDragging && drag) {
          dispX = drag.currentX
          dispY = drag.currentY
        } else {
          const key   = `${Math.round(piece.x)},${Math.round(piece.y)}`
          const group = stackMap.get(key) ?? []
          const si    = group.indexOf(piece.id)   // stack index
          dispX = piece.x / sx + si * 12
          dispY = piece.y / sy + si * -4
        }

        return (
          <div
            key={piece.id}
            onMouseDown={(e) => handlePieceMouseDown(piece.id, e)}
            onMouseEnter={() => {
              if (drag) return
              const key = `${Math.round(piece.x)},${Math.round(piece.y)}`
              const others = pieces.filter(p => p.type !== 'PC' && p.id !== piece.id && `${Math.round(p.x)},${Math.round(p.y)}` === key)
              setPreview({ kind: 'piece', piece, stackedWith: others })
            }}
            onMouseLeave={() => setPreview(null)}
            style={{
              position:  'absolute',
              left:      dispX - PIECE_SIZE / 2,
              top:       dispY - PIECE_SIZE / 2,
              width:     PIECE_SIZE,
              height:    PIECE_SIZE,
              zIndex:    isDragging ? 50 : 10,
              cursor:    isDragging ? 'grabbing' : 'grab',
              filter:    isDragging
                ? 'drop-shadow(0 0 5px rgba(255,220,0,0.95))'
                : 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))',
              transition: isDragging ? 'none' : 'filter 0.1s',
            }}
          >
            <img
              src={piece.imagePath}
              alt={piece.label ?? piece.type}
              draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
            />
            {/* ラベル（将軍のみ、ドラッグ中は非表示） */}
            {piece.label && !isDragging && (
              <div style={{
                position: 'absolute', bottom: -10, left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 8, color: 'white', whiteSpace: 'nowrap',
                textShadow: '0 0 3px #000, 0 0 3px #000',
                pointerEvents: 'none',
              }}>
                {piece.label}
              </div>
            )}
          </div>
        )
      })}

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
function CardTile({ card, onReveal, onPreview, onPreviewEnd }: {
  card: CardInHand
  onReveal?: () => void
  onPreview?: SetPreviewFn
  onPreviewEnd?: () => void
}) {
  const [imgError, setImgError] = useState(false)
  const ps = PRIORITY_STYLE[card.priority]

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
      className="relative flex flex-col rounded-md border border-slate-500 bg-slate-600 overflow-hidden"
      onMouseEnter={hoverIn} onMouseLeave={hoverOut}
      style={{ width: 52, height: 82 }}
    >
      <div className="absolute top-0 left-0 text-xs font-bold px-1 leading-5 z-10" style={{ backgroundColor: ps.bg, color: ps.fg }}>
        {card.priority}
      </div>
      {!imgError ? (
        <img src={card.imagePath} alt={card.name} onError={() => setImgError(true)} className="w-full h-full object-cover" />
      ) : (
        <div className="flex-1 flex items-center justify-center px-1 pt-5 pb-1">
          <span className="text-slate-100 text-center leading-tight" style={{ fontSize: 8 }}>{card.name}</span>
        </div>
      )}
    </div>
  )
}

// ── CardDealPanel ────────────────────────────────────────────────────
function CardDealPanel({ setPreview }: { setPreview: SetPreviewFn }) {
  const [playerHand, setPlayerHand] = useState<CardInHand[]>([])
  const [opponentHand, setOpponentHand] = useState<CardInHand[]>([])

  // 山札をシャッフルして交互に INITIAL_DRAW_COUNT 枚ずつ配布
  const dealCards = () => {
    // STRATEGY_DECK をシャッフル（name + imagePath のペアを保持）
    const shuffled = [...STRATEGY_DECK].sort(() => Math.random() - 0.5)
    const pCards: CardInHand[] = []
    const oCards: CardInHand[] = []

    for (let i = 0; i < INITIAL_DRAW_COUNT * 2; i++) {
      const entry: CardInHand = {
        name: shuffled[i].name,
        imagePath: shuffled[i].imagePath,
        priority: '',
        isRevealed: false,
      }
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
                <CardTile key={i} card={card} onReveal={() => revealOpponentCard(i)}
                  onPreview={setPreview} onPreviewEnd={() => setPreview(null)} />
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
                <CardTile key={i} card={card}
                  onPreview={setPreview} onPreviewEnd={() => setPreview(null)} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── BattleCardTile ───────────────────────────────────────────────────
// バトルカード1枚（64×100px）
const BATTLE_BACK = '/images/cards-btl-Back.png'

function BattleCardTile({ card, onReveal, onPreview, onPreviewEnd }: {
  card: BattleCard
  onReveal?: () => void
  onPreview?: SetPreviewFn
  onPreviewEnd?: () => void
}) {
  const [imgError, setImgError] = useState(false)
  const hoverIn  = () => onPreview?.({ kind: 'card', name: card.name, imagePath: card.isRevealed ? card.imagePath : BATTLE_BACK, isBack: !card.isRevealed, priority: card.priority })
  const hoverOut = () => onPreviewEnd?.()
  const ps = card.priority ? PRIORITY_STYLE[card.priority] : null

  if (!card.isRevealed) {
    return (
      <button
        onClick={onReveal}
        onMouseEnter={hoverIn} onMouseLeave={hoverOut}
        title="クリックで公開"
        className="relative flex-shrink-0 rounded-md overflow-hidden border-2 border-slate-600 hover:border-yellow-400 transition-colors"
        style={{ width: 64, height: 100 }}
      >
        <img src={BATTLE_BACK} alt="Card back" className="w-full h-full object-cover" />
        {ps && (
          <span
            className="absolute top-1 left-1 text-sm font-black leading-none rounded px-1"
            style={{ color: ps.fg, backgroundColor: ps.bg }}
          >
            {card.priority}
          </span>
        )}
      </button>
    )
  }

  return (
    <div
      className="relative flex-shrink-0 rounded-md overflow-hidden border border-slate-400"
      onMouseEnter={hoverIn} onMouseLeave={hoverOut}
      style={{ width: 64, height: 100 }}
    >
      {!imgError ? (
        <img
          src={card.imagePath}
          alt={card.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-slate-600 flex items-center justify-center p-1">
          <span className="text-white text-center leading-tight" style={{ fontSize: 9 }}>
            {card.name}
          </span>
        </div>
      )}
      {ps && (
        <span
          className="absolute top-1 left-1 text-xs font-bold leading-none rounded px-1"
          style={{ color: ps.fg, backgroundColor: ps.bg }}
        >
          {card.priority}
        </span>
      )}
    </div>
  )
}

// ── BattleResolverModal ──────────────────────────────────────────────
function BattleResolverModal({ onClose, setPreview }: { onClose: () => void; setPreview: SetPreviewFn }) {
  const [drawPile, setDrawPile] = useState<typeof FULL_BATTLE_DECK>(() => shuffle(FULL_BATTLE_DECK))
  const [discardPile, setDiscardPile] = useState<typeof FULL_BATTLE_DECK>([])
  const [romeHand, setRomeHand] = useState<BattleCard[]>([])
  const [carthageHand, setCarthageHand] = useState<BattleCard[]>([])
  const [romeCount, setRomeCount] = useState(3)
  const [carthageCount, setCarthageCount] = useState(3)

  // 山札が足りなければ捨て札をシャッフルして補充
  const ensureDeck = (draw: typeof drawPile, discard: typeof discardPile, needed: number) => {
    if (draw.length >= needed) return { draw, discard }
    const reshuffled = shuffle([...draw, ...discard])
    return { draw: reshuffled, discard: [] }
  }

  const dealBattleCards = () => {
    const needed = romeCount + carthageCount
    const { draw, discard } = ensureDeck(drawPile, discardPile, needed)
    const drawn = draw.slice(0, needed)
    const remaining = draw.slice(needed)

    const rCards: BattleCard[] = drawn.slice(0, romeCount).map((c) => ({
      ...c, priority: '', isRevealed: true,
    }))
    const cCards: BattleCard[] = drawn.slice(romeCount).map((c, i) => ({
      ...c,
      priority: String.fromCharCode(65 + i),  // A, B, C...
      isRevealed: false,
    }))

    setDrawPile(remaining)
    setDiscardPile(discard)
    setRomeHand(rCards)
    setCarthageHand(cCards)
  }

  const revealCarthageCard = (idx: number) => {
    setCarthageHand(prev => prev.map((c, i) => i === idx ? { ...c, isRevealed: true } : c))
  }

  // 手札を捨て札に戻す
  const clearBattle = () => {
    const returned = [
      ...romeHand.map(({ name, imagePath }) => ({ name, imagePath })),
      ...carthageHand.map(({ name, imagePath }) => ({ name, imagePath })),
    ] as typeof FULL_BATTLE_DECK
    setDiscardPile(prev => [...prev, ...returned])
    setRomeHand([])
    setCarthageHand([])
  }

  const hasHands = romeHand.length > 0 || carthageHand.length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-900 border border-slate-600 rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-800 border-b border-slate-700">
          <h2 className="text-yellow-400 font-bold tracking-wide">⚔ Battle Resolver</h2>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>山札: <strong className="text-white">{drawPile.length}</strong></span>
            <span>捨て札: <strong className="text-white">{discardPile.length}</strong></span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-lg leading-none ml-2"
            >✕</button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* 枚数入力 + ボタン */}
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1 text-xs text-slate-400">
              Rome cards
              <input
                type="number" min={1} max={10} value={romeCount}
                onChange={(e) => setRomeCount(Math.max(1, Number(e.target.value)))}
                className="w-16 bg-slate-700 border border-slate-500 rounded px-2 py-1 text-white text-center"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-400">
              Carthage cards
              <input
                type="number" min={1} max={10} value={carthageCount}
                onChange={(e) => setCarthageCount(Math.max(1, Number(e.target.value)))}
                className="w-16 bg-slate-700 border border-slate-500 rounded px-2 py-1 text-white text-center"
              />
            </label>
            <button
              onClick={dealBattleCards}
              className="bg-red-700 hover:bg-red-600 text-white font-bold px-4 py-2 rounded transition-colors"
            >
              🂠 Deal Battle Cards
            </button>
            {hasHands && (
              <button
                onClick={clearBattle}
                className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded transition-colors text-sm"
              >
                Clear Battle
              </button>
            )}
          </div>

          {hasHands && (
            <div className="space-y-4">
              {/* Carthage AI Hand */}
              <div className="space-y-2">
                <h3 className="text-red-400 font-bold text-xs tracking-wide uppercase">
                  Carthage AI
                  <span className="ml-2 text-slate-500 font-normal normal-case">— クリックで公開</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {carthageHand.map((card, i) => (
                    <BattleCardTile key={i} card={card} onReveal={() => revealCarthageCard(i)}
                      onPreview={setPreview} onPreviewEnd={() => setPreview(null)} />
                  ))}
                </div>
              </div>

              {/* Rome Player Hand */}
              <div className="space-y-2">
                <h3 className="text-blue-400 font-bold text-xs tracking-wide uppercase">Rome (Player)</h3>
                <div className="flex flex-wrap gap-2">
                  {romeHand.map((card, i) => (
                    <BattleCardTile key={i} card={card}
                      onPreview={setPreview} onPreviewEnd={() => setPreview(null)} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* デッキ切れ警告 */}
          {drawPile.length < 6 && (
            <p className="text-yellow-400 text-xs">
              ⚠ 山札残り {drawPile.length} 枚。次のディール時に捨て札 ({discardPile.length} 枚) を自動補充します。
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── PreviewPanel ─────────────────────────────────────────────────────
function PreviewPanel({ data, cursor }: { data: PreviewData; cursor: { x: number; y: number } }) {
  if (!data) return null

  const W = 330
  const estimatedH = data.kind === 'card' ? 480 : data.kind === 'piece' ? 285 : 240
  const margin = 12
  let left = cursor.x + 20
  let top  = cursor.y - estimatedH / 2
  if (left + W > window.innerWidth - margin) left = cursor.x - W - 20
  top = Math.max(margin, Math.min(window.innerHeight - estimatedH - margin, top))

  const panelStyle: React.CSSProperties = {
    position: 'fixed', left, top, width: W, zIndex: 200,
    pointerEvents: 'none',
    background: 'rgba(10, 15, 25, 0.96)',
    border: '1px solid rgba(200,160,50,0.55)',
    borderRadius: 10,
    boxShadow: '0 6px 32px rgba(0,0,0,0.85), inset 0 0 24px rgba(200,160,50,0.04)',
    overflow: 'hidden',
  }

  // カードプレビュー
  if (data.kind === 'card') {
    const ps = data.priority ? PRIORITY_STYLE[data.priority] : null
    return (
      <div style={panelStyle}>
        <div style={{ position: 'relative' }}>
          <img src={data.imagePath} alt={data.name}
            style={{ width: '100%', display: 'block', borderRadius: '10px 10px 0 0' }} />
          {data.isBack && ps && (
            <div style={{
              position: 'absolute', top: 8, left: 8,
              fontSize: 28, fontWeight: 900, lineHeight: 1,
              color: ps.fg, backgroundColor: ps.bg,
              borderRadius: 6, padding: '2px 8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
            }}>{data.priority}</div>
          )}
        </div>
        <div style={{ padding: '8px 10px', borderTop: '1px solid rgba(200,160,50,0.2)' }}>
          <p style={{ fontSize: 11, color: '#c8a840', fontWeight: 700, margin: 0 }}>
            {data.isBack ? '（未公開）' : data.name}
          </p>
        </div>
      </div>
    )
  }

  // コマプレビュー
  if (data.kind === 'piece') {
    const { piece, stackedWith } = data
    const stats = piece.label ? GENERAL_STATS[piece.label] : null
    const sideColor = stats?.side === 'Rome' ? '#60a5fa' : stats?.side === 'Carthage' ? '#f87171' : '#a3a3a3'
    return (
      <div style={panelStyle}>
        <div style={{ display: 'flex', gap: 10, padding: 12 }}>
          <img src={piece.imagePath} alt={piece.label ?? piece.type}
            style={{ width: 72, height: 72, objectFit: 'contain', flexShrink: 0,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#f0e6b0', margin: '0 0 4px' }}>
              {piece.label ?? piece.type}
            </p>
            {stats && (
              <>
                <p style={{ fontSize: 10, color: sideColor, margin: '0 0 6px', fontWeight: 600 }}>{stats.side}</p>
                <table style={{ fontSize: 11, borderCollapse: 'collapse', width: '100%' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: '#94a3b8', paddingRight: 8 }}>Strategy</td>
                      <td style={{ color: '#fbbf24', fontWeight: 700 }}>{stats.strategy}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#94a3b8', paddingRight: 8 }}>Combat</td>
                      <td style={{ color: '#fbbf24', fontWeight: 700 }}>{stats.combat}</td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}
            {!stats && (
              <p style={{ fontSize: 10, color: '#64748b' }}>{piece.type}</p>
            )}
          </div>
        </div>
        {stackedWith.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(200,160,50,0.2)', padding: '6px 12px' }}>
            <p style={{ fontSize: 10, color: '#94a3b8', margin: '0 0 4px' }}>同スペースに共存:</p>
            {stackedWith.map(p => (
              <p key={p.id} style={{ fontSize: 10, color: '#c8a840', margin: 0 }}>
                • {p.label ?? p.type}
              </p>
            ))}
          </div>
        )}
      </div>
    )
  }

  // 都市プレビュー
  if (data.kind === 'city') {
    // PCマーカーで支配状況を判定
    const romePC  = data.pieces.find(p => p.type === 'PC' && p.imagePath.includes('RomePC'))
    const carthPC = data.pieces.find(p => p.type === 'PC' && p.imagePath.includes('CarthPC'))
    const controlColor = romePC ? '#60a5fa' : carthPC ? '#f87171' : '#94a3b8'
    const controlLabel = romePC ? 'Rome'    : carthPC ? 'Carthage' : 'Neutral'
    // 軍事ユニット（PCマーカー除外）
    const militaryPieces = data.pieces.filter(p => p.type !== 'PC')
    return (
      <div style={panelStyle}>
        <div style={{ padding: '10px 12px 6px', borderBottom: '1px solid rgba(200,160,50,0.2)' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#f0e6b0', margin: '0 0 4px' }}>{data.city.name}</p>
          <span style={{ fontSize: 10, fontWeight: 600, color: controlColor,
            background: 'rgba(255,255,255,0.07)', borderRadius: 4, padding: '1px 6px' }}>
            {controlLabel}
          </span>
        </div>
        <div style={{ padding: '8px 12px' }}>
          {militaryPieces.length === 0 ? (
            <p style={{ fontSize: 10, color: '#64748b', margin: 0 }}>ユニットなし</p>
          ) : (
            militaryPieces.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <img src={p.imagePath} alt={p.label ?? p.type}
                  style={{ width: 22, height: 22, objectFit: 'contain',
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }} />
                <span style={{ fontSize: 10, color: '#c8a840' }}>{p.label ?? p.type}</span>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  return null
}

// ── App ──────────────────────────────────────────────────────────────

export default function App() {
  const cities = hannibalData.cities as City[]
  const [battleOpen, setBattleOpen] = useState(false)
  const [preview,    setPreview]    = useState<PreviewData>(null)
  const [cursor,     setCursor]     = useState({ x: 0, y: 0 })

  // グローバルカーソル追跡
  useEffect(() => {
    const h = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [])

  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
      {/* 左: メインマップ */}
      <div className="flex-1 flex flex-col min-w-0 p-3 gap-2 overflow-hidden">
        <h1 className="shrink-0 text-base font-bold text-white">
          Hannibal: Rome vs Carthage — Solo Aid
        </h1>
        <div className="flex-1 overflow-auto">
          <MapBoard cities={cities} setPreview={setPreview} />
        </div>
        <p className="shrink-0 text-xs text-slate-500">
          都市数: {cities.length}　ドットにホバーで都市名・ユニット情報を表示
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
        <StukaJoePanel />
        <CardDealPanel setPreview={setPreview} />
      </div>

      {/* Battle Resolver モーダル */}
      {battleOpen && <BattleResolverModal onClose={() => setBattleOpen(false)} setPreview={setPreview} />}

      {/* フローティングプレビューパネル */}
      <PreviewPanel data={preview} cursor={cursor} />
    </div>
  )
}
