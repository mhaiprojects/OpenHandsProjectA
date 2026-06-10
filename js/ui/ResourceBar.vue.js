/**
 * ResourceBar Vue Component
 * Displays all resources with current quantity and PPS
 */
const ResourceBar = {
  name: 'ResourceBar',
  props: {
    resources: { type: Object, required: true },
    pps: { type: Number, default: 0 }
  },
  template: `
    <div class="resource-bar">
      <div 
        v-for="(data, codeName) in resources" 
        :key="codeName"
        class="resource-item"
        :style="{ borderLeftColor: getResourceColor(codeName) }"
      >
        <span class="icon">{{ getResourceIcon(codeName) }}</span>
        <div class="info">
          <span class="value">{{ formatNumber(data.quantity) }}</span>
          <span class="pps" v-if="getResourcePPS(codeName) > 0">+{{ formatNumber(getResourcePPS(codeName)) }}/s</span>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      resourceCache: {}
    };
  },
  methods: {
    getResourceIcon(codeName) {
      const config = window.gameConfig?.getResource(codeName);
      return config?.icon || '💎';
    },
    getResourceColor(codeName) {
      const config = window.gameConfig?.getResource(codeName);
      return config?.color || '#6366f1';
    },
    getResourcePPS(codeName) {
      // Calculate PPS for this specific resource
      return 0; // Simplified for now
    },
    formatNumber(num) {
      if (num < 1000) return Math.floor(num).toLocaleString();
      if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
      if (num < 1000000000) return (num / 1000000).toFixed(2) + 'M';
      if (num < 1000000000000) return (num / 1000000000).toFixed(2) + 'B';
      return (num / 1000000000000).toFixed(2) + 'T';
    }
  }
};

export default ResourceBar;