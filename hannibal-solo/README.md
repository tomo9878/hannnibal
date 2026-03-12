# Hannibal: Rome vs Carthage — Solo Aid

Hannibal: Rome vs Carthage のソロプレイを支援するWebアプリです。

## 機能

- **マップ表示** — メインマップ画像上に都市座標をプロット。ホバーで都市名を表示。
- **Stuka Joe ソロ判定器** — 2d6を振り、Stuka Joe Universal System 2.0 に基づいて Ops / Event を自動判定。
- **戦略カード配布** — 山札からプレイヤーと対戦相手（AI）に各5枚を交互に配布。AIの手札は裏向きで、クリックで公開。優先順位 A〜E を自動割り当て。

## 技術スタック

- React 19 + TypeScript
- Vite
- Tailwind CSS v4

## 開発環境のセットアップ

```bash
npm install
npm run dev
```

## ビルド

```bash
npm run build
```

## データについて

`src/hannibal_data.json` にマップ上の都市座標と戦略カード・バトルカードのデータが含まれています。カード名は VASSAL モジュール（`Hannibal_Valley_en_1.3.1/buildFile`）から取得しています。
