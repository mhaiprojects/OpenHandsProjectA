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

LAYOUT STRUCTURE:

+------------------------------------------------------------------+
| TOP HUD (FULLY CLICKABLE - opens Stats Panel)                     |
| [CRYPTO: 1,234 (+5/s)] [COMPUTE: 567] [STORAGE: 89] [CREDITS: 12] |
| Click anywhere on HUD -> Opens Stats Modal                        |
+------------------------------------------------------------------+
|        |                                                         |
|  NAV   |                    GAME CONTAINER                       |
|  BAR   |                                                         |
| [Home] |  +--------------------------------------------------+  |
| [Shop] |  |                                                   |  |
| [Prest]|  |           ACTIVE PANEL CONTENT                   |  |
| [Achv] |  |                                                   |  |
| [Sets] |  |    (Home: CPU Core clicker)                       |  |
|        |  |    (Shop: Upgrades)                               |  |
|        |  |    (Prestige: Reboot options)                      |  |
|        |  |    (Achievements: Milestones)                      |  |
|        |  |    (Settings: Config)                             |  |
|        |  |                                                   |  |
|        |  +--------------------------------------------------+  |
|        |                                                         |
|        +---------------------------------------------------------+
|                        ACTION BAR (bottom)                        |
|   [Slot1] [Slot2] [Slot3] [Slot4] [Slot5] (for later use)       |
+------------------------------------------------------------------+

NAV BAR (Left Side):
- Collapsible (icon only when collapsed, icon + label when expanded)
- Stats button at top (opens Stats Modal)
- 5 navigation buttons: Home (default), Shop, Prestige, Achievements, Settings
- Active panel highlighted with border/background
- Smooth transition between collapsed/expanded states

GAME CONTAINER (Center):
- Main render area for active panel
- Home panel: Primary CPU clicker with pulsating animation
- Other panels render their respective content

ACTION BAR (Bottom):
- 5 configurable slots for skills
- Skills unlocked through shop milestones and achievements
- Click skill to activate (if not on cooldown)
- Cooldown indicator on each skill

================================================================
5. DIRECTORY STRUCTURE
================================================================

/index.html                 Main entry point
/css/
  game.css                  Main styles (layout, nav, action bar)
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
    TopHUD.js               Clickable resource display
    NavBar.js               Left collapsible navigation
    GameContainer.js        Center panel area
    ActionBar.js            Bottom action slots
    DetailsModal.js         Full-width income/modifier modal
    HomePanel.js            CPU Core clicker panel
    ShopPanel.js            Upgrade panel
    PrestigePanel.js        Reboot panel
    AchievementsPanel.js    Milestones panel
    SettingsPanel.js        Config panel
/config/
  game.json                 Game settings
  resources.json            Currency definitions
  upgrades.json             Upgrade definitions (with milestone rewards)
  achievements.json        Achievement definitions
  prestige.json            Prestige/reboot settings
  sprites.json              Sprite mappings
  skills.json               Skill definitions (unlockable abilities)
  events.json               Random event/boost definitions
/assets/sprites/
  primary-core.svg          Pulsating clickable (home)
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
- Layout grid (TopHUD | NavBar | GameContainer | ActionBar)
- NavBar collapsible styles
- GameContainer panel styles
- ActionBar 5-slot layout
- Responsive breakpoints

STEP 3: css/animations.css
- Animate.css overrides
- CPU Core pulsating animation (scale + glow)
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
- Resource management (crypto, compute, storage, credits)
- Upgrade tracking
- Cost calculations
- Click power = 5% of total auto-generated primary currency
- Skill management (unlock, activate, cooldown)
- Random event spawning and collection
- Event emission on changes

STEP 8: js/game/GameLoop.js
- requestAnimationFrame loop
- Resource tick (100ms intervals)
- Idle generation calculation
- Random event timer (spawn every 20-40 seconds)
- Click cooldown tracking

STEP 8b: js/game/RandomEvents.js
- Spawn random boost events around Primary CPU
- Spawn interval: 20-40 seconds (random)
- Boost types: 2x crypto for 30s, +100 crypto instant, 2x click for 60s, etc.
- Visual indicator when boost appears (floating, pulsing)
- Click to collect boost
- Boost notification when collected
- Active boosts shown in Top HUD as icons

