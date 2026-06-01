/**
 * GameLoop - requestAnimationFrame-based game loop
 * Manages tick intervals for idle generation
 */
import { eventBus } from '../core/EventBus.js';

export class GameLoop {
    constructor(gameState, tickRate = 100) {
        this.gameState = gameState;
        this.tickRate = tickRate; // ms between ticks
        this.lastTick = 0;
        this.animationFrameId = null;
        this.isRunning = false;
        
        // Throttle state updates to every 500ms
        this.lastStateUpdate = 0;
        this.stateUpdateInterval = 500;
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTick = performance.now();
        this.lastStateUpdate = performance.now();
        
        this.loop();
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    loop() {
        if (!this.isRunning) return;
        
        const now = performance.now();
        const deltaTime = now - this.lastTick;
        
        // Tick at fixed intervals
        if (deltaTime >= this.tickRate) {
            this.gameState.tick(deltaTime);
            this.lastTick = now;
        }
        
        // Throttled state update for UI
        if (now - this.lastStateUpdate >= this.stateUpdateInterval) {
            this.gameState.emitStateUpdate();
            this.lastStateUpdate = now;
        }
        
        // Continue loop
        this.animationFrameId = requestAnimationFrame(() => this.loop());
    }

    setTickRate(rate) {
        this.tickRate = rate;
    }

    setStateUpdateInterval(interval) {
        this.stateUpdateInterval = interval;
    }
}

export default GameLoop;