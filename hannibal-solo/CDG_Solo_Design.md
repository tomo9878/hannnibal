# CDG Solo System 実装設計書【確定版】
## Hannibal: Rome vs Carthage — Solo Aid

**対象PDF**: CDG Solo System Rules Summary (by Stuka Joe and Ken Kuhn, GMT Games 2022)
**作成日**: 2026-03-16 / **確定日**: 2026-03-16

---

## 1. 概要・目的

### 現状の問題
現在の実装は「手札N枚から自由選択」方式。プレイヤーが両陣営のカードを自由に選べるため、最適化が容易すぎてゲームバランスや没入感に欠ける。

### CDG Solo System の解決策
**運命ダイス（Fate Die）**で「今ターン選べるカード候補スロット」を絞る。
最終選択はプレイヤーが行うが、候補が制限されることで：
- 過剰な最適化を防ぐ
- 「次に何が来るか」に怯える情報制限（C/D/E裏向き）による緊張感
- 「強力なOps3カードは温存され、小粒なイベントが先に発火する」歴史的リアリティ（e< 制約）
- 両陣営を交互に制御するソロプレイに最適

---

## 2. コンポーネント仕様

### 2.1 Card Display（カード表示）— 確定

各陣営（Rome / Carthage）ごとに **5スロット（A / B / C / D / E）** を持つ表示エリア。

| スロット | ゲーム開始時 / 補充直後 | 役割 |
|---------|----------------------|------|
| A | **表向き（Face-Up）** | 常に可視の選択肢 |
| B | **表向き（Face-Up）** | 常に可視の選択肢 |
| C | 裏向き（Face-Down）| Fate Die で CDE / ABC 時に開示 |
| D | 裏向き（Face-Down）| Fate Die で CDE / DE 時に開示 |
| E | 裏向き（Face-Down）| Fate Die で CDE / DE 時に開示 |

> **補充後のフリップルール（確定）**: 空スロットへの補充は**常に裏向き**で置く。
> 次のFate Die ロール時に対象スロットになった場合のみ表向きにする。
> A/B スロットへの補充も裏向き → 次ターンのダイス結果で AB が出て初めて表になる。

### 2.2 Cards Remaining トラッカー — 確定

| マーカー | 意味 |
|---------|------|
| **Max Hand Size** | そのターンの最大手札数（=カード配布総枚数） |
| **Cards Remaining** | 残りプレイ可能枚数（0になったら手番終了） |

- Strategy Phase 開始時：Cards Remaining = Max Hand Size にリセット
- カードをプレイするたびに：Cards Remaining を -1（即時補充と分離）
- 「即座にカードを引く効果」が発生した場合は -1 しない（PDF 2.2 準拠）

**補充タイミング（確定）**: カードをプレイしたら**即座にストックから1枚補充**し、
常に5スロットを埋める。理由：Fate Die の判定対象を常に5スロット分確保するため。

#### Hannibal の Max Hand Size
| ターン | Rome | Carthage |
|--------|------|----------|
| Turn 1 | 7 | 9 |
| Turn 2 | 8 | 9 |
| Turn 3〜9 | 9 | 9 |

**ストック枚数** = Max Hand Size - 5（例：Turn 3 Rome = 4枚のストック）
ストックが尽きた場合の補充は山札から引く（山札切れ時は捨て札リシャッフル、既存ロジック流用）。

### 2.3 Fate Die（運命ダイス）— 確定

| ダイス面 | 利用可能スロット | e< 制約 | C< !! フォールバック |
|---------|---------------|---------|-------------------|
| **C< !!** | A / B | なし（AB と同扱い） | ✓ 適用 |
| **e<** | A / B / C / D / E（全体） | 最低OPS値のカードを**Event のみ**で使用 | — |
| **ABC** | A / B / C | なし | — |
| **AB** | A / B | なし | — |
| **CDE** | C / D / E | なし | — |
| **DE** | D / E | なし | — |

