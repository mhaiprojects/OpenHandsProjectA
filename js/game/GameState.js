/**
 * GameState - Central state management for the game
 * Handles all game data, calculations, and mutations
 */
import { EventBus, GameEvents } from '../core/EventBus.js';
import { configManager } from '../core/ConfigManager.js';

class GameState {
  constructor() {
    this.eventBus = new EventBus();
    this.config = configManager;
    this.tickRate = 100; // 10 updates per second
    this.lastTick = 0;
    this.lastPlayed = Date.now();
    
    // Initialize state
    this.state = this.getDefaultState();
    this.multipliers = this.getDefaultMultipliers();
  }

  /**
   * Get default state structure
   * @returns {Object} Default game state
   */
  getDefaultState() {
    const resources = this.config.getAllResources();
    const generators = this.config.getAllGenerators();
    const characters = this.config.getAllCharacters();
    const upgrades = this.config.getAllUpgrades();
    const items = this.config.getAllItems();

    return {
      resources: resources.reduce((acc, r) => {
        acc[r.codeName] = {
          quantity: r.baseValue || 0,
          totalEarned: 0,
          totalSpent: 0
        };
        return acc;
      }, {}),

      generators: generators.reduce((acc, g) => {
        acc[g.codeName] = {
          quantityPurchased: 0,
          totalSpend: 0,
          totalEarned: 0
        };
        return acc;
      }, {}),

      characters: characters.reduce((acc, c) => {
        acc[c.codeName] = {
          unlocked: c.unlockRequirement === null,
          activated: false,
          experience: 0,
          level: 1,
          equipment: {
            weapon: null,
            armor: null,
            accessory: null,
            artifact: null
          }
        };
        return acc;
      }, {}),

      upgrades: upgrades.reduce((acc, u) => {
        acc[u.codeName] = {
          purchased: false,
          purchaseCount: 0
        };
        return acc;
      }, {}),

      inventory: items.reduce((acc, i) => {
        acc[i.codeName] = 0;
        return acc;
      }, {}),

      achievements: {},
      
      prestige: {
        tier1: {
          points: 0,
          bonuses: {},
          timesPerformed: 0
        },
        tier2: {
          points: 0,
          timesPerformed: 0
        },
        tier3: {
          points: 0,
          timesPerformed: 0
        }
      },

      statistics: {
        totalClicks: 0,
        totalPlayTime: 0,
        highestPPS: 0,
        highestResource: {},
        generatorsOwned: 0,
        itemsCollected: 0,
        achievementsUnlocked: 0
      },

      activeEvents: [],
      temporaryBoosts: [],

      // Game settings
      settings: {
        soundEnabled: true,
        notificationsEnabled: true,
        showTutorial: true
      }
    };
  }

  /**
   * Get default multipliers
   * @returns {Object} Default multipliers
   */
  getDefaultMultipliers() {
    return {
      global: 1.0,
      click: 1.0,
      resource: 1.0,
      generator: {},
      category: {},
      upgrade: {},
      character: {},
      prestige: 1.0,
      offline: 1.0
    };
  }

  /**
   * Initialize the game state
   * @param {Object} savedState - Optional saved state to load
   */
  init(savedState = null) {
    if (savedState) {
      this.state = this.mergeState(this.getDefaultState(), savedState);
    }
    
    this.calculateAllMultipliers();
    this.checkUnlocks();
  }

