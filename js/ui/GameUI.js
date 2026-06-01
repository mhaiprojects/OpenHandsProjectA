/**
 * GameState - Reactive game state management
 * Replaces Phaser for game logic
 */
import { eventBus } from '../core/EventBus.js';
import { ConfigManager } from '../core/ConfigManager.js';
import { SaveManager } from '../core/SaveManager.js';

export class GameState {
    constructor(configManager = null, saveManager = null) {
        this.configManager = configManager || new ConfigManager();
        this.saveManager = saveManager || new SaveManager();
        
        // Core game state
        this.resources = {};
        this.upgrades = {};
        this.stats = {
            totalClicks: 0,
            totalTimePlayed: 0,
            startTime: Date.now()
        };
        
        // Upgrade generation rates (computed from owned upgrades)
        this.rates = {
            crypto: 0,
            hash: 0,
            data: 0,
            token: 0
        };
        
        this.gameLoop = null;
        this.lastUpdate = Date.now();
    }

    async init() {
        // Load configuration
        if (!this.configManager.has('resources')) {
            await this.configManager.loadAll();
        }
        
        // Initialize resources from config
        const resourcesConfig = this.configManager.get('resources');
        
        // Handle both array format (resources: []) and object format ({id: {}})
        let resourcesList;
        if (Array.isArray(resourcesConfig)) {
            resourcesList = resourcesConfig;
        } else if (resourcesConfig.resources && Array.isArray(resourcesConfig.resources)) {
            resourcesList = resourcesConfig.resources;
        } else {
            resourcesList = Object.values(resourcesConfig).filter(v => v && v.id);
        }
        
        for (const config of resourcesList) {
            if (!config || !config.id) continue;
            
            this.resources[config.id] = {
                id: config.id,
                name: config.name || config.id,
                color: config.color || '#00ffcc',
                amount: config.startingAmount || 0,
                totalEarned: 0,
                perClick: config.clickValue || 10
            };
        }
        
        // Initialize upgrades from config
        const upgradesConfig = this.configManager.get('upgrades');
        
        // Handle both array format (upgrades: []) and object format ({id: {}})
        let upgradesList;
        if (Array.isArray(upgradesConfig)) {
            upgradesList = upgradesConfig;
        } else if (upgradesConfig.upgrades && Array.isArray(upgradesConfig.upgrades)) {
            upgradesList = upgradesConfig.upgrades;
        } else {
            upgradesList = Object.values(upgradesConfig).filter(v => v && v.id);
        }
        
        for (const config of upgradesList) {
            if (!config || !config.id) continue;
            
            const baseCost = config.cost?.base ?? config.baseCost ?? 100;
            const baseMultiplier = config.cost?.scaling ?? config.costMultiplier ?? 1.15;
            const ownedCount = config.cost?.owned ?? config.owned ?? 0;
            
            this.upgrades[config.id] = {
                id: config.id,
                name: config.name || config.id,
                description: config.description || '',
                icon: config.icon || '📦',
                baseCost: baseCost,
                costMultiplier: baseMultiplier,
                maxOwned: config.maxOwned || 10,
                produces: this.parseUpgradeEffect(config.effect),
                owned: ownedCount,
                currentCost: Math.floor(baseCost * Math.pow(baseMultiplier, ownedCount)),
                canAfford: false,
                maxOwnedReached: false,
                unlocked: !config.unlockRequirement
            };
        }
        
        // Try to restore saved state
        const savedState = this.saveManager.load();
        if (savedState) {
            this.restoreState(savedState);
        }
        
        return this;
    }

    start() {
        this.lastUpdate = Date.now();
        
        // Start game loop
        this.gameLoop = setInterval(() => {
            this.update();
        }, 1000 / 60);
    }