> **C< !! フォールバック理由**: Hannibalでは戦略カードの「割り込み応答（Response）」は
> Battle Cards フェーズに集約されているため、戦略フェーズでは AB（自由選択）に寄せ、
> AIの停滞を防ぎつつ強力な一手をプレイヤーが選べるようにする。

> **e< の歴史的意義**: 強力なOps3カードは温存され、Ops1〜2の小粒イベントが先に発火する
> → 「ハンニバルのプロパガンダ工作や小競り合いが大作戦より先に起きる」リアリティを再現。

---

## 3. ゲームフロー詳細（確定版）

### 3.1 セットアップ（Strategy Phase 開始時）
```
1. 各陣営の Max Hand Size を確認（ターンによって変動）
2. シングルデッキから交互に各陣営5スロットへ1枚ずつ配布（A-Roma, A-Carth, B-Roma…）
3. スロット A・B を表向きにする / C・D・E は裏向きのまま
4. 残りカード（Max Hand Size - 5 枚）は各陣営のストックとして取り置く
   ※ Rome のストックは Rome 用、Carthage のストックも Carthage 用に番号管理するが
     実際は共有山札の上から取るだけなので物理的分離不要
5. Cards Remaining = Max Hand Size にセット
```

### 3.2 アクション（アクティブサイドのターン）— 確定

```
Step 1: Cards Remaining チェック
  Cards Remaining = 0 → 手番終了（相手サイドへ）
  両陣営 Cards Remaining = 0 → Strategy Phase 終了

Step 2: Fate Die ロール
  → 6面のいずれかを決定
  → 利用可能スロットを表示
  → 裏向きスロットが対象 → そのスロットを表向きにフリップ（アニメーション）

Step 3: カード選択
  ┌─ 通常結果（ABC / AB / CDE / DE / C< !!）
  │   対象スロットの表向きカードから任意の1枚を選択
  │   選択基準：プレイヤーが「そのサイドにとって最善」を判断
  │   OPS / Event どちらの用途でも可（ゲームルール準拠）
  │
  └─ e< 結果
      全スロットの表向きカードのOPS値を比較
      → 最低OPS値のカードを1枚選択（同値なら任意）
      → そのカードを Event としてのみ使用（OPS 使用不可）
      → ただし「最低OPSかつ唯一の表向きOpsカード」なら OPS 使用も可
         （PDF 4.3: "unless it is also the lowest valued operations card face-up"）

Step 4: AI サイドのイベント強制発動（確定）
  Active Side = AI（プレイヤーが操作していない側）の場合：
  → 選択したカードがイベントカードであれば、
    「現在の盤面で実行可能なイベント効果」を強制発動する義務をプレイヤーが負う
  → 判断基準：「AIにとって最も効果的（= プレイヤーにとって最も不利）な方法」で解決
  → 実行不可能なイベント（前提条件なし等）の場合は OPS として使用

Step 5: カード処理
  remove フラグあり → stratRemoved へ追加
  remove フラグなし → stratDiscard へ追加

Step 6: 空きスロット即時補充（確定）
  ストックがある → ストック先頭から1枚取り、裏向きで空きスロットへ
  ストック枯渇  → 山札から1枚引き、裏向きで配置
  山札も空      → 捨て札をリシャッフル後に引く（既存ロジック流用）
  補充は常に裏向き。次ターンのFate Die 結果で対象になって初めて表向き。

Step 7: Cards Remaining を -1

Step 8: ターン交代
  相手サイドの手番へ → Step 1 から繰り返し
```

---

## 4. 特殊カード処理（自動化対象）— 確定

### 4.1 自動発動すべきカード（AIサイド使用時）

以下のカードは AI サイドがプレイした際に即座に効果を解決する。
実装では CardActionModal に「AI Event 自動解決」UIを追加。

