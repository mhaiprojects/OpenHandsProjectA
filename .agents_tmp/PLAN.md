# Idle Progressive JS Game Framework - "My AFK AI"

## 1. OBJECTIVE

Build **"My AFK AI"** - a themed idle/incremental game where players build an AI empire, recruit AI models, and install extensions to generate cryptocurrency. The game must be fully playable, modifiable via JSON configs, and run without any build system.

---

## 2. DO'S ✅

### Core Architecture DO'S
| Requirement | Implementation |
|-------------|---------------|
| Use Phaser IO 3.x | Load via CDN ES module |
| Use Vue 3 | Load via CDN for reactive UI |
| Load dependencies as ES modules | `<script type="module">` tags |
| Store ALL game data in JSON | /config/*.json files |
| Make all visual assets configurable | sprites.json mappings |
| Implement EventBus | Pub/sub for Phaser↔Vue |
| Use localStorage for saves | Auto-save every 30s |
| Support offline progress | Calculate elapsed time × rates |
| Use SVG for sprites | Scalable, low-res graphics |
| Implement exponential cost scaling | cost × multiplier^n |

### Gameplay DO'S
| Feature | Requirement |
|---------|-------------|
| Click mechanic | With visual feedback (particles, floating text) |
| Idle generation | Auto-income per second |
| Multiple currencies | 4 currencies minimum |
| Multiple upgrade types | 10+ upgrades across categories |
| Progression system | Unlock tiers as you advance |
| Visual polish | Screen shake, number formatting, icons |
| Responsive UI | Show rates (/sec) and owned counts |

### Technical DO'S
| Requirement | Solution |
|-------------|-----------|
| Zero build system | Runs directly in browser |
| No npm | Pure HTML + JS + JSON |
| All content in JSON | /config/*.json |
| All sprites in SVG | /assets/sprites/*.svg |
| Edit → refresh workflow | No compilation needed |

---

## 3. DON'TS ❌

### Architecture DON'TS
| Prohibition | Reason |
|-------------|--------|
| ❌ No npm, Webpack, Vite, or any bundler | Zero-build requirement |
| ❌ No TypeScript | Vanilla JavaScript only |
| ❌ No hardcoded game content | All in JSON configs |
| ❌ No canvas for UI | Use Vue for overlays |
| ❌ No server required | Open index.html directly |

### Content DON'TS
| Prohibition | Reason |
|-------------|--------|
| ❌ No hardcoded sprite references in JS | Map via sprites.json |
| ❌ No hardcoded upgrade costs/effects | Define in upgrades.json |
| ❌ No hardcoded currency types | Define in resources.json |
| ❌ No hardcoded game title/text | Define in game.json |

### Code DON'TS
| Prohibition | Reason |
|-------------|--------|
| ❌ No direct Phaser↔Vue coupling | Use EventBus |
| ❌ No `var` keywords | Use `const`/`let` |
| ❌ No callbacks where async/await fits | Modern syntax |
| ❌ No complex object serialization | JSON only |

---

## 4. CONTEXT SUMMARY

### Core Stack
```
Browser
├── index.html (loads everything via CDN)
├── Phaser 3.x (CDN) │ Vue 3 (CDN)
│   ├─ Game Canvas   │   ├─ HUD Overlay
│   ├─ Clickables     │   ├─ Shop Panel
│   └─ Particles      │   └─ Resource Display
├── EventBus.js ← Bridges Phaser ↔ Vue
├── ConfigManager.js ← Loads /config/*.json
├── AssetManager.js ← Loads /assets/sprites/*.svg
├── SaveManager.js ← localStorage
└── GameManager.js ← Game logic
```

### Directory Structure
```
/index.html                     # Main entry
/js/core/
  ├── EventBus.js              # Pub/sub
  ├── ConfigManager.js         # JSON loader
  ├── AssetManager.js          # SVG loader
  └── SaveManager.js           # Persistence
/js/game/
  ├── MainGame.js              # Phaser scene
  └── GameManager.js           # Game logic
/js/ui/
  └── GameUI.js               # Vue UI
/config/                        # JSON configs
  ├── game.json               # Title, resolution
  ├── resources.json          # Currencies
  ├── upgrades.json           # Upgrades
  └── sprites.json            # Sprite mappings
/assets/sprites/               # SVG sprites (16)
```

### Game Content
- **4 Currencies**: Crypto (₿), Compute (#), Storage (◈), Credits (◇)
- **12 Upgrades**: Basic CPU, Advanced GPU, Neural Net, LLM, RAG System, Memory, Storage, API Access, Parallel Processing, Quantum Core, Auto Trainer, Script Kiddie
- **4 Categories**: Systems, AI Models, Extensions, Automation
- **16 Sprites**: SVG icons for all elements

---

## 5. IMPLEMENTATION STEPS

| Step | File | Purpose | Status |
|------|------|---------|--------|
| 1 | /index.html | Load Phaser + Vue via CDN | ✅ |
| 2 | /js/core/EventBus.js | Pub/sub for Phaser↔Vue | ✅ |
| 3 | /js/core/ConfigManager.js | Load JSON configs | ✅ |
| 4 | /js/core/AssetManager.js | Convert SVG to textures | ✅ |
| 5 | /config/*.json | game, resources, upgrades, sprites | ✅ |
| 6 | /js/game/MainGame.js | Clickable AI Orb, particles | ✅ |
| 7 | /js/game/GameManager.js | Resources, upgrades, idle loop | ✅ |
| 8 | /js/ui/GameUI.js | HUD + Shop (Vue) | ✅ |
| 9 | /js/core/SaveManager.js | localStorage persistence | ✅ |
| 10 | /assets/sprites/*.svg | 16 themed SVG sprites | ✅ |
| 11 | All files | Polish: formatting, shake, UX | ✅ |

---

## 6. CONFIGURATION SPECIFICATIONS

### All Content in JSON

| Config File | Content | CANNOT Hardcode |
|-------------|---------|-----------------|
| game.json | Title, resolution, FPS | Title, tagline, sizes |
| resources.json | Currency types, icons | Currency names, rates |
| upgrades.json | Upgrade costs, effects | Costs, multipliers, names |
| sprites.json | Sprite file paths | Any visual asset |

**Changing any JSON must NOT require code changes**

---

## 7. VALIDATION CHECKLIST

### Pre-Launch Verification
- [ ] Open index.html directly (file:// protocol)
- [ ] Canvas renders at configured resolution
- [ ] No console errors
- [ ] All 4 currencies visible in HUD
- [ ] AI Orb visible and glowing

### Gameplay Verification
- [ ] Click AI Orb → "+Crypto" appears
- [ ] Crypto value increases on click
- [ ] Shop opens with button click
- [ ] 12 upgrades visible across categories
- [ ] Can purchase "Basic CPU" with crypto
- [ ] Compute currency increases over time
- [ ] Upgrade costs increase after purchase

### Persistence Verification
- [ ] Refresh page → state fully restored
- [ ] Leave for 1 hour → resources earned
- [ ] Clear cache → reset game

### Config Verification
- [ ] Change game title in game.json → appears
- [ ] Change upgrade cost in upgrades.json → applied
- [ ] Change sprite path in sprites.json → new sprite shown
- [ ] Add new currency in resources.json → appears in HUD

---

## 8. FILE MANIFEST

### Required Files
```
/index.html                    ← Main entry point
/js/core/EventBus.js          ← Event system
/js/core/ConfigManager.js      ← JSON loader
/js/core/AssetManager.js      ← SVG loader
/js/core/SaveManager.js        ← Persistence
/js/game/MainGame.js          ← Phaser scene
/js/game/GameManager.js       ← Game logic
/js/ui/GameUI.js              ← Vue UI
/config/game.json             ← Game settings
/config/resources.json        ← Currencies
/config/upgrades.json         ← Upgrades
/config/sprites.json          ← Sprite mappings
/assets/sprites/*.svg          ← Sprite files (16)
```

### Forbidden Files (DO NOT CREATE)
```
❌ package.json
❌ node_modules/
❌ vite.config.js
❌ webpack.config.js
❌ tsconfig.json
❌ Any build scripts
```

---

## 9. QUICK REFERENCE

### Run the Game
```
Open index.html in browser (no server needed)
```

### Modify the Game
| What to Change | Where to Edit |
|----------------|---------------|
| Title | config/game.json → title |
| Currencies | config/resources.json |
| Upgrades | config/upgrades.json |
| Sprites | config/sprites.json |
| Costs | config/upgrades.json → baseCost |
| Effects | config/upgrades.json → effect |

### Add New Content
1. Create SVG in `/assets/sprites/`
2. Add entry to `sprites.json`
3. Add upgrade to `upgrades.json`
4. Refresh browser

---

## 10. SUCCESS CRITERIA

| Criteria | Test |
|----------|------|
| Zero build | Open index.html with no server |
| Playable | Click orb → gain resources |
| Upgradeable | Buy upgrade → see effect |
| Saveable | Refresh → progress kept |
| Configurable | Edit JSON → game changes |
| Themed | "My AFK AI" identity clear |
| Polished | No lag, clear feedback |
