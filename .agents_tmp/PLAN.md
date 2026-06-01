# IDLE PROGRESSIVE GAME FRAMEWORK - "MY AFK AI"

================================================================
1. OBJECTIVE
================================================================

Build "My AFK AI" - an idle/incremental game where players build an AI 
empire, recruit AI models, and install extensions to generate cryptocurrency.

Requirements:
- Fully playable
- Modifiable via JSON configs
- Run without any build system
- Pure DOM rendering (NO canvas, NO Phaser)
- Use animate.css for animations
- All JS and CSS in separate files (NO inline code)

================================================================
2. DO'S
================================================================

ARCHITECTURE:
- Use Vue 3 via CDN for UI and game elements
- Use animate.css via CDN for animations
- Use requestAnimationFrame for game loop
- Store ALL game data in JSON config files
- Implement EventBus for component communication
- Use localStorage for saves (auto-save every 30s)
- Support offline progress calculation
- Use SVG for sprites (loaded as img elements)
- Implement exponential cost scaling

GAMEPLAY:
- Click mechanic with animate.css feedback
- Idle generation (auto-income per second)
- 4 currencies (Crypto, Compute, Storage, Credits)
- 12+ upgrades across 4 categories
- Progression system with tier unlocks
- Achievements system with milestones
- Prestige mechanic ("Reboot" option)
- Responsive layout (mobile + desktop)
- Modal shop overlay

