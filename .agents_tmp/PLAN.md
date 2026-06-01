# 1. OBJECTIVE

Build a zero-build-system, data-driven idle/incremental game framework using Phaser IO for game rendering and Vue 3 (CDN) for UI overlays. All game data, configuration, and graphical assets are managed through JSON files, enabling easy customization and asset swapping without any build tools or npm.

## 2. CONTEXT SUMMARY

**Core Stack:**
- **Phaser IO 3.x**: 2D game engine via CDN (ES module)
- **Vue 3 CDN**: UI framework via CDN (no npm)
- **Vanilla JS/ES Modules**: No bundler, no TypeScript, runs directly in browser
- **Fetch API**: Load JSON configs at runtime

**Architecture:**
- Pure ES modules loaded via `<script type="module">`
- Phaser handles the game canvas and interactive game objects
- Vue loaded via CDN for reactive UI overlays (menus, HUD, shop)
- Event bus bridges communication between Phaser and Vue
- JSON configurations drive all content (no hardcoded game data)
- SVG assets with JSON-based sprite mappings

**Directory Structure:**
```
/index.html         - Main entry, loads all modules via CDN
/config            - JSON configuration files (game.json, resources.json, etc.)
/assets/sprites     - SVG sprite files
/js
  /core             - EventBus, ConfigManager, AssetManager, SaveManager
  /game             - Phaser scenes and game logic
  /ui               - Vue components (optional, can use vanilla JS)
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

## 4. IMPLEMENTATION STEPS

### Step 1: HTML Entry Point
- **Goal**: Create main index.html that loads everything via CDN
- **Method**: Include Phaser and Vue via ES module CDN, create canvas container and UI overlay div
- **Reference**: /index.html

### Step 2: Core Event System
- **Goal**: Create pub/sub event bus for Phaser ↔ Vue communication
- **Method**: Implement EventBus class with on/off/emit methods; export singleton
- **Reference**: /js/core/EventBus.js

### Step 3: Configuration System
- **Goal**: Build JSON config loader with validation
- **Method**: Create ConfigManager to fetch and parse game.json, resources.json, upgrades.json, sprites.json
- **Reference**: /js/core/ConfigManager.js

### Step 4: SVG Asset System
- **Goal**: Implement asset loading with SVG support and sprite mapping
- **Method**: Create AssetManager that reads sprites.json, loads SVGs as data URLs, creates Phaser textures dynamically
- **Reference**: /js/core/AssetManager.js, /assets/sprites/

### Step 5: Game Config JSON Files
- **Goal**: Create starter JSON configurations
- **Method**: Define config structure for:
  - `game.json`: resolution, FPS, starting values
  - `resources.json`: resource types, icons, generation rates
  - `upgrades.json`: upgrade definitions with costs/effects
  - `sprites.json`: sprite ID to SVG path mapping, animation definitions
- **Reference**: /config/*.json

### Step 6: Phaser Scene - MainGame
- **Goal**: Create main game scene with idle resource generation
- **Method**: Implement scene with:
  - Resource ticker (generates resources over time)
  - Sprite rendering based on config
  - Click interaction on sprites
- **Reference**: /js/game/MainGame.js

### Step 7: Game Manager
- **Goal**: Orchestrate game state, resources, upgrades, idle loop
- **Method**: Create GameManager class that handles resource generation, upgrade purchases, state updates
- **Reference**: /js/game/GameManager.js

### Step 8: Vue UI - HUD & Shop
- **Goal**: Display resource counts and upgrade shop overlay
- **Method**: Create Vue app via CDN with reactive UI components; subscribe to EventBus for updates
- **Reference**: /js/ui/GameUI.js (or inline in index.html)

### Step 9: Save/Load System
- **Goal**: Persist game state to localStorage
- **Method**: Create SaveManager with auto-save (every 30s) and manual save; serialize game state to JSON
- **Reference**: /js/core/SaveManager.js

### Step 10: Sample Content - Demo Idle Game
- **Goal**: Populate configs with working demo content
- **Method**: Add sample resources, upgrades, SVGs to demonstrate framework capabilities
- **Reference**: /config/*.json, /assets/sprites/*.svg

## 5. TESTING AND VALIDATION

**Success Criteria:**
- Game loads by opening index.html directly in browser (no server needed)
- Resources auto-generate and display in HUD
- Clicking sprites generates resources (configurable)
- Shop displays upgrades from JSON, purchases deduct costs
- Game state saves to localStorage and restores on reload
- SVG assets render correctly via sprite mapping
- Vue UI updates in real-time as game state changes

**Validation Steps:**
1. Open index.html in browser (file:// protocol works)
2. Verify game canvas renders at configured resolution
3. Check browser console for errors
4. Wait 10 seconds, verify idle resources increase
5. Click on game sprites, verify click rewards
6. Purchase an upgrade, verify cost deduction and effect
7. Refresh page, verify game state restored
8. Edit sprites.json to swap a sprite, verify changes load without code changes
