/**
 * ConfigManager - Loads and manages all game configuration from JSON files
 * Provides centralized access to all game data
 */
class ConfigManager {
  constructor() {
    this.configs = {};
    this.loaded = false;
    this.configPaths = {
      resources: 'config/resources.json',
      generators: 'config/generators.json',
      upgrades: 'config/upgrades.json',
      characters: 'config/characters.json',
      items: 'config/items.json',
      achievements: 'config/achievements.json',
      events: 'config/events.json',
      prestige: 'config/prestige.json'
    };
  }

  /**
   * Load all configuration files
   * @returns {Promise} Resolves when all configs are loaded
   */
  async loadAll() {
    const loadPromises = Object.entries(this.configPaths).map(async ([key, path]) => {
      try {
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error(`Failed to load ${path}: ${response.status}`);
        }
        this.configs[key] = await response.json();
      } catch (error) {
        console.error(`ConfigManager: Error loading ${path}`, error);
        this.configs[key] = this.getDefaultConfig(key);
      }
    });

    await Promise.all(loadPromises);
    this.loaded = true;
    return this.configs;
  }

  /**
   * Get default config for a missing file
   * @param {string} key - Config key
   * @returns {Object} Default configuration
   */
  getDefaultConfig(key) {
    const defaults = {
      resources: { resources: [] },
      generators: { generators: [], generatorCategories: [] },
      upgrades: { upgrades: [], upgradeCategories: [] },
      characters: { characters: [], characterClasses: [], equipmentSlots: [] },
      items: { items: [], itemRarity: [], itemTypes: [] },
      achievements: { achievements: [] },
      events: { events: [], eventTypes: [] },
      prestige: { prestigeTiers: [], prestigeBonuses: [] }
    };
    return defaults[key] || {};
  }

  /**
   * Get a specific config
   * @param {string} key - Config key
   * @returns {Object} Configuration object
   */
  get(key) {
    return this.configs[key];
  }

  /**
   * Get all configs
   * @returns {Object} All configurations
   */
  getAll() {
    return this.configs;
  }

  /**
   * Get a resource config by codeName
   * @param {string} codeName - Resource codeName
   * @returns {Object|null} Resource config
   */
  getResource(codeName) {
    const resources = this.configs.resources?.resources || [];
    return resources.find(r => r.codeName === codeName) || null;
  }

  /**
   * Get all resources
   * @returns {Array} Resource configs
   */
  getAllResources() {
    return this.configs.resources?.resources || [];
  }

  /**
   * Get a generator config by codeName
   * @param {string} codeName - Generator codeName
   * @returns {Object|null} Generator config
   */
  getGenerator(codeName) {
    const generators = this.configs.generators?.generators || [];
    return generators.find(g => g.codeName === codeName) || null;
  }

  /**
   * Get all generators
   * @returns {Array} Generator configs
   */
  getAllGenerators() {
    return this.configs.generators?.generators || [];
  }

  /**
   * Get generators by category
   * @param {string} category - Category codeName
   * @returns {Array} Generator configs
   */
  getGeneratorsByCategory(category) {
    const generators = this.getAllGenerators();
    return generators.filter(g => g.category === category);
  }

  /**
   * Get generator categories
   * @returns {Array} Category configs
   */
  getGeneratorCategories() {
    return this.configs.generators?.generatorCategories || [];
  }

  /**
   * Get an upgrade config by codeName
   * @param {string} codeName - Upgrade codeName
   * @returns {Object|null} Upgrade config
   */
  getUpgrade(codeName) {
    const upgrades = this.configs.upgrades?.upgrades || [];
    return upgrades.find(u => u.codeName === codeName) || null;
  }

  /**
   * Get all upgrades
   * @returns {Array} Upgrade configs
   */
  getAllUpgrades() {
    return this.configs.upgrades?.upgrades || [];
  }

  /**
   * Get upgrades by category
   * @param {string} category - Category codeName
   * @returns {Array} Upgrade configs
   */
  getUpgradesByCategory(category) {
    const upgrades = this.getAllUpgrades();
    return upgrades.filter(u => u.category === category);
  }

  /**
   * Get upgrade categories
   * @returns {Array} Category configs
   */
  getUpgradeCategories() {
    return this.configs.upgrades?.upgradeCategories || [];
  }

  /**
   * Get a character config by codeName
   * @param {string} codeName - Character codeName
   * @returns {Object|null} Character config
   */
  getCharacter(codeName) {
    const characters = this.configs.characters?.characters || [];
    return characters.find(c => c.codeName === codeName) || null;
  }

  /**
   * Get all characters
   * @returns {Array} Character configs
   */
  getAllCharacters() {
    return this.configs.characters?.characters || [];
  }

  /**
   * Get character classes
   * @returns {Array} Class configs
   */
  getCharacterClasses() {
    return this.configs.characters?.characterClasses || [];
  }

  /**
   * Get equipment slots
   * @returns {Array} Slot configs
   */
  getEquipmentSlots() {
    return this.configs.characters?.equipmentSlots || [];
  }

  /**
   * Get an item config by codeName
   * @param {string} codeName - Item codeName
   * @returns {Object|null} Item config
   */
  getItem(codeName) {
    const items = this.configs.items?.items || [];
    return items.find(i => i.codeName === codeName) || null;
  }

  /**
   * Get all items
   * @returns {Array} Item configs
   */
  getAllItems() {
    return this.configs.items?.items || [];
  }

  /**
   * Get items by type
   * @param {string} type - Item type codeName
   * @returns {Array} Item configs
   */
  getItemsByType(type) {
    const items = this.getAllItems();
    return items.filter(i => i.type === type);
  }

  /**
   * Get items by rarity
   * @param {string} rarity - Rarity codeName
   * @returns {Array} Item configs
   */
  getItemsByRarity(rarity) {
    const items = this.getAllItems();
    return items.filter(i => i.rarity === rarity);
  }

  /**
   * Get item rarities
   * @returns {Array} Rarity configs
   */
  getItemRarities() {
    return this.configs.items?.itemRarity || [];
  }

  /**
   * Get an achievement config by codeName
   * @param {string} codeName - Achievement codeName
   * @returns {Object|null} Achievement config
   */
  getAchievement(codeName) {
    const achievements = this.configs.achievements?.achievements || [];
    return achievements.find(a => a.codeName === codeName) || null;
  }

  /**
   * Get all achievements
   * @returns {Array} Achievement configs
   */
  getAllAchievements() {
    return this.configs.achievements?.achievements || [];
  }

  /**
   * Get an event config by codeName
   * @param {string} codeName - Event codeName
   * @returns {Object|null} Event config
   */
  getEvent(codeName) {
    const events = this.configs.events?.events || [];
    return events.find(e => e.codeName === codeName) || null;
  }

  /**
   * Get all events
   * @returns {Array} Event configs
   */
  getAllEvents() {
    return this.configs.events?.events || [];
  }

  /**
   * Get random events (filtered by unlock)
   * @param {Function} unlockCheck - Function to check unlock status
   * @returns {Array} Available events
   */
  getAvailableEvents(unlockCheck) {
    const events = this.getAllEvents();
    return events.filter(e => !e.unlockRequirement || unlockCheck(e.unlockRequirement));
  }

  /**
   * Get prestige tiers
   * @returns {Array} Tier configs
   */
  getPrestigeTiers() {
    return this.configs.prestige?.prestigeTiers || [];
  }

  /**
   * Get prestige bonuses
   * @returns {Array} Bonus configs
   */
  getPrestigeBonuses() {
    return this.configs.prestige?.prestigeBonuses || [];
  }

  /**
   * Get prestige tier requirements
   * @returns {Object} Tier requirements
   */
  getPrestigeTierRequirements() {
    return this.configs.prestige?.prestigeTierRequirements || {};
  }

  /**
   * Reload configuration (useful for hot-reload in dev)
   * @returns {Promise}
   */
  async reload() {
    this.loaded = false;
    await this.loadAll();
    return this.configs;
  }
}

// Export singleton instance
const configManager = new ConfigManager();
export { ConfigManager, configManager };
export default configManager;