STEP 9: js/ui/NavBar.js
- Collapsible navigation component
- Icon-only mode (collapsed)
- Icon + label mode (expanded)
- Panel trigger buttons (Home, Shop, Prestige, Achievements, Settings)
- Home is default active

STEP 10: js/ui/TopHUD.js
- Clickable resource display
- Opens DetailsModal on click
- Shows all 4 currencies with rates

STEP 11: js/ui/GameContainer.js
- Center panel area
- Renders active panel content
- Manages panel switching

STEP 12: js/ui/ActionBar.js
- 5 horizontal slots at bottom
- Styled for future use (abilities, items)
- Functional hooks for later

STEP 13: js/ui/DetailsModal.js
- Full-width canvas-wide scrollable modal
- Shows all income sources
- Shows all modifiers
- Triggered by clicking TopHUD

STEP 14: js/ui/HomePanel.js
- Primary CPU pulsating graphic (SVG with animate.css pulse)
- Clickable to generate primary currency
- Click power = 5% of total auto-generated primary currency
- Floating "+X" text on click
- Visual feedback (scale animation on click)
- Centered in GameContainer
- Random boost events appear around the Core
- Active boosts displayed as floating icons near Core

STEP 14b: js/ui/StatsModal.js
- Full-width modal triggered by TopHUD click OR Stats nav button
- Shows all currencies with detailed breakdown
- Section: Currency Overview (current, rate per sec)
- Section: Income Sources (list of all generators and their output)
- Section: Click Reward (base + modifiers = total)
- Section: Temporary Modifiers (active boosts, timers)
- Section: Permanent Modifiers (prestige multiplier, achievements)
- Section: Active Boosts (icons with remaining time)
- Close button to dismiss

STEP 15: js/ui/ShopPanel.js
- Upgrade list with categories (Systems, AI Models, Extensions, Auto)
- Each upgrade shows: name, cost, effect, owned count
- Category filter tabs at top
- Affordable upgrades highlighted
- Unaffordable upgrades grayed out
- Purchase button with click handler
- Cost scales with owned count (baseCost * multiplier^owned)
- Purchase milestone rewards skill unlock notification

STEP 15b: js/ui/ActionBar.js
- 5 configurable skill slots
- Drag-and-drop or click to assign unlocked skills
- Skill icons show cooldown timer
- Click assigned skill to activate effect
- Unassigned slots show "+" to open skill selector
- Skill selector shows all unlocked skills
- Equipped skills persist to save

STEP 16: js/ui/PrestigePanel.js
- Prestige level display
- Current multiplier (based on prestige level)
- Progress to next prestige (clicks required)
- Reset button with confirmation dialog
- Shows what will be reset (upgrades, clicks)
- Shows what will be kept (crypto, prestige level)
- Reboot button triggers game reset with multiplier bonus

STEP 17: js/ui/AchievementsPanel.js
- List of all achievements (locked and unlocked)
- Locked: grayed out, progress bar
- Unlocked: highlighted, checkmark, timestamp
- Each achievement shows: name, description, progress, reward
- Achievement notification popup when unlocked

STEP 18: js/ui/SettingsPanel.js
- Sound toggle (on/off) - for future use
- Reset progress button (with confirmation)
- Export save data (JSON download)
- Import save data (JSON upload)
- Version number display
- Credits/About section

