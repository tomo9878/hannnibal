import { GENERAL_STATS } from '../data/generals'

const BASE = import.meta.env.BASE_URL

// ── フレーバーテキスト ─────────────────────────────────────────────────
const FLAVOR: Record<string, { title: string; text: string }> = {
  'Varro': {
    title: '無能な扇動家',
    text: 'カンナエの亡霊、ガイウス・テレンティウス・ウァッロが帰ってきた。元老院の長老たちは頭を抱え、ハンニバルは笑みを浮かべる。ローマよ、今こそ真の覚悟を示せ。',
  },
  'Flaminius': {
    title: '無謀な民衆派',
    text: 'ガイウス・フラミニウスが選ばれた！トラシメヌス湖の教訓を忘れたか？猪突猛進のこの男がローマ軍を率いる。神々よ、ローマをお守りください。',
  },
  'A. Paulus': {
    title: '貴族の矜持',
    text: 'ルキウス・アエミリウス・パウッルスが就任。慎重な貴族派の知将。だが民会はウァッロと彼を共同執政官に選んだ……運命の歯車が回り始める。',
  },
  'Fabius': {
    title: '遅延の達人',
    text: 'クィントゥス・ファビウス・マクシムス「クンクタートル（のろま）」が帰還！影のように敵を追い詰める遅延戦術でハンニバルを消耗させよ。元老院も今は彼を信じる。',
  },
  'Marcellus': {
    title: 'ローマの剣',
    text: 'マルクス・クラウディウス・マルケッルスが選出！シラクサを陥落させた不屈の闘将。五度の執政官経験が示す通り、彼こそローマが誇る最高の野戦指揮官だ。',
  },
  'G. Nero': {
    title: '北の鷹',
    text: 'ガイウス・クラウディウス・ネロが選ばれた。メタウルス川でハスドルバルを撃破した英雄。その電撃的な行軍と判断力で、今度こそハンニバルを追い詰めろ！',
  },
  'P. Scipio': {
    title: 'イベリアの守護者',
    text: 'プブリウス・コルネリウス・スキピオ（父）が登板。イベリア戦線での経験豊富なベテランだが、戦いはまだ続く。若き息子の活躍を祈りながら戦場へ。',
  },
  'T. Longus': {
    title: '焦り者の将',
    text: 'ティベリウス・セムプロニウス・ロングスが就任。トレッビア川で敵の罠にまんまと嵌まった経験は、果たして彼を成長させたのか？今度こそ冷静に判断せよ！',
  },
  'Scipio Africanus': {
    title: '神に選ばれし者',
    text: '!!  スキピオ・アフリカヌスが元老院に立った  !! 新カルタゴを陥落させ、ザマでハンニバルを破った史上最高の名将。カルタゴよ、その滅亡の足音が聞こえるか！？',
  },
}

const DEFAULT_FLAVOR = {
  title: '新執政官',
  text: '元老院の選出により、新たな執政官が就任した。ローマの意志を胸に、ハンニバルに立ち向かえ！',
}

// ── 能力値バー ────────────────────────────────────────────────────────
function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <span style={{ fontSize: 9, color: '#64748b', width: 24, textAlign: 'right', fontWeight: 600 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${(value / max) * 100}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 900, color, width: 18, textAlign: 'center' }}>{value}</span>
    </div>
  )
}