  /**
   * Merge saved state with defaults
   * @param {Object} defaults - Default state
   * @param {Object} saved - Saved state
   * @returns {Object} Merged state
   */
  mergeState(defaults, saved) {
    const merged = JSON.parse(JSON.stringify(defaults));
    
    // Deep merge resources
    for (const key in saved.resources || {}) {
      if (merged.resources[key]) {
        merged.resources[key] = { ...merged.resources[key], ...saved.resources[key] };
      }
    }
    
    // Deep merge generators
    for (const key in saved.generators || {}) {
      if (merged.generators[key]) {
        merged.generators[key] = { ...merged.generators[key], ...saved.generators[key] };
      }
    }
    
    // Deep merge characters
    for (const key in saved.characters || {}) {
      if (merged.characters[key]) {
        merged.characters[key] = { ...merged.characters[key], ...saved.characters[key] };
      }
    }
    
    // Deep merge upgrades
    for (const key in saved.upgrades || {}) {
      if (merged.upgrades[key]) {
        merged.upgrades[key] = { ...merged.upgrades[key], ...saved.upgrades[key] };
      }
    }
    
    // Deep merge inventory
    for (const key in saved.inventory || {}) {
      if (merged.inventory[key] !== undefined) {
        merged.inventory[key] = saved.inventory[key];
      }
    }
    
    // Merge prestige
    if (saved.prestige) {
      merged.prestige = saved.prestige;
    }
    
    // Merge statistics
    if (saved.statistics) {
      merged.statistics = { ...defaults.statistics, ...saved.statistics };
    }
    
    // Merge settings
    if (saved.settings) {
      merged.settings = { ...defaults.settings, ...saved.settings };
    }
    
    return merged;
  }

  /**
   * Calculate all multipliers
   */
  calculateAllMultipliers() {
    this.multipliers = this.getDefaultMultipliers();
    
    // Apply prestige bonuses
    this.applyPrestigeMultipliers();
    
    // Apply character bonuses
    this.applyCharacterMultipliers();
    
    // Apply upgrade bonuses
    this.applyUpgradeMultipliers();
    
    // Apply equipment bonuses
    this.applyEquipmentMultipliers();
    
    // Apply active event boosts
    this.applyActiveBoosts();
  }

  /**
   * Apply prestige multipliers
   */
  applyPrestigeMultipliers() {
    const prestigeData = this.state.prestige;
    
    // Tier 1 bonuses
    if (prestigeData.tier1?.bonuses) {
      if (prestigeData.tier1.bonuses.generatorEfficiency) {
        const level = prestigeData.tier1.bonuses.generatorEfficiency;
        this.multipliers.generator = (this.multipliers.generator || {});
        this.multipliers.prestige = 1 + (level * 0.1);
      }
      if (prestigeData.tier1.bonuses.clickPower) {
        const level = prestigeData.tier1.bonuses.clickPower;
        this.multipliers.click = 1 + (level * 0.25);
      }
      if (prestigeData.tier1.bonuses.costReduction) {
        // Cost reduction handled in cost calculation
      }
      if (prestigeData.tier1.bonuses.globalBoost) {
        const level = prestigeData.tier1.bonuses.globalBoost;
        this.multipliers.global *= (1 + (level * 0.05));
      }
    }
  }

  /**
   * Apply character multipliers
   */
  applyCharacterMultipliers() {
    const characters = this.config.getAllCharacters();
    
    for (const char of characters) {
      if (this.state.characters[char.codeName]?.activated) {
        const charState = this.state.characters[char.codeName];
        const stats = char.baseStats;
        
        // Apply character stat bonuses
        this.multipliers.resource *= (stats.resourceGain || 1);
        this.multipliers.global *= (stats.generatorEfficiency || 1);
        
        // Apply level bonus
        const levelBonus = 1 + ((charState.level - 1) * 0.05);
        this.multipliers.resource *= levelBonus;
        this.multipliers.global *= levelBonus;
      }
    }
  }

  /**
   * Apply upgrade multipliers
   */
  applyUpgradeMultipliers() {
    const upgrades = this.config.getAllUpgrades();
    
    for (const upgrade of upgrades) {
      const state = this.state.upgrades[upgrade.codeName];
      if (state?.purchased || state?.purchaseCount > 0) {
        const effect = upgrade.effect;
        
        switch (effect.type) {
          case 'globalMultiplier':
            this.multipliers.global *= effect.multiplier;
            break;
          case 'clickMultiplier':
            this.multipliers.click *= effect.multiplier;
            break;
          case 'resourceMultiplier':
            this.multipliers.resource *= effect.multiplier;
            break;
          case 'generatorMultiplier':
            this.multipliers.generator[upgrade.codeName] = 
              (this.multipliers.generator[upgrade.codeName] || 1) * effect.multiplier;
            break;
          case 'categoryMultiplier':
            this.multipliers.category[effect.category] = 
              (this.multipliers.category[effect.category] || 1) * effect.multiplier;
            break;
        }
      }
    }
  }