| カード名 | 効果 | 自動化処理 |
|---------|------|----------|
| **Messenger Intercepted** | 相手の手札1枚をランダムに捨てさせる | プレイヤー側の表向きカードからランダム1枚を自動選択し捨て札へ。ログに記録 |
| **Spy in Enemy Camp** | 相手の手札を覗く（情報公開） | プレイヤー側の全スロットを一時的に表向きにする → 5秒後に自動で裏向きに戻す |
| **Bad Weather** | 将軍の移動を制限（カウンター） | タイミング表示でプレイヤーに通知。移動処理時に1スペース制限として手動適用 |
| **Hostile Tribes** | 移動中の部隊にCU損失 | タイミング通知のみ。損失計算はプレイヤーが手動 |

> **理由**: 特殊カード自動化でソロプレイのテンポが劇的に向上。
> 完全自動化が困難なカード（盤面依存の損失計算等）はログ通知＋手動処理とする。

### 4.2 プレイヤー側 Active 時のイベント判断基準

- イベント効果が「現在の盤面で最も有利な選択」を強制するものは、プレイヤーが最善を尽くす
- 「ゲームデザインの意図として非最適な選択を強制するイベント」（Senate Dismisses Proconsul 等）は、盤面状況を無視して効果をそのまま実行

---

## 5. 型・状態定義（TypeScript 確定版）

### 5.1 新規型（`src/types.ts` に追加）

```typescript
// Fate Die の6面
export type FateDieFace = 'C<!!' | 'e<' | 'ABC' | 'AB' | 'CDE' | 'DE'

// カードスロット
export interface CardSlot {
  slotId: 'A' | 'B' | 'C' | 'D' | 'E'
  card: CardInHand | null
  faceUp: boolean
}

// 陣営ごとのカードディスプレイ状態
export interface SideDisplay {
  slots: [CardSlot, CardSlot, CardSlot, CardSlot, CardSlot]  // A〜E 固定5要素
  cardsRemaining: number
  maxHandSize: number
  stock: CardInHand[]   // スロット外の取り置きカード（Max Hand Size - 5 枚）
}

// CDG Solo システム全体の状態（App.tsx で管理）
export interface CDGSoloState {
  rome: SideDisplay
  carthage: SideDisplay
  fateDieResult: FateDieFace | null
  availableSlots: Array<'A' | 'B' | 'C' | 'D' | 'E'>
  phase: 'idle' | 'rolled' | 'selecting' | 'played'
}
```

### 5.2 既存型の変更

```typescript
// CardInHand: slotId 追加
export interface CardInHand {
  name: string
  imagePath: string
  ops: 1 | 2 | 3
  side: 'R' | 'C' | 'E'
  counter: boolean
  remove: boolean
  naval: boolean
  priority: string
  isRevealed: boolean
  slotId?: 'A' | 'B' | 'C' | 'D' | 'E'  // ← 追加
}
```

### 5.3 App.tsx の状態変更

```typescript
// 削除する状態
- romeHand: CardInHand[]
- carthageHand: CardInHand[]
- cardsDealt: boolean

// 追加する状態
+ cdgSolo: CDGSoloState | null  // null = 未配布（Strategy Phase 前）

// cardsDealt は cdgSolo !== null で代替
```

### 5.4 SaveData の変更（`src/saveLoad.ts`）

```typescript
export interface SaveData {
  // ... 既存フィールド（romeHand, carthageHand, cardsDealt を削除）
  cdgSolo: CDGSoloState | null  // ← 置き換え
}
```

---

## 6. ロジック関数仕様（`src/data/cdgSolo.ts` 新規）

### 6.1 定数

```typescript
export const FATE_SLOTS: Record<FateDieFace, Array<'A'|'B'|'C'|'D'|'E'>> = {
  'C<!!' : ['A', 'B'],
  'e<'   : ['A', 'B', 'C', 'D', 'E'],
  'ABC'  : ['A', 'B', 'C'],
  'AB'   : ['A', 'B'],
  'CDE'  : ['C', 'D', 'E'],
  'DE'   : ['D', 'E'],
}

// 6面の出現確率（均等）
const FATE_FACES: FateDieFace[] = ['C<!!', 'e<', 'ABC', 'AB', 'CDE', 'DE']
```

