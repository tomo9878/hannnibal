import { GENERAL_STATS } from '../data/generals'
import { loadSave } from '../saveLoad'

export function SideSelectModal({
  onSelect,
  onContinue,
}: {
  onSelect: (side: 'Rome' | 'Carthage') => void
  onContinue: () => void
}) {
  const save = loadSave()
  const sides = [
    {
      side: 'Carthage' as const,
      color: '#60a5fa',
      glow: 'rgba(96,165,250,0.15)',
      border: 'rgba(96,165,250,0.5)',
      icon: '🐘',
      general: 'Hannibal',
      tagline: '「ローマを滅ぼすために生まれた」',
      desc: 'イタリア深奥まで踏み込み、同盟都市を切り崩せ。政治的勝利でローマを屈服させよ。',
    },
    {
      side: 'Rome' as const,
      color: '#f87171',
      glow: 'rgba(248,113,113,0.15)',
      border: 'rgba(248,113,113,0.5)',
      icon: '🦅',
      general: 'Scipio Africanus',
      tagline: '「カルタゴを灰にするまで剣を収めぬ」',
      desc: '本土防衛と反攻。ハンニバルをイタリアに封じ込め、アフリカへの道を切り開け。',
    },
  ] as const

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'radial-gradient(ellipse at center, rgba(20,15,5,0.98) 0%, rgba(5,5,15,0.99) 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 32, padding: 24,
    }}>
      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: '#64748b', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 8 }}>
          Hannibal: Rome vs Carthage — Solo Aid
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#c8a840', margin: 0, letterSpacing: 1 }}>
          どちらの陣営を率いますか？
        </h1>
        <p style={{ fontSize: 12, color: '#475569', margin: '8px 0 0', letterSpacing: 0.5 }}>
          AI が相手陣営を担当します
        </p>
      </div>

      {/* Continue save */}
      {save && (
        <button
          onClick={onContinue}
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.08))',
            border: '1px solid rgba(16,185,129,0.5)',
            borderRadius: 10, padding: '14px 32px',
            cursor: 'pointer', color: '#34d399', fontWeight: 700, fontSize: 14,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}
        >
          <span>▶ 続きから再開</span>
          <span style={{ fontSize: 10, color: '#6ee7b7', fontWeight: 400 }}>
            Turn {save.currentTurn} / {save.currentPhase} — {save.playerSide} side
            &nbsp;· {new Date(save.savedAt).toLocaleString('ja-JP', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' })} 保存
          </span>
        </button>
      )}

      {/* Side cards */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
        {sides.map(({ side, color, glow, border, icon, general, tagline, desc }) => {
          const stats = GENERAL_STATS[general]
          return (
            <button
              key={side}
              onClick={() => onSelect(side)}
              style={{
                background: `linear-gradient(160deg, rgba(10,15,25,0.95) 0%, ${glow} 100%)`,
                border: `2px solid ${border}`,
                borderRadius: 14, padding: '28px 28px 24px',
                width: 260, cursor: 'pointer', textAlign: 'left',
                boxShadow: `0 4px 32px ${glow}, 0 0 0 0 transparent`,
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-4px)'
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 48px ${glow}, 0 0 24px ${color}33`
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 32px ${glow}`
              }}
            >
              {/* Side label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 32 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color, letterSpacing: 0.5 }}>{side}</div>
                  <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', letterSpacing: 1 }}>Player Side</div>
                </div>
              </div>

              {/* General portrait */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                <img
                  src={`/images/tkn-gnrl-${general}.png`}
                  alt={general}
                  style={{ width: 56, height: 56, objectFit: 'contain',
                    filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.8))' }}
                  onError={e => { (e.target as HTMLImageElement).style.opacity = '0' }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f0e6b0' }}>{general}</div>
                  <div style={{ fontSize: 9, color: color, fontStyle: 'italic', lineHeight: 1.4, marginTop: 2 }}>
                    {tagline}
                  </div>
                </div>
              </div>

              {/* Stats */}
              {stats && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  {[
                    { label: 'SR', value: stats.strategy, color: '#a78bfa' },
                    { label: 'BR', value: stats.combat,   color: '#f87171' },
                    { label: 'CC', value: stats.command,  color: '#60a5fa' },
                  ].map(s => (
                    <div key={s.label} style={{
                      flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 6,
                      padding: '4px 0', textAlign: 'center',
                      border: `1px solid ${s.color}22`,
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 8, color: '#475569' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Description */}
              <p style={{ fontSize: 10, color: '#64748b', margin: 0, lineHeight: 1.7 }}>{desc}</p>

              {/* CTA */}
              <div style={{
                marginTop: 18, padding: '8px 0', borderRadius: 8,
                background: `${color}22`, border: `1px solid ${color}44`,
                fontSize: 12, fontWeight: 700, color,
                textAlign: 'center',
              }}>
                {side} として始める →
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