  /**
   * Apply equipment multipliers
   */
  applyEquipmentMultipliers() {
    const characters = this.config.getAllCharacters();
    
    for (const char of characters) {
      const charState = this.state.characters[char.codeName];
      if (charState?.activated) {
        const equipment = charState.equipment;
        
        for (const slot in equipment) {
          const itemCode = equipment[slot];
          if (itemCode) {
            const item = this.config.getItem(itemCode);
            if (item?.stats) {
              // Apply item stats
              if (item.stats.resourceGain) {
                this.multipliers.resource *= item.stats.resourceGain;
              }
              if (item.stats.generatorEfficiency) {
                this.multipliers.global *= item.stats.generatorEfficiency;
              }
              if (item.stats.dropRate) {
                this.multipliers.dropRate = (this.multipliers.dropRate || 1) * item.stats.dropRate;
              }
              if (item.stats.costReduction) {
                // Handled in cost calculation
              }
            }
          }
        }
      }
    }
  }

  /**
   * Apply active boosts
   */
  applyActiveBoosts() {
    const now = Date.now();
    
    // Apply temporary boosts
    for (const boost of this.state.temporaryBoosts) {
      if (boost.endTime > now) {
        const remaining = (boost.endTime - now) / 1000;
        if (boost.type === 'globalMultiplier') {
          this.multipliers.global *= boost.multiplier;
        } else if (boost.type === 'clickMultiplier') {
          this.multipliers.click *= boost.multiplier;
        } else if (boost.type === 'resourceMultiplier') {
          this.multipliers.resource *= boost.multiplier;
        }
      }
    }
    
    // Apply active events
    for (const event of this.state.activeEvents) {
      if (event.effects) {
        for (const effect of event.effects) {
          if (effect.type === 'globalMultiplier') {
            this.multipliers.global *= effect.multiplier;
          } else if (effect.type === 'resourceMultiplier') {
            this.multipliers.resource *= effect.multiplier;
          }
        }
      }
    }
  }

  /**
   * Check and update unlocks
   */
  checkUnlocks() {
    // Check generator unlocks
    const generators = this.config.getAllGenerators();
    for (const gen of generators) {
      if (gen.unlockRequirement) {
        const req = gen.unlockRequirement;
        if (this.state.generators[req.generator]?.quantityPurchased >= req.quantity) {
          // Generator unlocked - no explicit unlock state needed
        }
      }
    }
    
    // Check character unlocks
    const characters = this.config.getAllCharacters();
    for (const char of characters) {
      if (char.unlockRequirement) {
        const req = char.unlockRequirement;
        if (this.state.generators[req.generator]?.quantityPurchased >= req.quantity) {
          this.state.characters[char.codeName].unlocked = true;
        }
      }
    }
    
    // Check upgrade unlocks
    const upgrades = this.config.getAllUpgrades();
    for (const upgrade of upgrades) {
      if (upgrade.unlockRequirement) {
        const req = upgrade.unlockRequirement;
        // Upgrade unlocked check - handled in UI
      }
    }
  }

  /**
   * Is generator unlocked
   * @param {string} codeName - Generator codeName
   * @returns {boolean}
   */
  isGeneratorUnlocked(codeName) {
    const gen = this.config.getGenerator(codeName);
    if (!gen || !gen.unlockRequirement) return true;
    
    const req = gen.unlockRequirement;
    return this.state.generators[req.generator]?.quantityPurchased >= req.quantity;
  }

  /**
   * Is upgrade unlocked
   * @param {string} codeName - Upgrade codeName
   * @returns {boolean}
   */
  isUpgradeUnlocked(codeName) {
    const upgrade = this.config.getUpgrade(codeName);
    if (!upgrade || !upgrade.unlockRequirement) return true;
    
    const req = upgrade.unlockRequirement;
    return this.state.generators[req.generator]?.quantityPurchased >= req.quantity;
  }

  /**
   * Is character unlocked
   * @param {string} codeName - Character codeName
   * @returns {boolean}
   */
  isCharacterUnlocked(codeName) {
    return this.state.characters[codeName]?.unlocked || false;
  }

