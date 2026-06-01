/**
 * GameManager - Orchestrates game state, resources, upgrades, and idle loop
 * Central hub for game logic, communicates with EventBus
 */
import { eventBus } from './EventBus.js';

export class GameManager {
    constructor(configManager, saveManager) {
        this.configManager = configManager;
        this.saveManager = saveManager;

        // Game state
        this.resources = {};
        this.upgrades = {};
        this.tickInterval = null;
        this.isRunning = false;
        this.lastTick = 0;
        this.totalClicks = 0;
        this.totalTimePlayed = 0;

        // Multipliers and modifiers
        this.globalClickMultiplier = 1;
        this.globalRateMultiplier = 1;

        // Auto-clickers tracking
        this.autoClickers = [];

        // Initialize resources from config
        this.initializeResources();
        this.initializeUpgrades();
    }

    /**
     * Initialize resources from configuration
     */
    initializeResources() {
        const resourcesConfig = this.configManager.get('resources');
        if (!resourcesConfig) return;

        resourcesConfig.resources.forEach(resource => {
            this.resources[resource.id] = {
                id: resource.id,
                name: resource.name,
                icon: resource.icon,
                amount: resource.startingAmount || 0,
                baseRate: resource.baseRate || 0,
                rateMultiplier: resource.rateMultiplier || 1,
                clickValue: resource.clickValue || 1,
                maxAmount: resource.maxAmount || null,
                color: resource.color || '#ffffff'
            };
        });
    }

    /**
     * Initialize upgrades from configuration
     */
    initializeUpgrades() {
        const upgradesConfig = this.configManager.get('upgrades');
        if (!upgradesConfig) return;

        upgradesConfig.upgrades.forEach(upgrade => {
            this.upgrades[upgrade.id] = {
                ...upgrade,
                owned: 0,
                unlocked: false
            };
        });
        this.checkUpgradeUnlocks();
    }