### 6.2 関数一覧

```typescript
// ダイスロール（1/6 均等）
export function rollFateDie(): FateDieFace

// 利用可能な表向きカードを返す（e< の場合はフィルタ済みリストを返す）
export function getAvailableCards(
  display: SideDisplay,
  face: FateDieFace
): Array<{ slot: CardSlot; constraint: 'free' | 'event_only' }>

// 初期5スロット配布（配布済みカード5枚を受け取りスロットに配置）
export function initSideDisplay(
  dealt: CardInHand[],       // 5枚
  stock: CardInHand[],       // Max Hand Size - 5 枚
  maxHandSize: number
): SideDisplay

// カードプレイ後の空スロット補充
// ストック → 山札 → リシャッフルの順で取得（呼び出し元がデッキを渡す）
export function refillSlot(
  display: SideDisplay,
  slotId: 'A' | 'B' | 'C' | 'D' | 'E',
  newCard: CardInHand         // 補充するカード（裏向きで配置）
): SideDisplay

// e< 結果時の最低OPS値を計算（表向きカードのみ対象）
export function getLowestOpsValue(display: SideDisplay): number
```

---

## 7. UIコンポーネント設計

### 7.1 CDGCardDisplay コンポーネント（`src/components/CDGCardDisplay.tsx` 新規）

```
┌─────────────────────────────────────────────────────────────┐
│ [⚔ CARTHAGE]   Cards Remaining ●●●●●●●●●  9/9            │
├──────┬──────┬──────┬──────┬──────┬────────────────────────┤
│  A   │  B   │  C   │  D   │  E   │  ストック: 4枚残        │
│[表向]│[表向]│[裏向]│[裏向]│[裏向]│                        │
│ 〜   │ 〜   │  🛡  │  🛡  │  🛡  │                        │
│OPS:3 │OPS:1 │      │      │      │                        │
│Event │Ops   │      │      │      │                        │
└──────┴──────┴──────┴──────┴──────┴────────────────────────┘

選択可能スロット（金枠ハイライト）: A, B, C  ← Fate Die = ABC の場合
```

**インタラクション:**
- 利用可能スロット → **金色ボーダー** でハイライト
- 裏向きスロットがFate Die 対象 → フリップアニメーション（CSS transform rotateY）
- e< 結果 → 最低OPSカードのみクリック可、他は薄い表示
- カードクリック → 既存の CardActionModal を起動
- AI サイドの Card Display → 常に裏向き表示（スロット形状のみ表示）

**Props:**
```typescript
interface CDGCardDisplayProps {
  side: 'Rome' | 'Carthage'
  display: SideDisplay
  isActive: boolean                    // アクティブサイドか
  isPlayerSide: boolean                // プレイヤー操作サイドか
  availableSlots: Array<'A'|'B'|'C'|'D'|'E'>
  fateDieFace: FateDieFace | null
  constraint: 'free' | 'event_only' | null
  onSelectCard: (slot: CardSlot) => void
  setPreview: SetPreviewFn
}
```

### 7.2 FateDiePanel コンポーネント（`src/components/FateDiePanel.tsx` 新規）

```
┌────────────────────────────────────────┐
│  🎲 Fate Die — CARTHAGE のターン        │
│                                        │
│     ┌─────────────────┐               │
│     │      ABC        │  ← 出目（大）  │
│     └─────────────────┘               │
│                                        │
│  → スロット A・B・C が選択可能         │
│  → C は裏向きのためフリップします      │
│                                        │
│  [ 🎲 ダイスを振る ]                   │
│                                        │
│  前回: DE (2ターン前)                  │
└────────────────────────────────────────┘
```

**Props:**
```typescript
interface FateDiePanelProps {
  activeSide: 'Rome' | 'Carthage'
  cardsRemaining: number
  result: FateDieFace | null
  onRoll: () => void
  disabled: boolean   // 既にロール済み / Cards Remaining = 0
}
```

