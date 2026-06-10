/**
 * StatsPanel Vue Component
 * Displays game statistics and PPS breakdown
 */
const StatsPanel = {
  name: 'StatsPanel',
  props: {
    statistics: { type: Object, required: true },
    pps: { type: Number, required: true },
    ppsBreakdown: { type: Object, required: true },
    multipliers: { type: Object, required: true }
  },
  template: `
    <div class="stats-panel">
      <div class="stats-section">
        <h3>Overview</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="value">{{ formatNumber(pps) }}</span>
            <span class="label">PPS (Per Second)</span>
          </div>
          <div class="stat-item">
            <span class="value">{{ formatNumber(statistics.totalClicks) }}</span>
            <span class="label">Total Clicks</span>
          </div>
          <div class="stat-item">
            <span class="value">{{ formatNumber(statistics.generatorsOwned) }}</span>
            <span class="label">Generators Owned</span>
          </div>
          <div class="stat-item">
            <span class="value">{{ formatNumber(statistics.itemsCollected) }}</span>
            <span class="label">Items Collected</span>
          </div>
        </div>
      </div>
      
      <div class="stats-section">
        <h3>PPS Breakdown</h3>
        <div class="pps-breakdown">
          <div 
            v-for="(data, codeName) in ppsBreakdown" 
            :key="codeName"
            class="pps-item"
          >
            <div class="pps-info">
              <span class="name">{{ data.displayName }}</span>
              <span class="count">x{{ data.quantity }}</span>
            </div>
            <div class="pps-bar">
              <div class="fill" :style="{ width: data.percentage + '%' }"></div>
            </div>
            <span class="pps-value">{{ formatNumber(data.pps) }}/s ({{ data.percentage.toFixed(1) }}%)</span>
          </div>
        </div>
      </div>
      
      <div class="stats-section">
        <h3>Active Multipliers</h3>
        <div class="multiplier-list">
          <div class="multiplier-item" v-if="multipliers.global && multipliers.global !== 1">
            <span class="name">Global Bonus</span>
            <span class="value">x{{ multipliers.global.toFixed(2) }}</span>
          </div>
          <div class="multiplier-item" v-if="multipliers.click && multipliers.click !== 1">
            <span class="name">Click Power</span>
            <span class="value">x{{ multipliers.click.toFixed(2) }}</span>
          </div>
          <div class="multiplier-item" v-if="multipliers.prestige && multipliers.prestige !== 1">
            <span class="name">Prestige Bonus</span>
            <span class="value">x{{ multipliers.prestige.toFixed(2) }}</span>
          </div>
          <div class="multiplier-item" v-for="(mult, key) in multipliers.category" :key="key" v-if="mult && mult !== 1">
            <span class="name">{{ formatCategory(key) }}</span>
            <span class="value">x{{ mult.toFixed(2) }}</span>
          </div>
          <div v-if="Object.keys(multipliers.category || {}).length === 0 && (!multipliers.global || multipliers.global === 1) && (!multipliers.click || multipliers.click === 1)" class="empty-state">
            <p>No active multipliers</p>
          </div>
        </div>
      </div>
      
      <div class="stats-section">
        <h3>Lifetime Stats</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="value">{{ formatTime(statistics.totalPlayTime) }}</span>
            <span class="label">Play Time</span>
          </div>
          <div class="stat-item">
            <span class="value">{{ formatNumber(statistics.highestPPS) }}</span>
            <span class="label">Highest PPS</span>
          </div>
          <div class="stat-item">
            <span class="value">{{ statistics.achievementsUnlocked }}</span>
            <span class="label">Achievements</span>
          </div>
          <div class="stat-item">
            <span class="value">{{ statistics.prestigeCount || 0 }}</span>
            <span class="label">Prestiges</span>
          </div>
        </div>
      </div>
    </div>
  `,
  methods: {
    formatNumber(num) {
      if (!num || num === 0) return '0';
      if (num < 1000) return Math.floor(num).toLocaleString();
      if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
      if (num < 1000000000) return (num / 1000000).toFixed(2) + 'M';
      if (num < 1000000000000) return (num / 1000000000).toFixed(2) + 'B';
      return (num / 1000000000000).toFixed(2) + 'T';
    },
    formatTime(seconds) {
      if (!seconds) return '0h';
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      if (hours > 24) {
        return Math.floor(hours / 24) + 'd ' + (hours % 24) + 'h';
      }
      return hours + 'h ' + minutes + 'm';
    },
    formatCategory(codeName) {
      return codeName.charAt(0).toUpperCase() + codeName.slice(1) + ' Bonus';
    }
  }
};

export default StatsPanel;