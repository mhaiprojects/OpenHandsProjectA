# My AFK AI - Idle Progressive Game Framework

================================================================
0. PROGRESS TRACKER
================================================================

[x] Create directory structure
[ ] Create config JSON files (8 files)
[ ] Create core JavaScript modules (EventBus, ConfigManager, SaveManager)
[ ] Create game logic modules (GameState, GameLoop)
[ ] Create UI modules (GameUI, all panels and components)
[ ] Create CSS files (game.css, animations.css)
[ ] Create main index.html
[ ] Create SVG sprite assets (16 sprites)
[ ] Test and validate the game

================================================================
1. OBJECTIVE
================================================================

Build "My AFK AI" - a zero-build idle/incremental game where players build an AI empire, recruit AI models, and install extensions to generate cryptocurrency.

**Requirements:**
- Fully playable with clicker mechanic + idle generation
- Modifiable via JSON configs
- Run without any build system (open index.html directly)
- Pure DOM rendering (NO canvas, NO Phaser)
- Use Vue 3 and animate.css via CDN
- All JS and CSS in separate files (NO inline code)
- 4 currencies, 12+ upgrades, achievements, and prestige system
- Responsive layout (mobile + desktop)

================================================================
2. CONTEXT SUMMARY
================================================================

**Tech Stack:**
- Vue 3 via CDN for UI and reactive game elements
- animate.css via CDN for animations
- requestAnimationFrame for game loop
- localStorage for save persistence
- Vanilla JavaScript (no TypeScript)

**Game Components:**
- 4 currencies: Crypto, Compute, Storage, Credits
- 12 upgrades across 4 categories (Systems, AI Models, Extensions, Auto)
- 10 achievements with milestone rewards
- 8 unlockable skills via shop milestones
- Prestige/reboot mechanic with progression multipliers
- Random boost events every 20-40 seconds

**Directory Structure:**
```
/index.html                 Main entry point
/css/
  game.css                  Main styles
  animations.css            Animate.css customizations
/js/
  core/                     EventBus, ConfigManager, SaveManager
  game/                     GameState, GameLoop
  ui/                       GameUI, panels, modals
/config/
  game.json                 Game settings
  resources.json            Currency definitions
  upgrades.json             Upgrade definitions
  achievements.json         Achievement definitions
  prestige.json             Prestige settings
  sprites.json              Sprite mappings
  skills.json               Skill definitions
  events.json               Random event definitions
/assets/sprites/*.svg       All game sprites
```

================================================================
3. APPROACH OVERVIEW
================================================================

**Architecture: Pure DOM + Vue (No Canvas/Phaser)**

This approach was chosen because:
- Simpler architecture and easier CSS styling
- Vue directly controls DOM elements reactively
- No Phaser CDN dependency needed
- Smaller footprint suitable for idle game scale
- All needed features achievable without canvas

**Tradeoffs considered:**
- Less performant for many elements → Keep sprites under 50
- No built-in sprite batching → Acceptable for idle game
- Different particle system → Use CSS keyframes instead
- No physics → Not needed for idle mechanics

**Implementation Strategy:**
1. Build core systems (EventBus, ConfigManager, SaveManager)
2. Create Vue-based UI components
3. Implement game loop with idle generation
4. Add all panels (Home, Shop, Prestige, Achievements, Settings)
5. Add Stats modal and random boost events
6. Validate on all screen sizes

================================================================
4. IMPLEMENTATION STEPS
================================================================

| Step | Goal | Files |
|------|------|-------|
| 1 | Core Infrastructure | `/js/core/EventBus.js`, `ConfigManager.js`, `SaveManager.js` |
| 2 | Game Logic | `/js/game/GameState.js`, `GameLoop.js` |
| 3 | Vue UI Foundation | `/js/ui/GameUI.js`, `TopHUD.js`, `NavBar.js`, `GameContainer.js`, `ActionBar.js` |
| 4 | Panel Components | `HomePanel.js`, `ShopPanel.js`, `PrestigePanel.js`, `AchievementsPanel.js`, `SettingsPanel.js` |
| 5 | Modals and Events | `DetailsModal.js`, random event spawning every 20-40s |
| 6 | Configuration Files | `/config/*.json` (8 files) |
| 7 | Styling and Assets | `/css/*.css`, `/assets/sprites/*.svg` |
| 8 | Main HTML | `/index.html` linking Vue, animate.css CDN, all files |

**Step 1 Details - Core Infrastructure:**
- **EventBus.js**: Pub/sub event system for component communication
- **ConfigManager.js**: JSON config loader for all game data
- **SaveManager.js**: localStorage persistence with auto-save every 30s

**Step 2 Details - Game Logic:**
- **GameState.js**: Resources, upgrades, idle logic, click handling
- **GameLoop.js**: requestAnimationFrame loop for idle generation

**Step 3 Details - Vue UI Foundation:**
- **GameUI.js**: Main Vue app mounting
- **TopHUD.js**: Clickable resource display with 4 currencies
- **NavBar.js**: Left collapsible navigation (Stats, Home, Shop, Prestige, Achievements, Settings)
- **GameContainer.js**: Center panel area for active content
- **ActionBar.js**: 5 configurable skill slots at bottom

