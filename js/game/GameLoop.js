/**
 * GameLoop - Main game loop controller
 * Handles tick updates, rendering, and game timing
 */
import { EventBus, GameEvents } from '../core/EventBus.js';
import { gameState } from './GameState.js';
import { saveManager } from '../core/SaveManager.js';

class GameLoop {
  constructor() {
    this.eventBus = gameState.eventBus;
    this.state = gameState;
    
    this.isRunning = false;
    this.isPaused = false;
    this.lastFrameTime = 0;
    this.lastUpdateTime = 0;
    this.deltaTime = 0;
    this.frameCount = 0;
    
    this.tickRate = 100; // 10 ticks per second for game logic
    this.maxDeltaTime = 1; // Max 1 second between updates
    this.fps = 60;
    this.fpsInterval = 1000 / this.fps;
    
    this.rafId = null;
    this.tickAccumulator = 0;
    
    // Callbacks
    this.onTick = null;
    this.onRender = null;
    this.onFPSUpdate = null;
    
    // Performance tracking
    this.frameTimes = [];
    this.maxFrameTimes = 60;
  }

  /**
   * Initialize the game loop
   * @param {Object} options - Configuration options
   */
  init(options = {}) {
    if (options.tickRate) this.tickRate = options.tickRate;
    if (options.maxDeltaTime) this.maxDeltaTime = options.maxDeltaTime;
    if (options.onTick) this.onTick = options.onTick;
    if (options.onRender) this.onRender = options.onRender;
    if (options.onFPSUpdate) this.onFPSUpdate = options.onFPSUpdate;
    
    // Initialize auto-save
    saveManager.initAutoSave(() => this.state.getState());
    
    this.eventBus.on(GameEvents.GAME_RESET, () => this.handleReset());
  }