// ── 将軍カード ────────────────────────────────────────────────────────
function GeneralCard({ name, role }: { name: string; role: string }) {
  const stats  = GENERAL_STATS[name]
  const flavor = FLAVOR[name] ?? DEFAULT_FLAVOR
  const roleColor = role.includes('Consul)') && !role.includes('前') ? '#fbbf24' : '#94a3b8'

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${roleColor}44`,
      borderRadius: 10, padding: '16px 18px', flex: 1, minWidth: 200,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {/* Role badge */}
      <div style={{
        fontSize: 9, fontWeight: 700, color: roleColor,
        textTransform: 'uppercase', letterSpacing: 1,
        background: `${roleColor}15`, border: `1px solid ${roleColor}33`,
        borderRadius: 4, padding: '2px 8px', alignSelf: 'flex-start',
      }}>
        {role}
      </div>

      {/* Portrait + name */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <img
          src={`${BASE}images/tkn-gnrl-${name}.png`}
          alt={name}
          style={{ width: 64, height: 64, objectFit: 'contain', flexShrink: 0,
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.8))' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#f0e6b0', marginBottom: 2 }}>{name}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#c8a840', fontStyle: 'italic' }}>
            「{flavor.title}」
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div>
          <StatBar label="SR" value={stats.strategy} max={4} color="#a78bfa" />
          <StatBar label="BR" value={stats.combat}   max={5} color="#f87171" />
          <StatBar label="CC" value={Math.min(stats.command, 10)} max={10} color="#60a5fa" />
        </div>
      )}

      {/* CU placement note */}
      <div style={{
        fontSize: 9, color: '#64748b',
        background: 'rgba(255,255,255,0.03)', borderRadius: 4, padding: '4px 8px',
      }}>
        → Rome に <span style={{ color: '#fbbf24', fontWeight: 700 }}>5 CU 以上</span> のスペースに配置（6.5）
      </div>
    </div>
  )
}

// ── Main Modal ────────────────────────────────────────────────────────
export function ElectionModal({
  consul,
  proconsul,
  onClose,
}: {
  consul: string
  proconsul: string
  onClose: () => void
}) {
  const consulFlavor    = FLAVOR[consul]    ?? DEFAULT_FLAVOR
  const proconsulFlavor = FLAVOR[proconsul] ?? DEFAULT_FLAVOR

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(0,0,0,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: 'linear-gradient(160deg, rgba(10,15,30,0.99) 0%, rgba(20,15,5,0.99) 100%)',
        border: '1px solid rgba(200,160,50,0.5)',
        borderRadius: 14, width: '100%', maxWidth: 680,
        boxShadow: '0 0 80px rgba(200,160,50,0.12), 0 8px 60px rgba(0,0,0,0.95)',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          background: 'rgba(0,0,0,0.5)', padding: '14px 20px',
          borderBottom: '1px solid rgba(200,160,50,0.25)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>
            SPQR — Senatus Populusque Romanus
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#c8a840', letterSpacing: 1 }}>
            🏛 執政官選出
          </div>
        </div>

        {/* Cards — 2 new Consuls */}
        <div style={{ padding: '20px 20px 8px', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <GeneralCard name={consul}    role="執政官 I (Consul)" />
          <GeneralCard name={proconsul} role="執政官 II (Consul)" />
        </div>

        {/* Proconsul continuation note */}
        <div style={{
          margin: '0 20px 10px',
          background: 'rgba(96,165,250,0.05)',
          border: '1px solid rgba(96,165,250,0.2)',
          borderRadius: 6, padding: '6px 12px',
          fontSize: 10, color: '#94a3b8',
        }}>
          📌 <strong style={{ color: '#60a5fa' }}>Proconsul（前執政官）は継続</strong> — 盤上の Proconsul はそのまま留まります（6.6）。<br />
          ルール 6.2: 補充 5 CU をローマ将軍または Rome に配置（うち3以上をイタリア）。Consul は5 CU 以上のスペースへ配置（6.5）。
        </div>

        {/* Flavor text */}
        <div style={{
          margin: '0 20px 16px',
          background: 'rgba(200,160,50,0.06)',
          border: '1px solid rgba(200,160,50,0.2)',
          borderRadius: 8, padding: '10px 14px',
        }}>
          <p style={{ fontSize: 11, color: '#c8a840', fontWeight: 700, margin: '0 0 4px' }}>
            元老院より：
          </p>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 4px', lineHeight: 1.7 }}>
            {consulFlavor.text}
          </p>
          {proconsul !== consul && (
            <p style={{ fontSize: 10, color: '#64748b', margin: 0, lineHeight: 1.7, fontStyle: 'italic' }}>
              第二執政官 {proconsul}「{proconsulFlavor.title}」も今年の遠征に加わる。
            </p>
          )}
        </div>

        {/* Confirm */}
        <div style={{ padding: '0 20px 20px', textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #92400e, #78350f)',
              border: '1px solid #c8a840',
              color: '#f0e6b0', fontWeight: 800, fontSize: 13,
              padding: '10px 32px', borderRadius: 8, cursor: 'pointer',
              letterSpacing: 0.5,
              boxShadow: '0 2px 12px rgba(200,160,50,0.2)',
            }}
          >
            承認 — ローマのために進め！
          </button>
        </div>
      </div>
    </div>
  )
}
