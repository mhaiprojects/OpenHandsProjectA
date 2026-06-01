# 1. OBJECTIVE

Implement "My AFK AI" - a themed idle/incremental game where players build an AI empire, recruit AI models, and install extensions to generate cryptocurrency as the primary currency.

## 2. CONTEXT SUMMARY

**Game Theme:** My AFK AI - Build your AI empire, earn crypto while you sleep

**Core Stack:**
- **Phaser IO 3.x**: 2D game engine via CDN (ES module)
- **Vue 3 CDN**: UI framework via CDN (no npm)
- **Vanilla JS/ES Modules**: No bundler, no TypeScript, runs directly in browser
- **Fetch API**: Load JSON configs at runtime

**Current Implementation Status:**
- ✅ Framework complete (EventBus, ConfigManager, AssetManager, SaveManager)
- ✅ Game engine ready (Phaser MainGame scene, GameManager)
- ✅ UI overlay ready (Vue-based HUD and Shop)
- ✅ "My AFK AI" themed content (4 currencies, 12 upgrades, 16 sprites)
- ⚠️ Polish & UX needs completion (Step 11 remaining)

**Directory Structure:**
```
/index.html         - Main entry, loads all modules via CDN
/config            - JSON configuration files (game.json, resources.json, etc.)
/assets/sprites     - SVG sprite files (16 themed sprites)
/js
  /core             - EventBus, ConfigManager, AssetManager, SaveManager
  /game             - Phaser scenes and game logic (MainGame.js, GameManager.js)
  /ui               - Vue components (GameUI.js)
```

## 3. APPROACH OVERVIEW

**Zero-Build Philosophy:**
1. **No npm, no package.json, no node_modules**
2. **CDN for dependencies**: Phaser and Vue loaded via ES module CDN links
3. **Direct browser execution**: ES modules work natively in modern browsers
4. **Fetch for assets**: JSON configs and SVG files loaded at runtime
5. **Zero compilation**: Edit JS files directly, refresh browser

**Key Principles:**
- Zero hardcoded game content in JS files
- All visual assets configurable via `sprites.json`
- Modular upgrade/resource systems
- Save/load via localStorage with JSON serialization
- Data-driven game design via JSON configs

## 4. IMPLEMENTATION STATUS

### Completed Steps:
| Step | Status | Description |
|------|--------|-------------|
| 1 | ✅ | HTML Entry Point - "My AFK AI" themed |
| 2 | ✅ | Event System - EventBus pub/sub |
| 3 | ✅ | Configuration System - ConfigManager |
| 4 | ✅ | SVG Asset System - AssetManager |
| 5 | ✅ | Game Config JSON - 4 currencies, 12 upgrades |
| 6 | ✅ | Phaser Scene - MainGame with AI orb clicker |
| 7 | ✅ | Game Manager - resource generation, upgrades |
| 8 | ✅ | Vue UI - HUD with resources, Shop overlay |
| 9 | ✅ | Save/Load System - SaveManager, auto-save |
| 10 | ✅ | Demo Game - "My AFK AI" complete |

### Remaining Step:
| Step | Status | Description |
|------|--------|-------------|
| 11 | ✅ | **POLISH & UX** - Complete |

## 5. COMPLETED WORK

### Step 11: Polish & UX ✓
- ✅ Resource rates displayed (/sec) in HUD
- ✅ Resource icons (₿, #, ◈, ◇) with color coding
- ✅ Game title "MY AFK AI" with tagline displayed
- ✅ Upgrade effect descriptions shown (e.g., "+50% crypto")
- ✅ Upgrade owned count and effect preview
- ✅ Screen shake effect on purchase
- ✅ Enhanced CSS styling with cyan/purple theme
- ✅ Better category filtering (All, Systems, AI Models, Extensions, Auto)
- ✅ Affordable upgrades highlighted with border

## 6. TESTING AND VALIDATION

**Success Criteria:**
- Game is immediately playable upon opening index.html
- Clicking generates visible resource gain with feedback
- 4 currencies displayed with icons and rates
- 12 upgrades purchasable across 4 categories
- Upgrade costs scale properly
- Idle generation works
- Save/load preserves exact game state
- All visuals load from JSON configs

**Validation Steps:**
1. Open index.html in browser
2. Verify AI orb clickable with glow effect
3. Click orb → Crypto increases with "+Crypto" feedback
4. Check HUD shows all 4 currencies with rates
5. Purchase "Basic CPU" upgrade → verify effect
6. Watch resources auto-generate over time
7. Refresh page → verify state restored
8. Test Shop categories: Systems, AI Models, Extensions, Automation
