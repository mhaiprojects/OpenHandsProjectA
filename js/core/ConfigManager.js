/**
 * ConfigManager - Loads and manages JSON configuration files
 * All game data is driven by JSON files for easy customization
 */
export class ConfigManager {
    constructor() {
        this.configs = new Map();
        this.basePath = './config/';
    }

    /**
     * Load a single config file
     * @param {string} name - Config name (without .json extension)
     * @returns {Promise<Object>} Parsed JSON config
     */
    async load(name) {
        try {
            const response = await fetch(`${this.basePath}${name}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load ${name}.json: ${response.status}`);
            }
            const data = await response.json();
            this.configs.set(name, data);
            return data;
        } catch (error) {
            console.error(`ConfigManager: Error loading ${name}:`, error);
            throw error;
        }
    }

    /**
     * Load all config files
     * @returns {Promise<void>}
     */
    async loadAll() {
        const configFiles = ['game', 'resources', 'upgrades', 'sprites', 'achievements', 'prestige'];
        await Promise.all(configFiles.map(name => this.load(name)));
    }

    /**
     * Get a loaded config
     * @param {string} name - Config name
     * @returns {Object|null} Config object or null if not loaded
     */
    get(name) {
        return this.configs.get(name) || null;
    }

    /**
     * Get all configs
     * @returns {Map<string, Object>} All loaded configs
     */
    getAll() {
        return this.configs;
    }

    /**
     * Check if a config is loaded
     * @param {string} name - Config name
     * @returns {boolean}
     */
    has(name) {
        return this.configs.has(name);
    }

    /**
     * Reload a specific config
     * @param {string} name - Config name
     * @returns {Promise<Object>} Reloaded config
     */
    async reload(name) {
        return this.load(name);
    }

    /**
     * Get a specific value from a config using dot notation
     * @param {string} name - Config name
     * @param {string} path - Dot notation path (e.g., 'game.resolution.width')
     * @param {*} defaultValue - Default value if path not found
     * @returns {*} Value at path or default
     */
    getPath(name, path, defaultValue = null) {
        const config = this.get(name);
        if (!config) return defaultValue;

        return path.split('.').reduce((obj, key) => {
            return obj && obj[key] !== undefined ? obj[key] : defaultValue;
        }, config);
    }
}

export default ConfigManager;