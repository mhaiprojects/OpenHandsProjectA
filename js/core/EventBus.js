/**
 * EventBus - Central event system for decoupled communication
 * Allows different game systems to communicate without direct dependencies
 */
class EventBus {
  constructor() {
    this.listeners = new Map();
    this.eventHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    return () => this.off(event, callback);
  }

  /**
   * Subscribe to an event (one-time only)
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  once(event, callback) {
    const wrapper = (data) => {
      this.off(event, wrapper);
      callback(data);
    };
    this.on(event, wrapper);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data = null) {
    this.eventHistory.push({ event, data, timestamp: Date.now() });
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`EventBus error in ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get event history
   * @param {number} limit - Maximum events to return
   * @returns {Array} Event history
   */
  getHistory(limit = 50) {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Clear all listeners
   */
  clear() {
    this.listeners.clear();
  }

  /**
   * Clear specific event listeners
   * @param {string} event - Event name
   */
  clearEvent(event) {
    this.listeners.delete(event);
  }
}

// Event names as constants for consistency
const GameEvents = {
  // Resource events
  RESOURCE_CHANGED: 'resourceChanged',
  RESOURCE_GAINED: 'resourceGained',
  RESOURCE_SPENT: 'resourceSpent',

  // Generator events
  GENERATOR_PURCHASED: 'generatorPurchased',
  GENERATOR_UPDATED: 'generatorUpdated',

  // Upgrade events
  UPGRADE_PURCHASED: 'upgradePurchased',
  UPGRADE_UNLOCKED: 'upgradeUnlocked',

  // Character events
  CHARACTER_ACTIVATED: 'characterActivated',
  CHARACTER_DEACTIVATED: 'characterDeactivated',
  CHARACTER_EQUIPPED: 'characterEquipped',
  CHARACTER_UNEQUIPPED: 'characterUnequipped',

  // Item events
  ITEM_ACQUIRED: 'itemAcquired',
  ITEM_USED: 'itemUsed',
  ITEM_EQUIPPED: 'itemEquipped',
  ITEM_DROPPED: 'itemDropped',

  // Achievement events
  ACHIEVEMENT_UNLOCKED: 'achievementUnlocked',

  // Event system
  RANDOM_EVENT_START: 'randomEventStart',
  RANDOM_EVENT_END: 'randomEventEnd',

  // Prestige events
  PRESTIGE_PERFORMED: 'prestigePerformed',
  PRESTIGE_BONUS_CHANGED: 'prestigeBonusChanged',

  // Game state events
  GAME_LOADED: 'gameLoaded',
  GAME_SAVED: 'gameSaved',
  GAME_RESET: 'gameReset',
  GAME_TICK: 'gameTick',
  OFFLINE_PROGRESS: 'offlineProgress',

  // UI events
  TAB_CHANGED: 'tabChanged',
  MODAL_OPENED: 'modalOpened',
  MODAL_CLOSED: 'modalClosed',
  NOTIFICATION_SHOWN: 'notificationShown',

  // Click events
  CLICK_PERFORMED: 'clickPerformed',
  CLICK_REWARD: 'clickReward'
};

// Export both the class and constants
export { EventBus, GameEvents };
export default EventBus;