  /**
   * Calculate PPS (Production Per Second)
   * @param {string} resourceCode - Optional specific resource
   * @returns {number} Total PPS or resource-specific PPS
   */
  calculatePPS(resourceCode = null) {
    let totalPPS = 0;
    const generators = this.config.getAllGenerators();
    
    for (const gen of generators) {
      if (!this.isGeneratorUnlocked(gen.codeName)) continue;
      
      const genState = this.state.generators[gen.codeName];
      const quantity = genState.quantityPurchased;
      
      if (quantity <= 0) continue;
      
      // Calculate base PPS
      let pps = gen.basePPS * quantity;
      
      // Apply category multiplier
      if (this.multipliers.category[gen.category]) {
        pps *= this.multipliers.category[gen.category];
      }
      
      // Apply generator-specific multiplier
      if (this.multipliers.generator[gen.codeName]) {
        pps *= this.multipliers.generator[gen.codeName];
      }
      
      // Apply global multiplier
      pps *= this.multipliers.global;
      
      // Calculate resource outputs
      for (const output of gen.produces || []) {
        const amount = output.amount * quantity * this.multipliers.resource;
        
        if (resourceCode && output.resource === resourceCode) {
          totalPPS += amount;
        } else if (!resourceCode) {
          // Track per-resource
          if (!this.state.resources[output.resource]) {
            this.state.resources[output.resource] = { quantity: 0, totalEarned: 0, totalSpent: 0 };
          }
        }
      }
      
      // Total PPS based on primary resource
      totalPPS += pps;
    }
    
    return totalPPS * this.multipliers.prestige;
  }

  /**
   * Get PPS breakdown
   * @returns {Object} PPS breakdown by generator
   */
  getPPSBreakdown() {
    const breakdown = {};
    const generators = this.config.getAllGenerators();
    
    for (const gen of generators) {
      if (!this.isGeneratorUnlocked(gen.codeName)) continue;
      
      const genState = this.state.generators[gen.codeName];
      const quantity = genState.quantityPurchased;
      
      if (quantity <= 0) continue;
      
      let pps = gen.basePPS * quantity;
      
      if (this.multipliers.category[gen.category]) {
        pps *= this.multipliers.category[gen.category];
      }
      if (this.multipliers.generator[gen.codeName]) {
        pps *= this.multipliers.generator[gen.codeName];
      }
      pps *= this.multipliers.global;
      pps *= this.multipliers.prestige;
      
      breakdown[gen.codeName] = {
        displayName: gen.displayName,
        quantity,
        pps,
        percentage: 0 // Calculated later
      };
    }
    
    // Calculate percentages
    const total = Object.values(breakdown).reduce((sum, g) => sum + g.pps, 0);
    for (const key in breakdown) {
      breakdown[key].percentage = total > 0 ? (breakdown[key].pps / total) * 100 : 0;
    }
    
    return breakdown;
  }

  /**
   * Get generator cost
   * @param {string} codeName - Generator codeName
   * @returns {Object} Cost in resources
   */
  getGeneratorCost(codeName) {
    const gen = this.config.getGenerator(codeName);
    if (!gen) return {};
    
    const quantity = this.state.generators[codeName]?.quantityPurchased || 0;
    
    // Cost formula: baseCost * (costMultiplier ^ quantity)
    const costMultiplier = Math.pow(gen.costMultiplier, quantity);
    
    // Apply prestige cost reduction
    let prestigeReduction = 1;
    if (this.state.prestige.tier1?.bonuses?.costReduction) {
      const level = this.state.prestige.tier1.bonuses.costReduction;
      prestigeReduction = Math.pow(0.95, level);
    }
    
    // Apply upgrade cost reduction
    let upgradeReduction = 1;
    const upgrades = this.config.getAllUpgrades();
    for (const upgrade of upgrades) {
      if (upgrade.effect.type === 'costReduction' && this.state.upgrades[upgrade.codeName]?.purchased) {
        upgradeReduction *= upgrade.effect.multiplier;
      }
    }
    
    const finalMultiplier = costMultiplier * prestigeReduction * upgradeReduction;
    
    const costs = {};
    for (const costRes of gen.costResources || []) {
      costs[costRes.resource] = gen.baseCost * costRes.multiplier * finalMultiplier;
    }
    
    return costs;
  }