    /**
     * Start the game loop
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastTick = Date.now();

        const gameConfig = this.configManager.get('game');
        const tickRate = gameConfig?.tickRate || 1000;

        this.tickInterval = setInterval(() => this.tick(), tickRate);

        eventBus.emit('game:started');
    }

    /**
     * Stop the game loop
     */
    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }

        eventBus.emit('game:stopped');
    }

    /**
     * Main game tick
     */
    tick() {
        const now = Date.now();
        const delta = (now - this.lastTick) / 1000;
        this.lastTick = now;

        this.totalTimePlayed += delta;

        // Generate resources
        this.generateResources(delta);

        // Process auto-clickers
        this.processAutoClickers(delta);

        // Update state
        this.checkUpgradeUnlocks();
        this.emitStateUpdate();
    }

    /**
     * Generate resources based on rates
     * @param {number} delta - Time since last tick in seconds
     */
    generateResources(delta) {
        Object.values(this.resources).forEach(resource => {
            const rate = resource.baseRate * resource.rateMultiplier * this.globalRateMultiplier;
            const generated = rate * delta;

            if (resource.maxAmount) {
                resource.amount = Math.min(resource.amount + generated, resource.maxAmount);
            } else {
                resource.amount += generated;
            }
        });
    }

    /**
     * Process auto-clickers and resource generators
     * @param {number} delta - Time in seconds
     */
    processAutoClickers(delta) {
        this.autoClickers.forEach(autoClicker => {
            if (autoClicker.isGenerator) {
                // Resource generator
                const resource = this.resources[autoClicker.resource];
                if (resource) {
                    resource.amount += autoClicker.value * delta;
                }
            } else {
                // Auto-clicker
                autoClicker.accumulatedTime += delta;

                if (autoClicker.accumulatedTime >= autoClicker.interval / 1000) {
                    autoClicker.accumulatedTime -= autoClicker.interval / 1000;
                    this.triggerClick(autoClicker.value);
                }
            }
        });
    }

    /**
     * Trigger click action on resources
     * @param {number} baseClickValue - Base click value
     */
    triggerClick(baseClickValue) {
        const clickMultiplier = this.globalClickMultiplier;

        Object.values(this.resources).forEach(resource => {
            const clickValue = Math.floor(resource.clickValue * baseClickValue * clickMultiplier);
            if (resource.maxAmount) {
                resource.amount = Math.min(resource.amount + clickValue, resource.maxAmount);
            } else {
                resource.amount += clickValue;
            }
        });

        this.totalClicks++;

        eventBus.emit('game:click', {
            clickValue: baseClickValue * clickMultiplier,
            totalClicks: this.totalClicks
        });
    }

    /**
     * Handle user click on game area
     * @param {Object} data - Click data
     */
    handleClick(data = {}) {
        this.triggerClick(data.value || 1);

        eventBus.emit('game:click', {
            clickValue: data.value || 1,
            totalClicks: this.totalClicks
        });
    }

    /**
     * Check and unlock upgrades based on requirements
     */
    checkUpgradeUnlocks() {
        Object.values(this.upgrades).forEach(upgrade => {
            if (upgrade.unlocked) return;

            if (!upgrade.unlockRequirement) {
                upgrade.unlocked = true;
                eventBus.emit('upgrade:unlocked', upgrade);
                return;
            }

            const { resource, minAmount } = upgrade.unlockRequirement;
            const resourceData = this.resources[resource];

            if (resourceData && resourceData.amount >= minAmount) {
                upgrade.unlocked = true;
                eventBus.emit('upgrade:unlocked', upgrade);
            }
        });
    }

    /**
     * Purchase an upgrade
     * @param {string} upgradeId - Upgrade ID
     * @returns {boolean} Success status
     */
    purchaseUpgrade(upgradeId) {
        const upgrade = this.upgrades[upgradeId];
        if (!upgrade) return false;

        if (!upgrade.unlocked) return false;

        const cost = this.calculateUpgradeCost(upgradeId);
        const costResource = upgrade.cost.resource;
        const resourceData = this.resources[costResource];

        if (!resourceData || resourceData.amount < cost) return false;

        // Deduct cost
        resourceData.amount -= cost;

        // Apply upgrade effect
        this.applyUpgradeEffect(upgrade);

        // Increment owned count
        upgrade.owned++;

        eventBus.emit('upgrade:purchased', {
            upgradeId,
            cost,
            owned: upgrade.owned
        });

        this.emitStateUpdate();
        return true;
    }

    /**
     * Calculate current cost of an upgrade
     * @param {string} upgradeId - Upgrade ID
     * @returns {number} Current cost
     */
    calculateUpgradeCost(upgradeId) {
        const upgrade = this.upgrades[upgradeId];
        if (!upgrade) return Infinity;

        const { base, scaling, owned } = upgrade.cost;
        return Math.floor(base * Math.pow(scaling, owned));
    }

    /**
     * Apply upgrade effect
     * @param {Object} upgrade - Upgrade object
     */
    applyUpgradeEffect(upgrade) {
        const effect = upgrade.effect;

        switch (effect.type) {
            case 'click':
                // Add auto-clicker
                this.autoClickers.push({
                    value: effect.value,
                    interval: effect.interval,
                    accumulatedTime: 0
                });
                break;

            case 'click_multiplier':
                this.globalClickMultiplier *= effect.value;
                break;

            case 'rate_multiplier':
                const resource = this.resources[effect.resource];
                if (resource) {
                    resource.rateMultiplier *= effect.value;
                }
                break;

            case 'generate':
                // Add resource generator
                this.autoClickers.push({
                    resource: effect.resource,
                    value: effect.value,
                    interval: effect.interval,
                    accumulatedTime: 0,
                    isGenerator: true
                });
                break;
        }
    }

    /**
     * Process auto-clickers and resource generators
     * @param {number} delta - Time in seconds
     */
    processAutoClickers(delta) {
        this.autoClickers.forEach(autoClicker => {
            if (autoClicker.isGenerator) {
                // Resource generator
                const resource = this.resources[autoClicker.resource];
                if (resource) {
                    resource.amount += autoClicker.value * delta;
                }
            } else {
                // Auto-clicker
                autoClicker.accumulatedTime += delta;

                if (autoClicker.accumulatedTime >= autoClicker.interval / 1000) {
                    autoClicker.accumulatedTime -= autoClicker.interval / 1000;
                    this.triggerClick(autoClicker.value);
                }
            }
        });
    }

    /**
     * Get current game state
     * @returns {Object} Game state
     */
    getState() {
        return {
            resources: JSON.parse(JSON.stringify(this.resources)),
            upgrades: Object.fromEntries(
                Object.entries(this.upgrades).map(([id, u]) => [id, { owned: u.owned }])
            ),
            globalClickMultiplier: this.globalClickMultiplier,
            globalRateMultiplier: this.globalRateMultiplier,
            totalClicks: this.totalClicks,
            totalTimePlayed: this.totalTimePlayed
        };
    }

    /**
     * Get resources state
     * @returns {Object} Resources state
     */
    getResources() {
        return JSON.parse(JSON.stringify(this.resources));
    }

    /**
     * Get upgrades state
     * @returns {Object} Upgrades state with calculated costs
     */
    getUpgrades() {
        const upgradesWithCosts = {};
        Object.entries(this.upgrades).forEach(([id, upgrade]) => {
            upgradesWithCosts[id] = {
                ...upgrade,
                currentCost: this.calculateUpgradeCost(id),
                canAfford: this.canAffordUpgrade(id),
                maxOwnedReached: upgrade.owned >= upgrade.maxOwned
            };
        });
        return upgradesWithCosts;
    }

    /**
     * Check if player can afford an upgrade
     * @param {string} upgradeId - Upgrade ID
     * @returns {boolean}
     */
    canAffordUpgrade(upgradeId) {
        const upgrade = this.upgrades[upgradeId];
        if (!upgrade) return false;

        const cost = this.calculateUpgradeCost(upgradeId);
        const resource = this.resources[upgrade.cost.resource];

        return resource && resource.amount >= cost;
    }

    /**
     * Save game state
     */
    save() {
        const state = this.getState();
        this.saveManager.save(state);
        eventBus.emit('game:saved', state);
    }

    /**
     * Restore game state
     * @param {Object} state - Saved state
     */
    restoreState(state) {
        if (!state) return;

        // Restore resources
        if (state.resources) {
            Object.entries(state.resources).forEach(([id, data]) => {
                if (this.resources[id]) {
                    this.resources[id].amount = data.amount || 0;
                    if (data.rateMultiplier) {
                        this.resources[id].rateMultiplier = data.rateMultiplier;
                    }
                }
            });
        }

        // Restore upgrades
        if (state.upgrades) {
            Object.entries(state.upgrades).forEach(([id, data]) => {
                if (this.upgrades[id] && data.owned) {
                    // Re-apply upgrade effects based on owned count
                    for (let i = 0; i < data.owned; i++) {
                        this.upgrades[id].owned = i;
                        this.applyUpgradeEffect(this.upgrades[id]);
                    }
                    this.upgrades[id].owned = data.owned;
                }
            });
        }

        // Restore multipliers
        if (state.globalClickMultiplier) {
            this.globalClickMultiplier = state.globalClickMultiplier;
        }
        if (state.globalRateMultiplier) {
            this.globalRateMultiplier = state.globalRateMultiplier;
        }

        // Restore stats
        if (state.totalClicks) {
            this.totalClicks = state.totalClicks;
        }
        if (state.totalTimePlayed) {
            this.totalTimePlayed = state.totalTimePlayed;
        }

        // Calculate offline progress
        this.calculateOfflineProgress();

        this.emitStateUpdate();
        eventBus.emit('game:restored', state);
    }

    /**
     * Calculate offline progress
     */
    calculateOfflineProgress() {
        const saveInfo = this.saveManager.getSaveInfo();
        if (!saveInfo) return;

        const offlineTime = (Date.now() - saveInfo.timestamp) / 1000;
        const gameConfig = this.configManager.get('game');
        const maxOffline = gameConfig?.maxOfflineTime || 86400;
        const cappedTime = Math.min(offlineTime, maxOffline);

        if (cappedTime > 60) {
            // Apply offline generation
            this.generateResources(cappedTime);
            eventBus.emit('game:offline_progress', {
                time: cappedTime,
                resources: this.getResources()
            });
        }
    }

    /**
     * Emit state update to UI
     */
    emitStateUpdate() {
        eventBus.emit('game:state_update', {
            resources: this.getResources(),
            upgrades: this.getUpgrades(),
            stats: {
                totalClicks: this.totalClicks,
                totalTimePlayed: this.totalTimePlayed
            }
        });
    }
}

export default GameManager;