/**
 * SaveManager - Handles game save/load operations
 * Supports localStorage with auto-save, export/import, and offline progress
 */
class SaveManager {
  constructor() {
    this.storageKey = 'afk_ai_game_save';
    this.backupKey = 'afk_ai_game_backup';
    this.maxBackups = 5;
    this.autoSaveInterval = 10000; // 10 seconds
    this.rollingSaveInterval = 300000; // 5 minutes
    this.autoSaveTimer = null;
    this.rollingSaveTimer = null;
    this.saveHistory = [];
  }

  /**
   * Initialize auto-save system
   * @param {Function} getSaveData - Function that returns current game state
   */
  initAutoSave(getSaveData) {
    // Clear existing timers
    this.stopAutoSave();

    // Set up regular auto-save
    this.autoSaveTimer = setInterval(() => {
      const data = getSaveData();
      if (data) {
        this.save(data);
      }
    }, this.autoSaveInterval);

    // Set up rolling backup saves
    this.rollingSaveTimer = setInterval(() => {
      const data = getSaveData();
      if (data) {
        this.createBackup(data);
      }
    }, this.rollingSaveInterval);
  }

  /**
   * Stop auto-save system
   */
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    if (this.rollingSaveTimer) {
      clearInterval(this.rollingSaveTimer);
      this.rollingSaveTimer = null;
    }
  }

  /**
   * Save game state
   * @param {Object} gameState - Game state to save
   * @param {string} label - Optional save label
   * @returns {boolean} Success status
   */
  save(gameState, label = 'auto') {
    try {
      const saveData = this.prepareSaveData(gameState);
      const jsonString = JSON.stringify(saveData);
      localStorage.setItem(this.storageKey, jsonString);

      this.saveHistory.push({
        timestamp: Date.now(),
        label,
        size: jsonString.length
      });

      // Keep only last 50 saves in history
      if (this.saveHistory.length > 50) {
        this.saveHistory.shift();
      }

      return true;
    } catch (error) {
      console.error('SaveManager: Failed to save', error);
      return false;
    }
  }

  /**
   * Prepare save data with metadata
   * @param {Object} gameState - Raw game state
   * @returns {Object} Prepared save data
   */
  prepareSaveData(gameState) {
    return {
      version: '2.0.0',
      timestamp: Date.now(),
      saveId: this.generateSaveId(),
      data: gameState
    };
  }

  /**
   * Generate a unique save ID
   * @returns {string} Save ID
   */
  generateSaveId() {
    return `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load game state
   * @returns {Object|null} Loaded game state or null
   */
  load() {
    try {
      const jsonString = localStorage.getItem(this.storageKey);
      if (!jsonString) {
        return null;
      }

      const saveData = JSON.parse(jsonString);
      return this.validateAndMigrate(saveData);
    } catch (error) {
      console.error('SaveManager: Failed to load', error);
      return this.tryLoadBackup();
    }
  }

  /**
   * Validate and migrate save data
   * @param {Object} saveData - Loaded save data
   * @returns {Object} Validated and migrated game state
   */
  validateAndMigrate(saveData) {
    if (!saveData || !saveData.data) {
      return null;
    }

    // Version migration logic
    const version = saveData.version || '1.0.0';
    let data = saveData.data;

    // Add migration logic for future versions
    if (version === '1.0.0') {
      data = this.migrateV1toV2(data);
    }

    return data;
  }

  /**
   * Migrate save from v1 to v2
   * @param {Object} data - Old save data
   * @returns {Object} Migrated save data
   */
  migrateV1toV2(data) {
    // Add any v1 -> v2 migration logic here
    return {
      ...data,
      migratedFrom: '1.0.0'
    };
  }

  /**
   * Try to load from backup
   * @returns {Object|null} Backup save or null
   */
  tryLoadBackup() {
    try {
      const backupJson = localStorage.getItem(this.backupKey);
      if (backupJson) {
        const backupData = JSON.parse(backupJson);
        return this.validateAndMigrate(backupData);
      }
    } catch (error) {
      console.error('SaveManager: Backup load failed', error);
    }
    return null;
  }

  /**
   * Create a backup save
   * @param {Object} gameState - Game state
   */
  createBackup(gameState) {
    try {
      const saveData = this.prepareSaveData(gameState);
      const jsonString = JSON.stringify(saveData);
      localStorage.setItem(this.backupKey, jsonString);
    } catch (error) {
      console.error('SaveManager: Backup failed', error);
    }
  }

  /**
   * Export save as base64 string
   * @param {Object} gameState - Game state
   * @returns {string} Base64 encoded save
   */
  export(gameState) {
    const saveData = this.prepareSaveData(gameState);
    const jsonString = JSON.stringify(saveData);
    return btoa(unescape(encodeURIComponent(jsonString)));
  }

  /**
   * Import save from base64 string
   * @param {string} base64String - Base64 encoded save
   * @returns {Object|null} Decoded game state or null
   */
  import(base64String) {
    try {
      const jsonString = decodeURIComponent(escape(atob(base64String)));
      const saveData = JSON.parse(jsonString);
      return this.validateAndMigrate(saveData);
    } catch (error) {
      console.error('SaveManager: Import failed', error);
      return null;
    }
  }

  /**
   * Delete save
   */
  deleteSave() {
    localStorage.removeItem(this.storageKey);
    this.saveHistory = [];
  }

  /**
   * Get save info
   * @returns {Object} Save information
   */
  getSaveInfo() {
    try {
      const jsonString = localStorage.getItem(this.storageKey);
      if (!jsonString) {
        return null;
      }

      const saveData = JSON.parse(jsonString);
      return {
        version: saveData.version,
        timestamp: saveData.timestamp,
        saveId: saveData.saveId,
        size: jsonString.length
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Calculate offline progress
   * @param {Object} gameState - Current game state
   * @param {number} maxOfflineTime - Maximum offline time in seconds
   * @returns {Object} Offline progress result
   */
  calculateOfflineProgress(gameState, maxOfflineTime = 86400) {
    if (!gameState.lastPlayed) {
      return { enabled: false };
    }

    const now = Date.now();
    const lastPlayed = gameState.lastPlayed;
    const offlineSeconds = Math.min(
      Math.floor((now - lastPlayed) / 1000),
      maxOfflineTime
    );

    if (offlineSeconds < 60) {
      return { enabled: false };
    }

    // Calculate resources gained while offline
    const pps = gameState.pps || 0;
    const offlineMultiplier = gameState.offlineMultiplier || 1.0;
    const resourcesGained = pps * offlineSeconds * offlineMultiplier;

    return {
      enabled: true,
      offlineSeconds,
      resourcesGained,
      pps,
      multiplier: offlineMultiplier
    };
  }

  /**
   * Get save history
   * @returns {Array} Save history
   */
  getSaveHistory() {
    return this.saveHistory;
  }

  /**
   * Check if save exists
   * @returns {boolean}
   */
  hasSave() {
    return localStorage.getItem(this.storageKey) !== null;
  }

  /**
   * Get storage usage estimate
   * @returns {Object} Storage info
   */
  getStorageInfo() {
    try {
      const used = new Blob([localStorage.getItem(this.storageKey) || '']).size;
      const available = 5 * 1024 * 1024; // Estimate 5MB localStorage limit
      return {
        used,
        available,
        percentUsed: (used / available) * 100
      };
    } catch (error) {
      return { used: 0, available: 0, percentUsed: 0 };
    }
  }
}

// Export singleton instance
const saveManager = new SaveManager();
export { SaveManager, saveManager };
export default saveManager;