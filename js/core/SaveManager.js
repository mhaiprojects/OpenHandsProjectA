/**
 * SaveManager - Handles game state persistence via localStorage
 * Provides auto-save and manual save/load functionality
 */
export class SaveManager {
    constructor() {
        this.storageKey = 'idle_game_save';
        this.autoSaveEnabled = true;
    }

    /**
     * Save game state
     * @param {Object} state - Game state to save
     * @returns {boolean} Success status
     */
    save(state) {
        try {
            const saveData = {
                timestamp: Date.now(),
                version: '1.0.0',
                state: state
            };
            localStorage.setItem(this.storageKey, JSON.stringify(saveData));
            return true;
        } catch (error) {
            console.error('SaveManager: Failed to save state:', error);
            return false;
        }
    }

    /**
     * Load saved game state
     * @returns {Object|null} Saved state or null
     */
    load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (!data) return null;

            const saveData = JSON.parse(data);
            return saveData.state || null;
        } catch (error) {
            console.error('SaveManager: Failed to load state:', error);
            return null;
        }
    }

    /**
     * Delete saved game state
     * @returns {boolean} Success status
     */
    delete() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('SaveManager: Failed to delete state:', error);
            return false;
        }
    }

    /**
     * Check if a save exists
     * @returns {boolean}
     */
    hasSave() {
        return localStorage.getItem(this.storageKey) !== null;
    }

    /**
     * Get save metadata without loading full state
     * @returns {Object|null} Save metadata
     */
    getSaveInfo() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (!data) return null;

            const saveData = JSON.parse(data);
            return {
                timestamp: saveData.timestamp,
                version: saveData.version
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Export save data as JSON string
     * @returns {string|null} JSON string or null
     */
    export() {
        const state = this.load();
        if (!state) return null;

        return JSON.stringify({
            timestamp: Date.now(),
            version: '1.0.0',
            state: state
        }, null, 2);
    }

    /**
     * Import save data from JSON string
     * @param {string} jsonString - JSON string to import
     * @returns {boolean} Success status
     */
    import(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (!data.state) {
                throw new Error('Invalid save data format');
            }
            return this.save(data.state);
        } catch (error) {
            console.error('SaveManager: Failed to import state:', error);
            return false;
        }
    }
}

export default SaveManager;