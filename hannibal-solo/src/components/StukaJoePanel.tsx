import { useState } from 'react'
import type { DiceResult } from '../types'

export function StukaJoePanel() {
  const [result, setResult] = useState<DiceResult | null>(null)
  const [rolling, setRolling] = useState(false)

  const roll = () => {
    setRolling(true)
    setTimeout(() => {
      const d1 = Math.ceil(Math.random() * 6)
      const d2 = Math.ceil(Math.random() * 6)
      const total = d1 + d2
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
              result.total <= 7 ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
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