CODE ORGANIZATION:
- All JavaScript in /js/*.js files
- All CSS in /css/*.css files
- No inline styles or scripts in HTML
- Zero build system (no npm, no bundler)

================================================================
3. DON'TS
================================================================

ARCHITECTURE:
- NO canvas or Phaser (pure DOM rendering)
- NO npm, Webpack, Vite, or any bundler
- NO TypeScript (vanilla JavaScript only)
- NO hardcoded game content (all in JSON)
- NO server required (open index.html directly)
- NO inline CSS or JavaScript in HTML

CONTENT:
- NO hardcoded sprite references in JS
- NO hardcoded upgrade costs/effects
- NO hardcoded currency types
- NO hardcoded game title/text

CODE:
- NO var keywords (use const/let)
- NO callback hell (prefer async/await)
- NO complex object serialization (JSON only)

================================================================
4. ARCHITECTURE OVERVIEW
================================================================

BROWSER STRUCTURE:
- index.html loads Vue, animate.css, and modules
- Vue App contains all UI components
- Game Loop (requestAnimationFrame) handles tick updates
- EventBus enables component communication

VUE APP COMPONENTS:
- HUD (resource display)
- Game Area (clickable elements)
- Shop (modal overlay)
- Achievements panel
- Prestige panel

GAME LOGIC:
- GameState manages resources and upgrades
- ConfigManager loads JSON configs
- SaveManager handles localStorage
- Offline progress calculation

================================================================
5. DIRECTORY STRUCTURE
================================================================

/index.html                 Main entry point
/css/
  game.css                  Main styles
  animations.css            Animate.css customizations
/js/
  core/
    EventBus.js             Pub/sub event system
    ConfigManager.js        JSON config loader
    SaveManager.js          localStorage persistence
  game/
    GameState.js            Resources, upgrades, idle logic
    GameLoop.js             requestAnimationFrame loop
  ui/
    GameUI.js               Vue app and components
    ClickableSprite.js      Clickable element component
/config/
  game.json                 Game settings
  resources.json            Currency definitions
  upgrades.json             Upgrade definitions
  achievements.json        Achievement definitions
  prestige.json            Prestige/reboot settings
  sprites.json              Sprite mappings
/assets/sprites/
  ai-orb.svg                Main clickable
  *.svg                     All other sprites

================================================================
6. ANIMATION STRATEGY (ANIMATE.CSS)
================================================================

USE ANIMATE.CSS FOR:
- Click feedback (pulse animation)
- Floating text (+Crypto)
- Upgrade purchase effects
- Achievement unlock notifications
- Modal transitions (fadeIn, slideIn)
- Button hover/active states
- Resource gain indicators

CUSTOM CSS FOR:
- Glow effects on clickable (box-shadow)
- Floating number positioning
- Continuous pulse on main clickable
- Progress bar animations

================================================================
7. SIDE EFFECTS OF REMOVING CANVAS/PHASER
================================================================

POSITIVE:
- Simpler architecture
- Easier CSS styling
- Vue directly controls elements
- No Phaser CDN dependency
- Smaller footprint

NEGATIVE (Mitigations):
- Less performance for many elements (keep sprites under 50)
- No built-in sprite batching (acceptable for idle game)
- Different particle system (use CSS keyframes)
- No physics system (not needed for idle)
- Manual z-index management (use CSS layers)

IMPACT: Minimal for idle clicker game. Pure DOM+Vue is 
perfectly suitable and simpler to maintain.

================================================================
8. IMPLEMENTATION STEPS
================================================================

STEP 1: index.html
- Load Vue 3 CDN
- Load animate.css CDN
- Link to CSS files (game.css, animations.css)
- Link to JS modules
- Create Vue mount point
- NO inline styles or scripts

STEP 2: css/game.css
- Reset styles, game container, HUD, modal styling
- Responsive breakpoints
- Custom glow and pulse animations

STEP 3: css/animations.css
- Animate.css overrides
- Custom keyframes
- Floating text animations
- Click feedback styles

STEP 4: js/core/EventBus.js
- Singleton event emitter
- on/off/emit methods
- Event constants

STEP 5: js/core/ConfigManager.js
- Fetch all JSON configs
- Provide get() methods
- Handle loading errors

STEP 6: js/core/SaveManager.js
- localStorage read/write
- Auto-save timer (30s)
- Save on purchase/close
- Offline progress calculation

STEP 7: js/game/GameState.js
- Resource management
- Upgrade tracking
- Cost calculations
- Event emission on changes

STEP 8: js/game/GameLoop.js
- requestAnimationFrame loop
- Resource tick (100ms intervals)
- Click cooldown tracking
- Animation triggers

STEP 9: js/ui/GameUI.js
- Vue 3 app
- HUD component (resources, rates)
- Shop modal component
- Achievement notification
- Prestige panel

STEP 10: js/ui/ClickableSprite.js
- Vue component
- Click handler
- Animate.css classes
- Floating text element

STEP 11: config/*.json
- game.json, resources.json, upgrades.json
- achievements.json, prestige.json, sprites.json

STEP 12: assets/sprites/*.svg
- 16 SVG sprites
- AI orb, CPUs, GPUs, etc.
- Inline as base64 for CORS

STEP 13: Responsive Implementation
- Mobile touch events, scrollable modals, media queries

STEP 14: Testing and Polish
- Validation checks, performance, mobile

================================================================
9. CONFIGURATION SPECIFICATIONS
================================================================

ALL CONTENT MUST BE IN JSON. CHANGING JSON FILES MUST NOT
REQUIRE CODE CHANGES.

game.json:
{
  "title": "My AFK AI",
  "tagline": "Build your AI empire",
  "clickPower": 1,
  "tickRate": 100
}

resources.json:
{
  "crypto": { "icon": "BTC", "color": "#f7931a", "perClick": 1, "perSec": 0 },
  "compute": { "icon": "CPU", "color": "#00d4ff", "perClick": 0, "perSec": 0 },
  "storage": { "icon": "STO", "color": "#a855f7", "perClick": 0, "perSec": 0 },
  "credits": { "icon": "CRD", "color": "#22c55e", "perClick": 0, "perSec": 0 }
}

upgrades.json:
[
  {
    "id": "basic_cpu",
    "name": "Basic CPU",
    "category": "systems",
    "baseCost": 10,
    "costCurrency": "crypto",
    "costMultiplier": 1.15,
    "effect": { "crypto": 0.5, "compute": 0.1 }
  }
]

achievements.json:
[
  {
    "id": "first_click",
    "name": "First Click",
    "description": "Click the AI orb",
    "condition": { "type": "clicks", "value": 1 },
    "reward": { "crypto": 10 }
  }
]

prestige.json:
{
  "enabled": true,
  "minClicks": 1000,
  "multiplierPerLevel": 1.5,
  "resetOnPrestige": ["upgrades", "clicks"]
}

sprites.json:
{
  "ai-orb": {
    "svg": "data:image/svg+xml,...",
    "width": 64,
    "height": 64
  }
}

================================================================
10. FILE MANIFEST
================================================================

REQUIRED FILES:
- /index.html                    Main entry (no inline JS/CSS)
- /css/game.css                  Main styles
- /css/animations.css            Animation overrides
- /js/core/EventBus.js           Event system
- /js/core/ConfigManager.js     Config loader
- /js/core/SaveManager.js        Persistence
- /js/game/GameState.js          Game logic
- /js/game/GameLoop.js           Game loop
- /js/ui/GameUI.js               Vue app
- /js/ui/ClickableSprite.js      Clickable component
- /config/game.json              Game settings
- /config/resources.json          Currencies
- /config/upgrades.json          Upgrades
- /config/achievements.json     Achievements
- /config/prestige.json          Prestige settings
- /config/sprites.json           Sprite mappings
- /assets/sprites/*.svg          Sprite files (16)

FORBIDDEN FILES:
- package.json
- node_modules/
- vite.config.js
- webpack.config.js
- tsconfig.json
- Any build scripts
- Any inline styles in HTML
- Any inline scripts in HTML

================================================================
11. VALIDATION CHECKLIST
================================================================

PRE-LAUNCH:
- Open index.html directly (file:// protocol)
- No console errors
- All 4 currencies visible in HUD
- AI Orb visible with glow animation
- Animate.css animations working

GAMEPLAY:
- Click AI Orb shows +Crypto animation
- Crypto value increases on click
- Shop opens as modal overlay
- 12 upgrades visible across categories
- Can purchase Basic CPU upgrade
- Compute currency increases over time
- Upgrade costs scale after purchase
- Achievements unlock at milestones
- Prestige/reboot works

RESPONSIVE:
- Works on desktop (1200px+)
- Works on tablet (768px)
- Works on mobile (375px)
- Touch events work
- Modal scrolls on small screens

PERSISTENCE:
- Refresh page restores state
- Offline time calculates resources
- Clear cache resets game

CONFIG:
- Change title in game.json works
- Change upgrade cost in upgrades.json works
- Add currency in resources.json works

================================================================
12. SUCCESS CRITERIA
================================================================

- Zero build: Open index.html with no server
- Playable: Click orb gains resources
- Upgradeable: Buy upgrades see effect
- Saveable: Refresh keeps progress
- Configurable: Edit JSON changes game
- Themed: "My AFK AI" identity clear
- Animated: Animate.css working
- Mobile: Responsive on all devices
- No canvas: Pure DOM rendering

---

## 7. VALIDATION CHECKLIST

### Pre-Launch Verification
- [ ] Open index.html directly (file:// protocol)
- [ ] Canvas renders at configured resolution
- [ ] No console errors
- [ ] All 4 currencies visible in HUD
- [ ] AI Orb visible and glowing

### Gameplay Verification
- [ ] Click AI Orb → "+Crypto" appears (subtle)
- [ ] Crypto value increases on click
- [ ] Shop opens as modal overlay
- [ ] 12 upgrades visible across categories
- [ ] Can purchase "Basic CPU" with crypto
- [ ] Compute currency increases over time
- [ ] Upgrade costs increase after purchase
- [ ] Achievements unlock at milestones
- [ ] Prestige/reboot works after high progression

### Responsive Verification
- [ ] Works on desktop (1200px+)
- [ ] Works on tablet (768px)
- [ ] Works on mobile (375px)
- [ ] Touch events work on mobile
- [ ] Modal shop scrolls on small screens

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
/js/core/
  ├── EventBus.js              ← Event system
  ├── ConfigManager.js         ← JSON loader
  ├── AssetManager.js          ← SVG loader
  └── SaveManager.js           ← Persistence
/js/game/
  ├── MainGame.js              ← Phaser scene
  ├── GameManager.js           ← Game logic
  └── AchievementManager.js    ← Achievement tracking
/js/ui/
  └── GameUI.js                ← Vue UI (HUD, Shop, Modal)
/config/
  ├── game.json                ← Game settings
  ├── resources.json           ← Currencies
  ├── upgrades.json            ← Upgrades
  ├── sprites.json             ← Sprite mappings
  ├── achievements.json       ← Achievement definitions
  └── prestige.json           ← Prestige settings
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