  /**
   * Can afford generator
   * @param {string} codeName - Generator codeName
   * @returns {boolean}
   */
  canAffordGenerator(codeName) {
    const costs = this.getGeneratorCost(codeName);
    
    for (const resource in costs) {
      if ((this.state.resources[resource]?.quantity || 0) < costs[resource]) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Purchase generator
   * @param {string} codeName - Generator codeName
   * @returns {boolean} Success
   */
  purchaseGenerator(codeName) {
    if (!this.isGeneratorUnlocked(codeName)) return false;
    if (!this.canAffordGenerator(codeName)) return false;
    
    const costs = this.getGeneratorCost(codeName);
    
    // Deduct costs
    for (const resource in costs) {
      this.state.resources[resource].quantity -= costs[resource];
      this.state.resources[resource].totalSpent += costs[resource];
    }
    
    // Add generator
    this.state.generators[codeName].quantityPurchased++;
    this.state.generators[codeName].totalSpend += Object.values(costs).reduce((a, b) => a + b, 0);
    
    // Update statistics
    this.state.statistics.generatorsOwned++;
    
    // Emit event
    this.eventBus.emit(GameEvents.GENERATOR_PURCHASED, { codeName, quantity: 1 });
    
    // Recalculate multipliers and check unlocks
    this.calculateAllMultipliers();
    this.checkUnlocks();
    
    return true;
  }

  /**
   * Get upgrade cost
   * @param {string} codeName - Upgrade codeName
   * @returns {number} Cost
   */
  getUpgradeCost(codeName) {
    const upgrade = this.config.getUpgrade(codeName);
    if (!upgrade) return Infinity;
    
    const state = this.state.upgrades[codeName];
    const purchaseCount = state?.purchaseCount || 0;
    
    return upgrade.cost * Math.pow(1.5, purchaseCount);
  }

  /**
   * Can afford upgrade
   * @param {string} codeName - Upgrade codeName
   * @returns {boolean}
   */
  canAffordUpgrade(codeName) {
    const upgrade = this.config.getUpgrade(codeName);
    if (!upgrade) return false;
    
    const state = this.state.upgrades[codeName];
    if (state?.purchaseCount >= upgrade.maxPurchases) return false;
    
    return (this.state.resources[upgrade.costResource]?.quantity || 0) >= this.getUpgradeCost(codeName);
  }

  /**
   * Purchase upgrade
   * @param {string} codeName - Upgrade codeName
   * @returns {boolean} Success
   */
  purchaseUpgrade(codeName) {
    if (!this.isUpgradeUnlocked(codeName)) return false;
    if (!this.canAffordUpgrade(codeName)) return false;
    
    const upgrade = this.config.getUpgrade(codeName);
    const cost = this.getUpgradeCost(codeName);
    
    // Deduct cost
    this.state.resources[upgrade.costResource].quantity -= cost;
    this.state.resources[upgrade.costResource].totalSpent += cost;
    
    // Apply upgrade
    this.state.upgrades[codeName].purchaseCount++;
    if (upgrade.maxPurchases === 1) {
      this.state.upgrades[codeName].purchased = true;
    }
    
    // Recalculate multipliers
    this.calculateAllMultipliers();
    
    // Emit event
    this.eventBus.emit(GameEvents.UPGRADE_PURCHASED, { codeName });
    
    return true;
  }

  /**
   * Handle click
   * @returns {number} Resources gained
   */
  handleClick() {
    const baseClick = 1;
    const clickValue = baseClick * this.multipliers.click * this.multipliers.global;
    
    this.state.resources.timeShards.quantity += clickValue;
    this.state.resources.timeShards.totalEarned += clickValue;
    this.state.statistics.totalClicks++;
    
    this.eventBus.emit(GameEvents.CLICK_PERFORMED, { value: clickValue });
    
    return clickValue;
  }

  /**
   * Add resources
   * @param {string} resourceCode - Resource codeName
   * @param {number} amount - Amount to add
   */
  addResource(resourceCode, amount) {
    if (!this.state.resources[resourceCode]) {
      this.state.resources[resourceCode] = { quantity: 0, totalEarned: 0, totalSpent: 0 };
    }
    
    const finalAmount = amount * this.multipliers.resource;
    this.state.resources[resourceCode].quantity += finalAmount;
    this.state.resources[resourceCode].totalEarned += finalAmount;
    
    this.eventBus.emit(GameEvents.RESOURCE_GAINED, { resource: resourceCode, amount: finalAmount });
  }

  /**
   * Process game tick
   * @param {number} deltaTime - Time since last tick in seconds
   */
  processTick(deltaTime) {
    const generators = this.config.getAllGenerators();
    
    for (const gen of generators) {
      if (!this.isGeneratorUnlocked(gen.codeName)) continue;
      
      const genState = this.state.generators[gen.codeName];
      const quantity = genState.quantityPurchased;
      
      if (quantity <= 0) continue;
      
      // Calculate production
      let pps = gen.basePPS * quantity;
      
      // Apply multipliers
      if (this.multipliers.category[gen.category]) {
        pps *= this.multipliers.category[gen.category];
      }
      if (this.multipliers.generator[gen.codeName]) {
        pps *= this.multipliers.generator[gen.codeName];
      }
      pps *= this.multipliers.global;
      pps *= this.multipliers.prestige;
      
      // Add resources
      for (const output of gen.produces || []) {
        const amount = output.amount * pps * deltaTime * this.multipliers.resource;
        this.addResource(output.resource, amount);
      }
    }
    
    // Update statistics
    const currentPPS = this.calculatePPS();
    if (currentPPS > this.state.statistics.highestPPS) {
      this.state.statistics.highestPPS = currentPPS;
    }
    
    // Clean up expired boosts
    const now = Date.now();
    this.state.temporaryBoosts = this.state.temporaryBoosts.filter(b => b.endTime > now);
    
    // Update last played
    this.lastPlayed = now;
    this.state.lastPlayed = now;
  }

  /**
   * Get current state for saving
   * @returns {Object} Current game state
   */
  getState() {
    return {
      ...this.state,
      pps: this.calculatePPS(),
      multipliers: this.multipliers
    };
  }

  /**
   * Calculate prestige points
   * @param {number} tier - Prestige tier
   * @returns {number} Points to gain
   */
  calculatePrestigePoints(tier = 1) {
    const resources = this.config.getAllResources();
    
    let totalValue = 0;
    for (const res of resources) {
      totalValue += this.state.resources[res.codeName]?.quantity || 0;
    }
    
    if (totalValue < 1000) return 0;
    
    const tierMultipliers = { 1: 1, 2: 2, 3: 5 };
    const basePoints = Math.floor(Math.log10(totalValue));
    
    return basePoints * (tierMultipliers[tier] || 1);
  }

  /**
   * Perform prestige
   * @param {number} tier - Prestige tier
   * @returns {Object} Prestige result
   */
  performPrestige(tier = 1) {
    const points = this.calculatePrestigePoints(tier);
    
    if (points <= 0) return { success: false, points: 0 };
    
    // Calculate rewards
    const result = {
      success: true,
      points,
      tier,
      bonusesGained: {}
    };
    
    // Add prestige currency
    const tierCurrencies = { 1: 'prestigeShards', 2: 'transcendPoints', 3: 'ascensionEssence' };
    const currency = tierCurrencies[tier];
    this.state.prestige[`tier${tier}`].points += points;
    this.state.prestige[`tier${tier}`].timesPerformed++;
    
    // Reset appropriate content based on tier
    if (tier >= 1) {
      // Reset generators
      for (const key in this.state.generators) {
        this.state.generators[key] = {
          quantityPurchased: 0,
          totalSpend: 0,
          totalEarned: 0
        };
      }
      
      // Reset resources
      for (const key in this.state.resources) {
        this.state.resources[key] = {
          quantity: 0,
          totalEarned: 0,
          totalSpent: 0
        };
      }
    }
    
    if (tier >= 2) {
      // Reset upgrades
      for (const key in this.state.upgrades) {
        this.state.upgrades[key] = {
          purchased: false,
          purchaseCount: 0
        };
      }
      
      // Reset inventory
      for (const key in this.state.inventory) {
        this.state.inventory[key] = 0;
      }
    }
    
    if (tier >= 3) {
      // Reset artifacts
      // (handled in tier 2 reset for inventory)
    }
    
    // Recalculate
    this.calculateAllMultipliers();
    this.checkUnlocks();
    
    // Emit event
    this.eventBus.emit(GameEvents.PRESTIGE_PERFORMED, result);
    
    return result;
  }

  /**
   * Calculate drop rate
   * @returns {number} Drop rate
   */
  calculateDropRate() {
    let baseRate = 0.01;
    
    // Based on total generator purchases
    let totalGenerators = 0;
    for (const key in this.state.generators) {
      totalGenerators += this.state.generators[key].quantityPurchased;
    }
    baseRate = Math.log(totalGenerators + 1) / 10;
    
    // Apply multipliers
    if (this.multipliers.dropRate) {
      baseRate *= this.multipliers.dropRate;
    }
    
    return Math.min(baseRate, 0.5); // Cap at 50%
  }

  /**
   * Check for item drop
   * @returns {Object|null} Dropped item or null
   */
  checkItemDrop() {
    const dropRate = this.calculateDropRate();
    
    if (Math.random() > dropRate) return null;
    
    // Select item based on rarity weights
    const rarities = this.config.getItemRarities();
    const totalWeight = rarities.reduce((sum, r) => sum + r.dropWeight, 0);
    let roll = Math.random() * totalWeight;
    
    let selectedRarity = 'common';
    for (const rarity of rarities) {
      roll -= rarity.dropWeight;
      if (roll <= 0) {
        selectedRarity = rarity.codeName;
        break;
      }
    }
    
    // Get item of that rarity
    const items = this.config.getItemsByRarity(selectedRarity);
    if (items.length === 0) return null;
    
    const item = items[Math.floor(Math.random() * items.length)];
    
    // Add to inventory
    this.state.inventory[item.codeName]++;
    this.state.statistics.itemsCollected++;
    
    // Emit event
    this.eventBus.emit(GameEvents.ITEM_DROPPED, { item: item.codeName });
    
    return item;
  }

  /**
   * Use item
   * @param {string} codeName - Item codeName
   * @returns {boolean} Success
   */
  useItem(codeName) {
    if (this.state.inventory[codeName] <= 0) return false;
    
    const item = this.config.getItem(codeName);
    if (!item) return false;
    
    if (item.type === 'consumable' && item.effect) {
      // Apply consumable effect
      const now = Date.now();
      
      if (item.effect.type === 'temporaryMultiplier') {
        this.state.temporaryBoosts.push({
          type: item.effect.type === 'temporaryMultiplier' ? 'globalMultiplier' : item.effect.type,
          multiplier: item.effect.multiplier,
          endTime: now + (item.effect.duration * 1000)
        });
      }
      
      // Consume item
      this.state.inventory[codeName]--;
      
      this.eventBus.emit(GameEvents.ITEM_USED, { item: codeName });
      this.calculateAllMultipliers();
      
      return true;
    }
    
    return false;
  }

  /**
   * Equip item
   * @param {string} characterCode - Character codeName
   * @param {string} slot - Equipment slot
   * @param {string} itemCode - Item codeName
   * @returns {boolean} Success
   */
  equipItem(characterCode, slot, itemCode) {
    const charState = this.state.characters[characterCode];
    if (!charState) return false;
    
    const item = this.config.getItem(itemCode);
    if (!item || !item.equippable) return false;
    
    // Check if character has the slot unlocked
    const charConfig = this.config.getCharacter(characterCode);
    if (charConfig.slotRequirement > charState.level) return false;
    
    // Check inventory
    if (this.state.inventory[itemCode] <= 0) return false;
    
    // Unequip current item if any
    const currentItem = charState.equipment[slot];
    if (currentItem) {
      this.state.inventory[currentItem]++;
    }
    
    // Equip new item
    charState.equipment[slot] = itemCode;
    this.state.inventory[itemCode]--;
    
    this.calculateAllMultipliers();
    this.eventBus.emit(GameEvents.ITEM_EQUIPPED, { character: characterCode, slot, item: itemCode });
    
    return true;
  }

  /**
   * Activate character
   * @param {string} codeName - Character codeName
   * @returns {boolean} Success
   */
  activateCharacter(codeName) {
    if (!this.isCharacterUnlocked(codeName)) return false;
    
    const charState = this.state.characters[codeName];
    if (charState.activated) return true;
    
    // Check max active characters
    let activeCount = 0;
    for (const key in this.state.characters) {
      if (this.state.characters[key].activated) activeCount++;
    }
    
    if (activeCount >= 3) return false; // Max 3 active
    
    charState.activated = true;
    this.calculateAllMultipliers();
    
    this.eventBus.emit(GameEvents.CHARACTER_ACTIVATED, { codeName });
    
    return true;
  }

  /**
   * Deactivate character
   * @param {string} codeName - Character codeName
   * @returns {boolean} Success
   */
  deactivateCharacter(codeName) {
    const charState = this.state.characters[codeName];
    if (!charState.activated) return false;
    
    charState.activated = false;
    this.calculateAllMultipliers();
    
    this.eventBus.emit(GameEvents.CHARACTER_DEACTIVATED, { codeName });
    
    return true;
  }

  /**
   * Check achievements
   */
  checkAchievements() {
    const achievements = this.config.getAllAchievements();
    
    for (const achievement of achievements) {
      if (this.state.achievements[achievement.codeName]?.unlocked) continue;
      
      let unlocked = false;
      
      switch (achievement.requirement.type) {
        case 'resource':
          unlocked = (this.state.resources[achievement.requirement.resource]?.quantity || 0) >= achievement.requirement.amount;
          break;
        case 'generatorCount':
          let total = 0;
          for (const key in this.state.generators) {
            total += this.state.generators[key].quantityPurchased;
          }
          unlocked = total >= achievement.requirement.count;
          break;
        case 'pps':
          unlocked = this.calculatePPS() >= achievement.requirement.amount;
          break;
        case 'totalClicks':
          unlocked = this.state.statistics.totalClicks >= achievement.requirement.count;
          break;
        case 'prestige':
          unlocked = this.state.prestige.tier1.timesPerformed >= achievement.requirement.count;
          break;
        case 'allCategories':
          // Check all categories have at least one generator
          const categories = this.config.getGeneratorCategories();
          unlocked = categories.every(cat => {
            const gens = this.config.getGeneratorsByCategory(cat.codeName);
            return gens.some(g => this.state.generators[g.codeName]?.quantityPurchased > 0);
          });
          break;
      }
      
      if (unlocked) {
        this.state.achievements[achievement.codeName] = { unlocked: true, timestamp: Date.now() };
        this.state.statistics.achievementsUnlocked++;
        
        // Grant reward
        if (achievement.reward) {
          if (achievement.reward.type === 'resource') {
            this.addResource(achievement.reward.resource, achievement.reward.amount);
          } else if (achievement.reward.type === 'item') {
            this.state.inventory[achievement.reward.item] += achievement.reward.quantity || 1;
          }
        }
        
        this.eventBus.emit(GameEvents.ACHIEVEMENT_UNLOCKED, achievement);
      }
    }
  }

  /**
   * Reset game
   */
  resetGame() {
    this.state = this.getDefaultState();
    this.multipliers = this.getDefaultMultipliers();
    this.eventBus.emit(GameEvents.GAME_RESET);
  }

  /**
   * Get all multipliers for display
   * @returns {Object} All multipliers
   */
  getAllMultipliers() {
    return { ...this.multipliers };
  }

  /**
   * Get lifetime statistics
   * @returns {Object} Statistics
   */
  getLifetimeStats() {
    let totalGenerators = 0;
    for (const key in this.state.generators) {
      totalGenerators += this.state.generators[key].quantityPurchased;
    }
    
    return {
      totalPlayTime: this.state.statistics.totalPlayTime,
      totalClicks: this.state.statistics.totalClicks,
      highestPPS: this.state.statistics.highestPPS,
      generatorsOwned: totalGenerators,
      itemsCollected: this.state.statistics.itemsCollected,
      achievementsUnlocked: this.state.statistics.achievementsUnlocked,
      prestigeCount: this.state.prestige.tier1.timesPerformed
    };
  }
}

// Export singleton
const gameState = new GameState();
export { GameState, gameState };
export default gameState;