**Step 4 Details - Panel Components:**
- **HomePanel.js**: Primary CPU clicker with pulsating SVG animation
- **ShopPanel.js**: 12 upgrades across 4 categories, exponential cost scaling
- **PrestigePanel.js**: Level display, multiplier (1.5^level), reboot mechanic
- **AchievementsPanel.js**: 10 milestones with progress bars
- **SettingsPanel.js**: Sound toggle, reset, export/import save

**Step 5 Details - Modals and Events:**
- **DetailsModal.js**: Stats display with currency overview, income sources, click reward, modifiers, active boosts
- **Random Events**: Boosts spawn every 20-40s, 8 boost types with different rarities

**Step 6 Details - Configuration Files:**
- **game.json**: Title, click power percent, save settings
- **resources.json**: 4 currency definitions
- **upgrades.json**: 12 upgrades with milestone rewards (skill unlocks)
- **achievements.json**: 10 achievement definitions
- **prestige.json**: Prestige level requirements and multipliers
- **sprites.json**: Sprite mappings for all game elements
- **skills.json**: 8 skill definitions with unlock conditions
- **events.json**: 8 boost types with rarities and effects

**Step 7 Details - Styling and Assets:**
- **game.css**: Main styles for layout, nav, action bar
- **animations.css**: Animate.css customizations and overrides
- **SVG Sprites**: 16+ sprites including primary-core.svg, upgrade icons

**Step 8 Details - Main HTML:**
- Links Vue 3 CDN and animate.css CDN
- Links all CSS and JS files
- No inline styles or scripts
- Mounts Vue app to #app container

================================================================
5. TESTING AND VALIDATION
================================================================

### Layout Verification
- [ ] Open index.html directly (file:// protocol - no server needed)
- [ ] TopHUD visible with 4 currencies and rates
- [ ] NavBar visible with Stats button + 5 nav buttons
- [ ] GameContainer renders active panel content
- [ ] ActionBar visible with 5 skill slots
- [ ] No console errors

### Core Gameplay
- [ ] Click Primary CPU → +Crypto appears with pulse animation
- [ ] Idle generation works (resources accumulate without clicking)
- [ ] TopHUD clickable → opens StatsModal
- [ ] Shop: 12 upgrades across 4 categories visible
- [ ] Can purchase upgrades, costs scale exponentially
- [ ] 10 achievements visible, progress tracked
- [ ] Prestige/reboot mechanic works

### Random Events
- [ ] Boosts spawn around Primary CPU every 20-40 seconds
- [ ] Click boost to collect bonus
- [ ] 8 boost types with different rarities work

### Persistence
- [ ] Refresh page → state fully restored
- [ ] Offline time → resources calculated correctly
- [ ] Export/import save works
- [ ] Reset progress works

### Responsive Design
- [ ] Desktop (1200px+): Full layout
- [ ] Tablet (768px): NavBar collapses
- [ ] Mobile (375px): Stacked layout, touch events work

### Configuration
- [ ] Edit game.json → title changes
- [ ] Edit upgrades.json → costs/effects change
- [ ] Edit resources.json → new currency appears in HUD

================================================================
6. SUCCESS CRITERIA
================================================================

| Criteria | Test |
|----------|------|
| Zero build | Open index.html with no server |
| Playable | Click Primary CPU → gain resources |
| Upgradeable | Buy upgrades in Shop panel |
| Saveable | Refresh keeps progress |
| Configurable | Edit JSON changes game |
| Animated | animate.css pulse on clicker |
| Mobile | Responsive on all devices |
| No canvas | Pure DOM rendering |

================================================================
7. QUICK REFERENCE
================================================================

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

================================================================
8. FILE MANIFEST
================================================================

**Required Files:**
- `/index.html` - Main entry (no inline JS/CSS)
- `/css/game.css` - Main styles
- `/css/animations.css` - Animation overrides
- `/js/core/EventBus.js` - Event system
- `/js/core/ConfigManager.js` - Config loader
- `/js/core/SaveManager.js` - Persistence
- `/js/game/GameState.js` - Game logic
- `/js/game/GameLoop.js` - Game loop
- `/js/ui/GameUI.js` - Vue app
- `/js/ui/TopHUD.js` - Resource display
- `/js/ui/NavBar.js` - Navigation
- `/js/ui/GameContainer.js` - Panel area
- `/js/ui/ActionBar.js` - Skill slots
- `/js/ui/HomePanel.js` - Clicker panel
- `/js/ui/ShopPanel.js` - Upgrade panel
- `/js/ui/PrestigePanel.js` - Reboot panel
- `/js/ui/AchievementsPanel.js` - Milestones
- `/js/ui/SettingsPanel.js` - Config panel
- `/js/ui/DetailsModal.js` - Stats modal
- `/config/game.json` - Game settings
- `/config/resources.json` - Currencies
- `/config/upgrades.json` - Upgrades
- `/config/achievements.json` - Achievements
- `/config/prestige.json` - Prestige settings
- `/config/sprites.json` - Sprite mappings
- `/config/skills.json` - Skill definitions
- `/config/events.json` - Boost definitions
- `/assets/sprites/*.svg` - Sprite files (16+)

**Forbidden Files:**
- ❌ package.json
- ❌ node_modules/
- ❌ vite.config.js
- ❌ webpack.config.js
- ❌ tsconfig.json
- ❌ Any build scripts
- ❌ Any inline styles in HTML
- ❌ Any inline scripts in HTML

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