    stop() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }

    update() {
        const now = Date.now();
        const delta = (now - this.lastUpdate) / 1000; // seconds
        this.lastUpdate = now;
        
        // Update time played
        this.stats.totalTimePlayed = Math.floor((now - this.stats.startTime) / 1000);
        
        // Calculate rates from upgrades
        this.calculateRates();
        
        // Apply passive income
        for (const [id, rate] of Object.entries(this.rates)) {
            if (this.resources[id] && rate > 0) {
                const earned = rate * delta;
                this.resources[id].amount += earned;
                this.resources[id].totalEarned += earned;
            }
        }
        
        // Update upgrade affordability
        this.updateUpgradeStates();
        
        // Emit state update event
        eventBus.emit('game:state_update', {
            resources: this.resources,
            upgrades: this.upgrades,
            stats: this.stats,
            rates: this.rates
        });
    }

    calculateRates() {
        // Reset rates
        this.rates = { crypto: 0, hash: 0, data: 0, token: 0 };
        
        // Add rates from upgrades
        for (const upgrade of Object.values(this.upgrades)) {
            if (upgrade.owned > 0 && upgrade.produces) {
                for (const [resourceId, amount] of Object.entries(upgrade.produces)) {
                    if (this.rates[resourceId] !== undefined) {
                        this.rates[resourceId] += amount * upgrade.owned;
                    }
                }
            }
        }
    }

    updateUpgradeStates() {
        for (const upgrade of Object.values(this.upgrades)) {
            const cost = this.getUpgradeCost(upgrade);
            upgrade.currentCost = cost;
            upgrade.canAfford = this.resources.crypto?.amount >= cost;
            upgrade.maxOwnedReached = upgrade.owned >= upgrade.maxOwned;
        }
    }

    handleClick(x, y) {
        // Add crypto for click
        const clickReward = this.resources.crypto?.perClick || 1;
        this.resources.crypto.amount += clickReward;
        this.resources.crypto.totalEarned += clickReward;
        this.stats.totalClicks++;
        
        // Emit click event
        eventBus.emit('main_game:click', { x, y, reward: clickReward });
        
        return clickReward;
    }

    purchaseUpgrade(upgradeId) {
        const upgrade = this.upgrades[upgradeId];
        if (!upgrade) return false;
        
        const cost = this.getUpgradeCost(upgrade);
        if (this.resources.crypto.amount < cost) return false;
        if (upgrade.maxOwnedReached) return false;
        
        // Deduct cost
        this.resources.crypto.amount -= cost;
        upgrade.owned++;
        
        // Recalculate rates
        this.calculateRates();
        
        // Emit purchase event
        eventBus.emit('upgrade:purchased', { upgradeId, owned: upgrade.owned });
        
        return true;
    }

    getUpgradeCost(upgrade) {
        return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier || 1.15, upgrade.owned));
    }

    parseUpgradeEffect(effect) {
        if (!effect) return null;
        if (effect.type === 'generate') {
            return { [effect.resource]: effect.value };
        }
        return null;
    }

    getState() {
        return {
            resources: this.resources,
            upgrades: this.upgrades,
            stats: this.stats,
            rates: this.rates
        };
    }

    getResources() {
        return this.resources;
    }

    getUpgrades() {
        return this.upgrades;
    }

    getRates() {
        return this.rates;
    }

    getGameConfig() {
        return this.configManager?.get('game') || {};
    }

    save() {
        const state = {
            resources: this.resources,
            upgrades: this.upgrades,
            stats: this.stats,
            savedAt: Date.now()
        };
        this.saveManager.save(state);
        eventBus.emit('game:saved', {});
    }

    restoreState(savedState) {
        if (savedState.resources) {
            Object.assign(this.resources, savedState.resources);
        }
        if (savedState.upgrades) {
            Object.assign(this.upgrades, savedState.upgrades);
        }
        if (savedState.stats) {
            Object.assign(this.stats, savedState.stats);
        }
        
        // Calculate offline progress
        if (savedState.savedAt) {
            const offlineSeconds = Math.floor((Date.now() - savedState.savedAt) / 1000);
            if (offlineSeconds > 10) {
                this.calculateRates();
                for (const [id, rate] of Object.entries(this.rates)) {
                    if (rate > 0) {
                        const earned = rate * offlineSeconds;
                        this.resources[id].amount += earned;
                        this.resources[id].totalEarned += earned;
                    }
                }
                eventBus.emit('game:offline_progress', { seconds: offlineSeconds });
            }
        }
        
        this.calculateRates();
    }

    reset() {
        this.stop();
        localStorage.clear();
        location.reload();
    }
}

// Export singleton
export const gameState = new GameState();