  /**
   * Start the game loop
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.isPaused = false;
    this.lastFrameTime = performance.now();
    this.lastUpdateTime = performance.now();
    this.tickAccumulator = 0;
    
    this.loop();
  }

  /**
   * Stop the game loop
   */
  stop() {
    this.isRunning = false;
    
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Pause the game loop
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * Resume the game loop
   */
  resume() {
    this.isPaused = false;
    this.lastFrameTime = performance.now();
  }

  /**
   * Main game loop
   */
  loop() {
    if (!this.isRunning) return;
    
    this.rafId = requestAnimationFrame((timestamp) => this.loop());
    
    if (this.isPaused) {
      this.lastFrameTime = timestamp;
      return;
    }
    
    // Calculate delta time
    this.deltaTime = (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;
    
    // Cap delta time
    if (this.deltaTime > this.maxDeltaTime) {
      this.deltaTime = this.maxDeltaTime;
    }
    
    // Track frame time for FPS
    this.frameTimes.push(this.deltaTime);
    if (this.frameTimes.length > this.maxFrameTimes) {
      this.frameTimes.shift();
    }
    
    // Accumulate time for fixed timestep updates
    this.tickAccumulator += this.deltaTime;
    
    // Fixed timestep updates
    const tickDuration = 1 / this.tickRate;
    while (this.tickAccumulator >= tickDuration) {
      this.update(tickDuration);
      this.tickAccumulator -= tickDuration;
    }
    
    // Render (variable timestep)
    this.render(this.deltaTime);
    
    // FPS update (every second)
    this.frameCount++;
    if (timestamp - this.lastUpdateTime >= 1000) {
      this.lastUpdateTime = timestamp;
      if (this.onFPSUpdate) {
        this.onFPSUpdate(this.getFPS());
      }
    }
  }

  /**
   * Update game logic
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    // Process game state
    this.state.processTick(deltaTime);
    
    // Check achievements
    this.state.checkAchievements();
    
    // Random event check
    this.checkRandomEvent();
    
    // Emit tick event
    this.eventBus.emit(GameEvents.GAME_TICK, {
      deltaTime,
      totalTime: this.frameCount / this.tickRate
    });
    
    // Call tick callback
    if (this.onTick) {
      this.onTick(deltaTime);
    }
  }

  /**
   * Render the game
   * @param {number} deltaTime - Time since last frame
   */
  render(deltaTime) {
    if (this.onRender) {
      this.onRender(deltaTime);
    }
  }

  /**
   * Check for random events
   */
  checkRandomEvent() {
    // Check every ~10 seconds
    if (this.frameCount % (this.tickRate * 10) !== 0) return;
    
    const events = this.state.config.getAllEvents();
    const availableEvents = events.filter(e => {
      if (!e.unlockRequirement) return true;
      const req = e.unlockRequirement;
      return this.state.state.generators[req.generator]?.quantityPurchased >= req.quantity;
    });
    
    for (const event of availableEvents) {
      if (Math.random() < event.triggerChance) {
        this.triggerEvent(event);
        break; // Only one event per check
      }
    }
  }

  /**
   * Trigger a random event
   * @param {Object} event - Event config
   */
  triggerEvent(event) {
    const now = Date.now();
    
    // Check cooldown
    if (event.cooldown && event.lastTriggered) {
      if (now - event.lastTriggered < event.cooldown * 1000) {
        return;
      }
    }
    
    const eventData = {
      codeName: event.codeName,
      displayName: event.displayName,
      icon: event.icon,
      startTime: now,
      duration: event.duration || 0
    };
    
    // Apply event effects
    if (event.type === 'instantReward') {
      this.applyInstantReward(event);
    } else if (event.type === 'temporaryBoost') {
      eventData.effects = event.effects;
      eventData.endTime = now + (event.duration * 1000);
      this.state.state.activeEvents.push(eventData);
    } else if (event.type === 'mysteryBox') {
      eventData.endTime = now + (event.duration * 1000);
      this.state.state.activeEvents.push(eventData);
    }
    
    event.lastTriggered = now;
    
    this.eventBus.emit(GameEvents.RANDOM_EVENT_START, eventData);
  }

  /**
   * Apply instant reward event
   * @param {Object} event - Event config
   */
  applyInstantReward(event) {
    for (const reward of event.rewards || []) {
      if (reward.min && reward.max) {
        const amount = Math.floor(Math.random() * (reward.max - reward.min + 1)) + reward.min;
        this.state.addResource(reward.resource, amount);
      }
    }
  }

  /**
   * Handle game reset
   */
  handleReset() {
    this.stop();
    this.start();
  }

  /**
   * Get current FPS
   * @returns {number} Current FPS
   */
  getFPS() {
    if (this.frameTimes.length === 0) return 0;
    
    const avgFrameTime = this.frameTimes.reduce((sum, t) => sum + t, 0) / this.frameTimes.length;
    return Math.round(1 / avgFrameTime);
  }

  /**
   * Get performance stats
   * @returns {Object} Performance statistics
   */
  getPerformanceStats() {
    return {
      fps: this.getFPS(),
      frameCount: this.frameCount,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      deltaTime: this.deltaTime
    };
  }

  /**
   * Force save
   */
  forceSave() {
    const state = this.state.getState();
    saveManager.save(state, 'manual');
    this.eventBus.emit(GameEvents.GAME_SAVED, { timestamp: Date.now() });
  }

  /**
   * Load game
   * @returns {boolean} Success
   */
  loadGame() {
    const savedState = saveManager.load();
    
    if (savedState) {
      this.state.init(savedState);
      
      // Calculate offline progress
      const offline = saveManager.calculateOfflineProgress(savedState);
      if (offline.enabled) {
        this.applyOfflineProgress(offline);
      }
      
      this.eventBus.emit(GameEvents.GAME_LOADED, { offlineProgress: offline });
      
      return true;
    }
    
    return false;
  }

  /**
   * Apply offline progress
   * @param {Object} offline - Offline progress data
   */
  applyOfflineProgress(offline) {
    // Apply offline resource gain
    this.state.addResource('timeShards', offline.resourcesGained);
    
    // Emit offline progress event
    this.eventBus.emit(GameEvents.OFFLINE_PROGRESS, offline);
  }

  /**
   * Export save
   * @returns {string} Base64 encoded save
   */
  exportSave() {
    return saveManager.export(this.state.getState());
  }

  /**
   * Import save
   * @param {string} saveString - Base64 encoded save
   * @returns {boolean} Success
   */
  importSave(saveString) {
    const loadedState = saveManager.import(saveString);
    
    if (loadedState) {
      this.state.init(loadedState);
      this.eventBus.emit(GameEvents.GAME_LOADED, { imported: true });
      return true;
    }
    
    return false;
  }

  /**
   * Reset and start new game
   */
  newGame() {
    this.state.resetGame();
    this.frameCount = 0;
    this.start();
  }
}

// Export singleton
const gameLoop = new GameLoop();
export { GameLoop, gameLoop };
export default gameLoop;