STEP 19: config/*.json
- game.json, resources.json, upgrades.json
- achievements.json, prestige.json, sprites.json

STEP 20: assets/sprites/*.svg
- CPU Core pulsating graphic
- 16+ SVG sprites
- Inline as base64 for CORS

STEP 21: Testing and Polish
- All validation checks
- Responsive layout
- Mobile support

================================================================
9. CONFIGURATION SPECIFICATIONS
================================================================

ALL CONTENT MUST BE IN JSON. CHANGING JSON FILES MUST NOT
REQUIRE CODE CHANGES.

game.json:
{
  "title": "My AFK AI",
  "tagline": "Build your AI empire",
  "clickPowerPercent": 5,
  "tickRate": 100,
  "autoSaveInterval": 30000
}

resources.json:
{
  "crypto": { "icon": "BTC", "color": "#f7931a", "perClick": 1, "perSec": 0 },
  "compute": { "icon": "CPU", "color": "#00d4ff", "perClick": 0, "perSec": 0 },
  "storage": { "icon": "STO", "color": "#a855f7", "perClick": 0, "perSec": 0 },
  "credits": { "icon": "CRD", "color": "#22c55e", "perClick": 0, "perSec": 0 }
}

upgrades.json (12 UPGRADES WITH MILESTONE REWARDS):
[
  {
    "id": "basic_cpu",
    "name": "Basic CPU",
    "description": "Entry-level processor for AI tasks",
    "category": "systems",
    "baseCost": 10,
    "costCurrency": "crypto",
    "costMultiplier": 1.15,
    "effect": { "crypto": 0.5, "compute": 0.1 }
  },
  {
    "id": "advanced_gpu",
    "name": "Advanced GPU",
    "description": "High-performance graphics processor",
    "category": "systems",
    "baseCost": 100,
    "costCurrency": "crypto",
    "costMultiplier": 1.18,
    "effect": { "compute": 1 },
    "milestoneReward": { "skill": "quick_cash", "atOwned": 5 }
  },
  {
    "id": "neural_net",
    "name": "Neural Network",
    "description": "Basic neural network for learning",
    "category": "ai_models",
    "baseCost": 500,
    "costCurrency": "compute",
    "costMultiplier": 1.20,
    "effect": { "crypto": 2 }
  },
  {
    "id": "llm_basic",
    "name": "LLM - GPT-3.5",
    "description": "Language model for text generation",
    "category": "ai_models",
    "baseCost": 2000,
    "costCurrency": "compute",
    "costMultiplier": 1.22,
    "effect": { "crypto": 5, "credits": 0.1 },
    "milestoneReward": { "skill": "click_burst", "atOwned": 10 }
  },
  {
    "id": "llm_advanced",
    "name": "LLM - GPT-4",
    "description": "Advanced language model",
    "category": "ai_models",
    "baseCost": 10000,
    "costCurrency": "compute",
    "costMultiplier": 1.25,
    "effect": { "crypto": 20, "credits": 0.5 }
  },
  {
    "id": "rag_system",
    "name": "RAG System",
    "description": "Retrieval-Augmented Generation",
    "category": "extensions",
    "baseCost": 5000,
    "costCurrency": "storage",
    "costMultiplier": 1.20,
    "effect": { "crypto": 8, "compute": 2 }
  },
  {
    "id": "api_access",
    "name": "API Access",
    "description": "Access to external APIs",
    "category": "extensions",
    "baseCost": 2000,
    "costCurrency": "credits",
    "costMultiplier": 1.18,
    "effect": { "crypto": 3 }
  },
  {
    "id": "parallel_proc",
    "name": "Parallel Processing",
    "description": "Run multiple AI tasks simultaneously",
    "category": "systems",
    "baseCost": 10000,
    "costCurrency": "crypto",
    "costMultiplier": 1.25,
    "effect": { "compute": 5 }
  },
  {
    "id": "quantum_core",
    "name": "Quantum Core",
    "description": "Quantum computing enhancement",
    "category": "systems",
    "baseCost": 100000,
    "costCurrency": "crypto",
    "costMultiplier": 1.30,
    "effect": { "crypto": 50, "compute": 10 }
  },
  {
    "id": "auto_trainer",
    "name": "Auto Trainer",
    "description": "Automatically trains AI models",
    "category": "auto",
    "baseCost": 50000,
    "costCurrency": "credits",
    "costMultiplier": 1.25,
    "effect": { "crypto": 15 }
  },
  {
    "id": "storage_array",
    "name": "Storage Array",
    "description": "Large data storage for RAG",
    "category": "extensions",
    "baseCost": 3000,
    "costCurrency": "crypto",
    "costMultiplier": 1.15,
    "effect": { "storage": 1 }
  },
  {
    "id": "script_kiddie",
    "name": "Script Kiddie",
    "description": "Automates simple tasks",
    "category": "auto",
    "baseCost": 100,
    "costCurrency": "crypto",
    "costMultiplier": 1.12,
    "effect": { "crypto": 0.3 }
  }
]

achievements.json (10 ACHIEVEMENTS):
[
  {
    "id": "first_click",
    "name": "First Click",
    "description": "Click the CPU Core for the first time",
    "condition": { "type": "clicks", "value": 1 },
    "reward": { "crypto": 10 }
  },
  {
    "id": "clicker_10",
    "name": "Getting Started",
    "description": "Perform 10 clicks",
    "condition": { "type": "clicks", "value": 10 },
    "reward": { "crypto": 50 }
  },
  {
    "id": "clicker_100",
    "name": "Dedicated Clicker",
    "description": "Perform 100 clicks",
    "condition": { "type": "clicks", "value": 100 },
    "reward": { "crypto": 500 }
  },
  {
    "id": "first_upgrade",
    "name": "First Purchase",
    "description": "Buy your first upgrade",
    "condition": { "type": "upgrades_owned", "value": 1 },
    "reward": { "crypto": 100 }
  },
  {
    "id": "rich_1000",
    "name": "Crypto Millionaire",
    "description": "Accumulate 1,000 crypto",
    "condition": { "type": "crypto", "value": 1000 },
    "reward": { "compute": 100 }
  },
  {
    "id": "rich_10000",
    "name": "Crypto Tycoon",
    "description": "Accumulate 10,000 crypto",
    "condition": { "type": "crypto", "value": 10000 },
    "reward": { "crypto": 1000 }
  },
  {
    "id": "collector",
    "name": "Collector",
    "description": "Own at least one of each upgrade category",
    "condition": { "type": "categories_owned", "value": 4 },
    "reward": { "credits": 100 }
  },
  {
    "id": "prestige_1",
    "name": "First Reboot",
    "description": "Perform your first prestige",
    "condition": { "type": "prestige_level", "value": 1 },
    "reward": { "crypto": 5000 }
  },
  {
    "id": "idle_master",
    "name": "Idle Master",
    "description": "Generate 100 crypto per second from idle",
    "condition": { "type": "crypto_per_sec", "value": 100 },
    "reward": { "crypto": 5000 }
  },
  {
    "id": "max_prestige",
    "name": "Ascension",
    "description": "Reach prestige level 10",
    "condition": { "type": "prestige_level", "value": 10 },
    "reward": { "crypto": 50000 }
  }
]

prestige.json:
{
  "enabled": true,
  "minClicksRequired": 1000,
  "clickRequirementIncrease": 500,
  "multiplierPerLevel": 1.5,
  "resetOnPrestige": ["upgrades", "clicks"],
  "keepOnPrestige": ["crypto", "storage", "prestigeLevel"],
  "description": "Reboot your AI empire for a permanent multiplier boost"
}

sprites.json:
{
  "primary-core": {
    "svg": "data:image/svg+xml,...",
    "width": 128,
    "height": 128,
    "animation": "pulse"
  },
  "basic-cpu": { "svg": "...", "width": 32, "height": 32 },
  "advanced-gpu": { "svg": "...", "width": 32, "height": 32 },
  "neural-net": { "svg": "...", "width": 48, "height": 48 },
  "llm": { "svg": "...", "width": 48, "height": 48 },
  "rag-system": { "svg": "...", "width": 40, "height": 40 },
  "quantum-core": { "svg": "...", "width": 64, "height": 64 }
}

skills.json (8 SKILLS):
[
  {
    "id": "quick_cash",
    "name": "Quick Cash",
    "description": "Instantly gain 10% of your total crypto",
    "cooldown": 60,
    "icon": "coin",
    "unlockCondition": { "type": "upgrades_owned", "value": 5 }
  },
  {
    "id": "click_burst",
    "name": "Click Burst",
    "description": "10x click power for 30 seconds",
    "cooldown": 120,
    "icon": "click",
    "unlockCondition": { "type": "upgrades_owned", "value": 10 }
  },
  {
    "id": "idle_boost",
    "name": "Idle Boost",
    "description": "2x idle generation for 60 seconds",
    "cooldown": 180,
    "icon": "clock",
    "unlockCondition": { "type": "clicks", "value": 500 }
  },
  {
    "id": "mega_click",
    "name": "Mega Click",
    "description": "100x click power for 15 seconds",
    "cooldown": 300,
    "icon": "star",
    "unlockCondition": { "type": "achievements", "value": 3 }
  },
  {
    "id": "crypto_rain",
    "name": "Crypto Rain",
    "description": "Gain 1000 crypto instantly",
    "cooldown": 240,
    "icon": "cloud",
    "unlockCondition": { "type": "crypto_total", "value": 10000 }
  },
  {
    "id": "time_warp",
    "name": "Time Warp",
    "description": "Gain 1 hour of idle progress instantly",
    "cooldown": 600,
    "icon": "warp",
    "unlockCondition": { "type": "prestige_level", "value": 1 }
  },
  {
    "id": "skill_sharpen",
    "name": "Skill Sharpen",
    "description": "Reduce all skill cooldowns by 50% for 2 minutes",
    "cooldown": 300,
    "icon": "sharpen",
    "unlockCondition": { "type": "achievements", "value": 5 }
  },
  {
    "id": "prestige_gift",
    "name": "Prestige Gift",
    "description": "Gain crypto equal to 10% of lifetime crypto on prestige",
    "cooldown": 0,
    "icon": "gift",
    "unlockCondition": { "type": "prestige_level", "value": 3 }
  }
]

events.json (8 BOOST TYPES):
[
  {
    "id": "double_crypto",
    "name": "2x Crypto",
    "type": "multiplier",
    "effect": { "crypto": 2 },
    "duration": 30,
    "rarity": "common"
  },
  {
    "id": "instant_crypto",
    "name": "+100 Crypto",
    "type": "instant",
    "effect": { "crypto": 100 },
    "duration": 0,
    "rarity": "common"
  },
  {
    "id": "double_clicks",
    "name": "2x Clicks",
    "type": "multiplier",
    "effect": { "clickPower": 2 },
    "duration": 60,
    "rarity": "uncommon"
  },
  {
    "id": "triple_crypto",
    "name": "3x Crypto",
    "type": "multiplier",
    "effect": { "crypto": 3 },
    "duration": 15,
    "rarity": "rare"
  },
  {
    "id": "double_compute",
    "name": "2x Compute",
    "type": "multiplier",
    "effect": { "compute": 2 },
    "duration": 45,
    "rarity": "uncommon"
  },
  {
    "id": "instant_crypto_big",
    "name": "+500 Crypto",
    "type": "instant",
    "effect": { "crypto": 500 },
    "duration": 0,
    "rarity": "rare"
  },
  {
    "id": "credits_boost",
    "name": "+50 Credits",
    "type": "instant",
    "effect": { "credits": 50 },
    "duration": 0,
    "rarity": "uncommon"
  },
  {
    "id": "five_x_crypto",
    "name": "5x Crypto",
    "type": "multiplier",
    "effect": { "crypto": 5 },
    "duration": 10,
    "rarity": "legendary"
  }
]

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
- Layout renders correctly (TopHUD, NavBar, GameContainer, ActionBar)

NAVIGATION:
- NavBar is collapsible (icon only / icon + label)
- Home panel is default active
- Can switch between panels (Shop, Prestige, Achievements, Settings)
- Active panel highlighted in NavBar

HOME PANEL:
- CPU Core pulsating graphic visible
- Click generates primary currency
- Click power = 5% of total auto-generated primary currency
- animate.css pulse animation working

TOP HUD:
- Shows all 4 currencies with rates (Crypto prominent)
- Clickable -> opens StatsModal
- Active boosts shown as icons
- Click ANYWHERE on HUD opens Stats

NAV BAR:
- Stats button at top (opens StatsModal)
- Home, Shop, Prestige, Achievements, Settings buttons
- Collapsible with smooth transition

PRIMARY CPU (Home Panel):
- Pulsating SVG animation
- Click generates currency (5% of auto income)
- Random boosts appear around Core every 20-40 seconds
- Click boost to collect
- Active boosts shown near Core

RANDOM EVENTS:
- Boosts spawn around Primary CPU every 20-40 seconds
- 8 boost types with different rarities
- Click to collect instantly
- Temporary multiplier or instant gain
- Notification when boost collected

STATS MODAL (opened from TopHUD or Nav button):
- Currency Overview section
- Income Sources section
- Click Reward section (base + modifiers)
- Temporary Modifiers section (active boosts)
- Permanent Modifiers section (prestige, achievements)
- Active Boosts section with remaining time

GAMEPLAY:
- Idle generation works (resources accumulate without clicking)
- Shop panel: 12 upgrades across 4 categories visible
- Shop category filter works (Systems, AI Models, Extensions, Auto)
- Can purchase upgrades (cost deducted, owned count increases)
- Upgrade costs scale after purchase (exponential)
- Achievements panel: 10 milestones visible
- Achievement progress tracked and rewards given
- Prestige panel: shows current level, multiplier, progress
- Prestige/reboot works (resets upgrades, keeps crypto + level)
- Settings panel: export/import save, reset button works

SHOP PANEL CONTENT:
- 12 upgrades: Basic CPU, Advanced GPU, Neural Network, GPT-3.5, GPT-4, RAG System, API Access, Parallel Processing, Quantum Core, Auto Trainer, Storage Array, Script Kiddie
- 4 categories: Systems, AI Models, Extensions, Auto
- Each upgrade shows: name, description, cost, effect, owned count

ACHIEVEMENTS PANEL CONTENT:
- 10 achievements: First Click, Getting Started, Dedicated Clicker, First Purchase, Crypto Millionaire, Crypto Tycoon, Collector, First Reboot, Idle Master, Ascension
- Each shows: name, description, progress bar, reward
- Locked achievements grayed out
- Unlocked achievements highlighted with checkmark

PRESTIGE PANEL CONTENT:
- Current prestige level display
- Current multiplier (1.5^level)
- Progress to next prestige (1000 + 500*level clicks required)
- Reset confirmation dialog
- Shows what gets reset vs kept
- Reboot button

SETTINGS PANEL CONTENT:
- Sound toggle (on/off)
- Reset Progress button with confirmation
- Export Save (JSON download)
- Import Save (JSON upload)
- Version: 1.0.0

ACTION BAR:
- 5 slots visible at bottom
- Styled for future use

RESPONSIVE:
- Works on desktop (1200px+)
- Works on tablet (768px)
- Works on mobile (375px)
- Touch events work
- NavBar collapses properly on small screens

PERSISTENCE:
- Refresh page restores state
- Offline time calculates resources
- Clear cache resets game

CONFIG:
- Change title in game.json works
- Change clickPowerPercent in game.json works
- Change upgrade cost in upgrades.json works
- Add currency in resources.json works

================================================================
12. SUCCESS CRITERIA
================================================================

- Zero build: Open index.html with no server
- Layout: TopHUD, NavBar with Stats button, GameContainer, ActionBar all visible
- TopHUD: Fully clickable, opens StatsModal, shows 4 currencies with rates
- NavBar: Stats button at top, 5 navigation buttons, collapsible
- Primary CPU: Home panel has pulsating clickable that generates 5% of auto income
- ActionBar: 5 configurable skill slots
- Skills: 8 unlockable skills from shop milestones and achievements
- Random Events: Boosts spawn every 20-40s around Primary CPU, click to collect
- Shop: 12 upgrades with milestone skill rewards, purchasable, costs scale
- Achievements: 10 milestones, progress tracking, rewards
- Prestige: Level display, multiplier, reboot mechanic
- Settings: Export/import save, reset, version
- Stats Modal: Shows currencies, income sources, click reward, modifiers, boosts
- Playable: Click Primary CPU gains resources
- Upgradeable: Buy upgrades in Shop panel, unlock skills at milestones
- Saveable: Refresh keeps progress
- Configurable: Edit JSON changes game
- Animated: Animate.css pulse on Primary CPU working
- Mobile: Responsive on all devices
- No canvas: Pure DOM rendering
- MVP Complete: All features fully functional with content

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
