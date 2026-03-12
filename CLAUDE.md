# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **VASSAL game module** for "Hannibal: Rome vs Carthage" (Valley Games Edition, v1.3.1). It is not a traditional software project — there are no build scripts, package managers, or test suites.

## What's Here

The module lives entirely inside `Hannibal_Valley_en_1.3.1/`:

- **`buildFile`** — The core of the module: a large XML file (~224 KB) that defines all game logic, map configuration, player sides (Rome/Carthage), game pieces, UI, and references to assets. This is the primary file to edit when changing module behavior.
- **`images/`** — 213 PNG/JPG assets referenced by `buildFile`: main map, battle map, 64 strategy cards, battle cards, tokens (combat units, generals, political control markers, siege trains), UI buttons, and rules charts.
- **`VASSAL/build/module/`** — Compiled Java `.class` files for custom extensions:
  - `SwitchPlayerSideCommand` — switches player sides between Rome and Carthage
  - `PieceAutolayouter` — auto-arranges pieces on the map
- **`*.vsav`** — Saved game scenarios (ZIP archives of game state)
- **`*.html`** — In-module documentation (quick-start guide, card list, general abilities)

## Working with This Module

- To use the module, open it in **VASSAL 3.2.16** (the version it was built for).
- The `buildFile` is plain XML and can be edited directly in a text editor, but VASSAL's Module Editor GUI is the intended authoring tool.
- If editing Java classes, the source is not included — only `.class` files are present. You would need to decompile or obtain the original source to make changes.
- Image filenames follow a convention: `tkn-` prefix for tokens, `cards-strg-` for strategy cards, `cards-btl-` for battle cards, `btn-` for UI buttons, `charts-` for reference sheets.
