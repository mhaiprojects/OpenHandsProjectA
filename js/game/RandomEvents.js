/**
 * RandomEvents - Spawns random boost events around the CPU Core
 * Boosts appear every 20-40 seconds, click to collect
 */
import { eventBus } from '../core/EventBus.js';

export class RandomEvents {
    constructor(gameState) {
        this.gameState = gameState;
        this.activeBoosts = [];
        this.boostTimers = [];
        this.spawnInterval = null;
        this.currentBoost = null;
        
        // Boost types with rarities
        this.boostTypes = [
            { id: 'double_crypto', name: '2x Crypto', icon: '💰', duration: 30, rarity: 0.3 },
            { id: 'instant_crypto', name: '+100 Crypto', icon: '🪙', instant: 100, rarity: 0.25 },
            { id: 'double_clicks', name: '2x Clicks', icon: '👆', duration: 60, rarity: 0.2 },
            { id: 'triple_clicks', name: '3x Clicks', icon: '✌️', duration: 45, rarity: 0.1 },
            { id: 'instant_hash', name: '+50 Hash', icon: '⚡', instant: 50, rarity: 0.15 }
        ];
        
        this.onBoostSpawn = null;
        this.onBoostCollect = null;
    }
    
    start() {
        this.scheduleNextBoost();
        this.tick();
    }
    
    stop() {
        if (this.spawnInterval) {
            clearTimeout(this.spawnInterval);
            this.spawnInterval = null;
        }
        this.boostTimers.forEach(t => clearInterval(t));
        this.boostTimers = [];
    }
    
    scheduleNextBoost() {
        const delay = 20000 + Math.random() * 20000; // 20-40 seconds
        this.spawnInterval = setTimeout(() => {
            this.spawnBoost();
            this.scheduleNextBoost();
        }, delay);
    }
    
    spawnBoost() {
        // Select random boost based on rarity
        const boost = this.selectBoostByRarity();
        this.currentBoost = boost;
        
        // Emit event for UI to display
        eventBus.emit('boost:spawn', {
            boost: boost,
            x: Math.random() * 200 - 100, // Random position around core
            y: Math.random() * 200 - 100
        });
        
        if (this.onBoostSpawn) {
            this.onBoostSpawn(boost);
        }
    }
    
    selectBoostByRarity() {
        const total = this.boostTypes.reduce((sum, b) => sum + b.rarity, 0);
        let random = Math.random() * total;
        
        for (const boost of this.boostTypes) {
            random -= boost.rarity;
            if (random <= 0) {
                return { ...boost };
            }
        }
        return { ...this.boostTypes[0] };
    }
    
    collectBoost() {
        if (!this.currentBoost) return null;
        
        const boost = this.currentBoost;
        this.currentBoost = null;
        
        // Apply boost effect
        if (boost.instant) {
            // Instant reward
            const resource = this.getBoostResource(boost.id);
            if (resource && this.gameState.resources[resource]) {
                this.gameState.resources[resource].amount += boost.instant;
                this.gameState.resources[resource].totalEarned += boost.instant;
            }
            eventBus.emit('boost:collected', { boost, collected: true });
        } else {
            // Temporary multiplier
            this.applyTemporaryBoost(boost);
            eventBus.emit('boost:collected', { boost, collected: true });
        }
        
        if (this.onBoostCollect) {
            this.onBoostCollect(boost);
        }
        
        return boost;
    }
    
    getBoostResource(boostId) {
        const resourceMap = {
            'double_crypto': 'crypto',
            'instant_crypto': 'crypto',
            'double_clicks': null,
            'triple_clicks': null,
            'instant_hash': 'hash'
        };
        return resourceMap[boostId] || 'crypto';
    }
    
    applyTemporaryBoost(boost) {
        const timer = {
            boostId: boost.id,
            remaining: boost.duration,
            interval: null
        };
        
        timer.interval = setInterval(() => {
            timer.remaining--;
            if (timer.remaining <= 0) {
                clearInterval(timer.interval);
                this.removeBoost(boost.id);
            }
        }, 1000);
        
        this.boostTimers.push(timer);
        this.activeBoosts.push(boost);
        
        eventBus.emit('boost:active', {
            boosts: this.activeBoosts.map(b => ({
                id: b.id,
                name: b.name,
                icon: b.icon,
                remaining: timer.remaining
            }))
        });
    }
    
    removeBoost(boostId) {
        this.activeBoosts = this.activeBoosts.filter(b => b.id !== boostId);
        eventBus.emit('boost:active', {
            boosts: this.activeBoosts.map(b => ({
                id: b.id,
                name: b.name,
                icon: b.icon
            }))
        });
    }
    
    isBoostActive(boostId) {
        return this.activeBoosts.some(b => b.id === boostId);
    }
    
    getActiveBoosts() {
        return this.activeBoosts;
    }
    
    getBoostMultiplier(boostId) {
        const multipliers = {
            'double_crypto': 2,
            'double_clicks': 2,
            'triple_clicks': 3
        };
        return multipliers[boostId] || 1;
    }
    
    tick() {
        // Called every second to update boost timers
        setTimeout(() => this.tick(), 1000);
    }
}

export default RandomEvents;