### 7.3 StrategyHandPanel の変更

**現在の構造:**
```
StrategyHandPanel
  ├── Rome Hand (リスト)
  └── Carthage Hand (リスト)
```

**変更後の構造:**
```
StrategyHandPanel
  ├── FateDiePanel          ← 新規追加（アクティブサイドのターン表示）
  ├── CDGCardDisplay (Rome)    ← 新規コンポーネント
  └── CDGCardDisplay (Carthage) ← 新規コンポーネント
```

---

## 8. App.tsx ハンドラー変更

### 8.1 handleDealCards の変更

```typescript
const handleDealCards = () => {
  const { rome: romeMax, carthage: carthMax } = getCardCounts(currentTurn)
  const totalNeeded = romeMax + carthMax

  // リシャッフル処理（既存ロジック流用）
  let deck = [...stratDeck]
  let discard = [...stratDiscard]
  if (deck.length < totalNeeded) {
    deck = shuffle([...deck, ...discard])
    discard = []
    addLog(...)
  }

  // 各陣営に5枚ずつ交互に配布（A-Roma, A-Carth, B-Roma, B-Carth...）
  const romeSlotCards = deck.slice(0, 5)
  const carthSlotCards = deck.slice(5, 10)
  const romeStock  = deck.slice(10, 10 + (romeMax - 5))
  const carthStock = deck.slice(10 + (romeMax - 5), 10 + (romeMax - 5) + (carthMax - 5))
  const remaining  = deck.slice(10 + (romeMax - 5) + (carthMax - 5))

  // isRevealed = playerSide 側の A/B スロットのみ true
  const romeSide  = initSideDisplay(romeSlotCards, romeStock, romeMax)
  const carthSide = initSideDisplay(carthSlotCards, carthStock, carthMax)

  setCdgSolo({
    rome: romeSide,
    carthage: carthSide,
    fateDieResult: null,
    availableSlots: [],
    phase: 'idle',
  })
  setStratDeck(remaining)
  setStratDiscard(discard)
  addLog(currentTurn, currentPhase, `カード配布完了 — Rome: ${romeMax}枚 (5スロット+${romeMax-5}ストック), Carthage: ${carthMax}枚 (5スロット+${carthMax-5}ストック)。山札残り: ${remaining.length}枚。`)
}
```

### 8.2 handleFateRoll（新規）

```typescript
const handleFateRoll = () => {
  if (!cdgSolo) return
  const face = rollFateDie()
  const slots = FATE_SLOTS[face]

  // 裏向きスロットを対象スロット分だけ表向きにする
  const updated = flipSlotsForActiveSide(cdgSolo, activePlayer, slots)

  setCdgSolo({
    ...updated,
    fateDieResult: face,
    availableSlots: slots,
    phase: 'rolled',
  })
  addLog(currentTurn, currentPhase, `[${activePlayer}] Fate Die → ${face}  利用可能スロット: ${slots.join('・')}`)
}
```

### 8.3 handlePlayCard の変更

```typescript
const handlePlayCard = (mode: 'ops' | 'event', opsChoice?: ...) => {
  if (!selectedCard || !cdgSolo) return
  const { fromSide, slotId, card } = selectedCard

  // --- 既存のログ・捨て札処理 ---

  // スロット補充（即時）
  const { card: newCard, updatedDeck, updatedDiscard } = drawOneCard(stratDeck, stratDiscard, stratRemoved)
  const newDisplay = refillSlot(
    fromSide === 'Rome' ? cdgSolo.rome : cdgSolo.carthage,
    slotId,
    { ...newCard, isRevealed: false }  // 常に裏向き
  )

  // Cards Remaining -1
  const updatedSide = { ...newDisplay, cardsRemaining: newDisplay.cardsRemaining - 1 }

  setCdgSolo(prev => prev ? {
    ...prev,
    [fromSide === 'Rome' ? 'rome' : 'carthage']: updatedSide,
    fateDieResult: null,
    availableSlots: [],
    phase: 'idle',
  } : null)

  setStratDeck(updatedDeck)
  setStratDiscard(updatedDiscard)

  advanceTurn(fromSide)
}
```

