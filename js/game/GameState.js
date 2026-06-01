/**
 * GameState - Manages game resources, upgrades, and progression
 * Pure DOM game - no Phaser, no Canvas
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
        this.achievements = {};
        this.stats = {
            totalClicks: 0,
            totalTimePlayed: 0,
            startTime: Date.now(),
            prestigeLevel: 0
        };
        
        // Prestige
        this.prestigeConfig = null;
        
        // Rates (per second)
        this.rates = {
            crypto: 0,
            compute: 0,
            storage: 0,
            credits: 0
        };
        
        // Click power (5% of total auto-generated primary currency)
        this.clickPower = 0;
        
        // Configuration
        this.gameConfig = null;
        this.clickPowerPercent = 5;
    }

    async init() {
        // Load configuration
        if (!this.configManager.has('resources')) {
            await this.configManager.loadAll();
        }
        
        this.gameConfig = this.configManager.get('game');
        this.prestigeConfig = this.configManager.get('prestige');
        this.clickPowerPercent = this.gameConfig?.clickPowerPercent || 5;
        
        // Initialize resources from config
        const resourcesConfig = this.configManager.get('resources');
        const resourcesList = Array.isArray(resourcesConfig) ? resourcesConfig : resourcesConfig.resources || [];
        
        for (const config of resourcesList) {
            if (!config || !config.id) continue;
            
            const id = config.id;
            this.resources[id] = {
                id: id,
                name: config.name || id,
                icon: config.icon?.substring(0, 3).toUpperCase() || id.substring(0, 3).toUpperCase(),
                color: config.color || '#00ffcc',
                amount: config.startingAmount || 0,
                totalEarned: 0,
                perClick: config.clickValue || 0,
                perSec: config.baseRate || 0
            };
        }
        
        // Initialize upgrades from config
        const upgradesConfig = this.configManager.get('upgrades');
        const upgradesList = Array.isArray(upgradesConfig) ? upgradesConfig : upgradesConfig.upgrades || [];
        for (const config of upgradesList) {
            if (!config || !config.id) continue;
            
            const baseCost = config.cost?.base ?? config.baseCost ?? 100;
            const costMultiplier = config.cost?.scaling ?? config.costMultiplier ?? 1.15;
            const owned = config.cost?.owned ?? config.owned ?? 0;
            
            // Parse effect to get rate
            let effect = {};
            if (config.effect) {
                if (config.effect.type === 'rate_multiplier' && config.effect.resource) {
                    effect[config.effect.resource] = config.effect.value;
                } else if (config.effect.value) {
                    effect[config.effect.resource || 'crypto'] = config.effect.value;
                }
            }
            
            this.upgrades[config.id] = {
                id: config.id,
                name: config.name || config.id,
                description: config.description || '',
                category: config.category || 'systems',
                icon: config.icon || '📦',
                baseCost: baseCost,
                costCurrency: config.cost?.resource || 'crypto',
                costMultiplier: costMultiplier,
                maxOwned: config.maxOwned || 10,
                effect: effect,
                owned: owned,
                currentCost: Math.floor(baseCost * Math.pow(costMultiplier, owned)),
                canAfford: false,
                maxOwnedReached: owned >= (config.maxOwned || 10),
                unlocked: true
            };
        }
        
        // Initialize achievements from config
        const achievementsConfig = this.configManager.get('achievements');
        const achievementsList = Array.isArray(achievementsConfig) ? achievementsConfig : [];
        for (const config of achievementsList) {
            if (!config || !config.id) continue;
            
            this.achievements[config.id] = {
                id: config.id,
                name: config.name || config.id,
                description: config.description || '',
                icon: config.icon || '🏆',
                condition: config.condition || { type: 'clicks', value: 1 },
                reward: config.reward || {},
                unlocked: false,
                progress: 0
            };
        }
        
        // Try to restore saved state
        const savedState = this.saveManager.load();
        if (savedState) {
            this.restoreState(savedState);
        }
        
        // Calculate initial rates
        this.calculateRates();
        
        return this;
    }

    calculateRates() {
        // Reset rates
        this.rates = {
            crypto: 0,
            compute: 0,
            storage: 0,
            credits: 0
        };
        
        // Add rates from upgrades
        for (const upgrade of Object.values(this.upgrades)) {
            if (upgrade.owned > 0 && upgrade.effect) {
                for (const [resourceId, rate] of Object.entries(upgrade.effect)) {
                    if (this.rates[resourceId] !== undefined) {
                        this.rates[resourceId] += rate * upgrade.owned;
                    }
                }
            }
        }
        
        // Add base perSec from resources
        for (const [id, resource] of Object.entries(this.resources)) {
            if (resource.perSec > 0) {
                this.rates[id] = (this.rates[id] || 0) + resource.perSec;
            }
        }
        
        // Apply prestige multiplier
        if (this.stats.prestigeLevel > 0 && this.prestigeConfig) {
            const multiplier = 1 + (this.stats.prestigeLevel * (this.prestigeConfig.multiplierPerLevel || 1.5 - 1));
            for (const id of Object.keys(this.rates)) {
                this.rates[id] *= multiplier;
            }
        }
        
        // Calculate click power (5% of total auto-generated primary currency)
        const totalAutoGenerated = this.rates.crypto || 0;
        this.clickPower = Math.max(1, totalAutoGenerated * (this.clickPowerPercent / 100));
        
        // Update upgrade affordability
        this.updateUpgradeStates();
        
        // Emit state update
        eventBus.emit('game:state_update', {
            resources: this.resources,
            upgrades: this.upgrades,
            achievements: this.achievements,
            stats: this.stats,
            rates: this.rates,
            clickPower: this.clickPower
        });
    }

    updateUpgradeStates() {
        for (const upgrade of Object.values(this.upgrades)) {
            const cost = this.getUpgradeCost(upgrade);
            upgrade.currentCost = cost;
            upgrade.canAfford = (this.resources[upgrade.costCurrency]?.amount || 0) >= cost;
            upgrade.maxOwnedReached = upgrade.owned >= upgrade.maxOwned;
        }
    }

    getUpgradeCost(upgrade) {
        return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));
    }

    handleClick() {
        // Add crypto for click
        const reward = Math.floor(this.clickPower);
        this.resources.crypto.amount += reward;
        this.resources.crypto.totalEarned += reward;
        this.stats.totalClicks++;
        
        // Emit click event
        eventBus.emit('game:click', { reward, x: 400, y: 300 });
        
        // Check achievements
        this.checkAchievements();
        
        return reward;
    }

    purchaseUpgrade(upgradeId) {
        const upgrade = this.upgrades[upgradeId];
        if (!upgrade) return false;
        
        const cost = this.getUpgradeCost(upgrade);
        const currency = upgrade.costCurrency;
        
        if ((this.resources[currency]?.amount || 0) < cost) return false;
        if (upgrade.maxOwnedReached) return false;
        
        // Deduct cost
        this.resources[currency].amount -= cost;
        upgrade.owned++;
        
        // Recalculate rates
        this.calculateRates();
        
        // Emit purchase event
        eventBus.emit('upgrade:purchased', { upgradeId, owned: upgrade.owned });
        
        return true;
    }

    tick(deltaTime) {
        const now = Date.now();
        
        // Update time played
        this.stats.totalTimePlayed = Math.floor((now - this.stats.startTime) / 1000);
        
        // Apply passive income
        for (const [id, rate] of Object.entries(this.rates)) {
            if (this.resources[id] && rate > 0) {
                const earned = rate * (deltaTime / 1000);
                this.resources[id].amount += earned;
                this.resources[id].totalEarned += earned;
            }
        }
        
        // Check achievements periodically
        this.checkAchievements();
        
        // Emit state update (throttled)
        this.emitStateUpdate();
    }

    checkAchievements() {
        for (const achievement of Object.values(this.achievements)) {
            if (achievement.unlocked) continue;
            
            let progress = 0;
            let target = achievement.condition.value || 1;
            
            switch (achievement.condition.type) {
                case 'clicks':
                    progress = this.stats.totalClicks;
                    break;
                case 'crypto':
                    progress = this.resources.crypto?.totalEarned || 0;
                    break;
                case 'upgrades':
                    progress = Object.values(this.upgrades).reduce((sum, u) => sum + u.owned, 0);
                    break;
                case 'time':
                    progress = this.stats.totalTimePlayed;
                    break;
            }
            
            achievement.progress = progress;
            
            if (progress >= target) {
                achievement.unlocked = true;
                
                // Apply reward
                if (achievement.reward) {
                    for (const [resourceId, amount] of Object.entries(achievement.reward)) {
                        if (this.resources[resourceId]) {
                            this.resources[resourceId].amount += amount;
                            this.resources[resourceId].totalEarned += amount;
                        }
                    }
                }
                
                eventBus.emit('achievement:unlocked', achievement);
            }
        }
    }

    performPrestige() {
        if (!this.prestigeConfig) return false;
        
        const totalClicks = this.stats.totalClicks;
        if (totalClicks < (this.prestigeConfig.minClicks || 1000)) return false;
        
        // Calculate prestige level gain
        const levelGain = Math.floor(totalClicks / (this.prestigeConfig.minClicks || 1000));
        this.stats.prestigeLevel += levelGain;
        
        // Reset progress as specified
        const resetOnPrestige = this.prestigeConfig.resetOnPrestige || [];
        
        if (resetOnPrestige.includes('upgrades')) {
            for (const upgrade of Object.values(this.upgrades)) {
                upgrade.owned = 0;
                upgrade.currentCost = upgrade.baseCost;
            }
        }
        
        if (resetOnPrestige.includes('clicks')) {
            this.stats.totalClicks = 0;
        }
        
        // Keep resources but apply prestige bonus
        // (Resources are not reset per the spec)
        
        // Recalculate
        this.calculateRates();
        
        eventBus.emit('prestige:performed', { levelGain, newLevel: this.stats.prestigeLevel });
        
        return true;
    }

    canPrestige() {
        if (!this.prestigeConfig || !this.prestigeConfig.enabled) return false;
        return this.stats.totalClicks >= (this.prestigeConfig.minClicks || 1000);
    }

    save() {
        const state = {
            resources: this.resources,
            upgrades: this.upgrades,
            achievements: this.achievements,
            stats: {
                ...this.stats,
                savedAt: Date.now()
            }
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
        if (savedState.achievements) {
            Object.assign(this.achievements, savedState.achievements);
        }
        if (savedState.stats) {
            Object.assign(this.stats, {
                totalClicks: savedState.stats.totalClicks || 0,
                totalTimePlayed: savedState.stats.totalTimePlayed || 0,
                startTime: savedState.stats.startTime || Date.now(),
                prestigeLevel: savedState.stats.prestigeLevel || 0
            });
        }
        
        // Calculate offline progress
        if (savedState.stats?.savedAt) {
            const offlineMs = Date.now() - savedState.stats.savedAt;
            const offlineSeconds = Math.floor(offlineMs / 1000);
            
            if (offlineSeconds > 60) {
                this.calculateRates();
                
                for (const [id, rate] of Object.entries(this.rates)) {
                    if (rate > 0 && this.resources[id]) {
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
        this.saveManager.clear();
        localStorage.clear();
        location.reload();
    }

    emitStateUpdate() {
        eventBus.emit('game:state_update', {
            resources: this.resources,
            upgrades: this.upgrades,
            achievements: this.achievements,
            stats: this.stats,
            rates: this.rates,
            clickPower: this.clickPower
        });
    }

    getState() {
        return {
            resources: this.resources,
            upgrades: this.upgrades,
            achievements: this.achievements,
            stats: this.stats,
            rates: this.rates,
            clickPower: this.clickPower,
            prestigeLevel: this.stats.prestigeLevel
        };
    }
}

export default GameState;