---

## 9. 勝利条件との連動

- カードプレイ（PC 配置 / 将軍移動）後は既存の `victoryScore` useMemo が自動再計算
- CDG Solo System は勝利条件計算を変更しない
- VictoryScorePanel は変更なし
- AI サイドが PC 配置系カードをプレイした場合の「どの都市を対象にするか」の判断基準：
  → **Stuka Joe ルール（現行の StukaJoePanel）を参照して判断**（設計スコープ外）

---

## 10. 実装ファイル一覧（確定）

| ファイル | 変更種別 | 主な変更内容 |
|---------|---------|------------|
| `src/types.ts` | 変更 | `FateDieFace`, `CardSlot`, `SideDisplay`, `CDGSoloState` 型追加；`CardInHand` に `slotId` 追加 |
| `src/data/cdgSolo.ts` | **新規** | `FATE_SLOTS`, `rollFateDie()`, `initSideDisplay()`, `refillSlot()`, `getAvailableCards()`, `getLowestOpsValue()` |
| `src/components/CDGCardDisplay.tsx` | **新規** | 5スロット表示 + Cards Remaining + フリップアニメーション |
| `src/components/FateDiePanel.tsx` | **新規** | ダイスロール UI・結果表示・利用可能スロット案内 |
| `src/components/StrategyHandPanel.tsx` | 変更 | FateDiePanel + CDGCardDisplay × 2 に差し替え |
| `src/components/CardActionModal.tsx` | 変更 | `e<` Event 限定制約の表示・enforcement；AI Event 自動発動通知 |
| `src/App.tsx` | 変更 | `cdgSolo` state；`handleDealCards` / `handleFateRoll` / `handlePlayCard` 改修；`romeHand` / `carthageHand` / `cardsDealt` 削除 |
| `src/saveLoad.ts` | 変更 | `romeHand` / `carthageHand` / `cardsDealt` → `cdgSolo` に置き換え |

---

## 11. 実装ステップ（推奨順序）

```
Step 1: 型定義（types.ts）
  → FateDieFace, CardSlot, SideDisplay, CDGSoloState, CardInHand.slotId

Step 2: ロジック（data/cdgSolo.ts）
  → 純粋関数のみ、UIなし
  → rollFateDie / initSideDisplay / refillSlot / getAvailableCards / getLowestOpsValue

Step 3: FateDiePanel（コンポーネント単体）

Step 4: CDGCardDisplay（コンポーネント単体）

Step 5: App.tsx 状態・ハンドラー統合
  → cdgSolo state 追加
  → handleDealCards / handleFateRoll / handlePlayCard 改修
  → romeHand / carthageHand / cardsDealt 削除

Step 6: StrategyHandPanel 差し替え

Step 7: CardActionModal e< 制約 + AI Event 通知

Step 8: saveLoad.ts 保存形式対応（SaveData の cdgSolo フィールド）

Step 9: ビルド・動作確認
```

---

## 12. 未決定事項 → 全て決定済み

| # | 項目 | 決定内容 |
|---|------|---------|
| 1 | AI サイドの Card Display 表示 | 裏向き（スロット形状のみ）で表示 |
| 2 | 空スロット補充タイミング | カードプレイ直後に即時補充、常に裏向き |
| 3 | Cards Remaining = 0 の処理 | PDF 準拠（0 = 強制手番終了、パス不可） |
| 4 | e< で全表向きカードが同OPS | プレイヤーが任意選択可（PDF 4.3 準拠） |
| 5 | C< !! のフォールバック | AB と同扱い（最も制限的）|
| 6 | AI サイドのイベント強制発動 | プレイヤーが「AIにとって最も効果的」な方法で解決する義務 |
| 7 | 特殊カード自動処理 | Messenger Intercepted / Spy in Enemy Camp は自動化、その他はログ通知 |
