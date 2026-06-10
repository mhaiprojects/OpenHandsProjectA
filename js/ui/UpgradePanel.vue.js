/**
 * UpgradePanel Vue Component
 * Displays all upgrades with purchase options
 */
const UpgradePanel = {
  name: 'UpgradePanel',
  props: {
    upgrades: { type: Array, required: true },
    upgradeStates: { type: Object, required: true },
    resources: { type: Object, required: true },
    isUnlocked: { type: Function, required: true }
  },
  emits: ['purchase'],
  template: `
    <div class="upgrade-panel">
      <div v-for="category in categories" :key="category.codeName" class="upgrade-category">
        <h3 class="category-title">
          <span class="icon">{{ category.icon }}</span>
          {{ category.displayName }}
        </h3>
        
        <div 
          v-for="upgrade in getUpgradesByCategory(category.codeName)" 
          :key="upgrade.codeName"
          class="upgrade-item"
          :class="{
            purchased: isPurchased(upgrade.codeName),
            locked: !isUnlocked(upgrade.codeName)
          }"
          @click="handlePurchase(upgrade.codeName)"
        >
          <div class="icon">{{ upgrade.icon }}</div>
          <div class="info">
            <h4>{{ upgrade.displayName }}</h4>
            <p>{{ upgrade.description }}</p>
            <span v-if="upgrade.maxPurchases > 1" class="count">
              {{ upgradeStates[upgrade.codeName]?.purchaseCount || 0 }} / {{ upgrade.maxPurchases }}
            </span>
          </div>
          <div class="cost" v-if="!isPurchased(upgrade.codeName)">
            {{ formatNumber(getUpgradeCost(upgrade.codeName)) }} {{ getResourceName(upgrade.costResource) }}
          </div>
          <div class="purchased-badge" v-else>✓</div>
        </div>
        
        <div v-if="getUpgradesByCategory(category.codeName).length === 0" class="empty-state">
          <p>No upgrades in this category</p>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      categories: []
    };
  },
  created() {
    this.loadCategories();
  },
  methods: {
    loadCategories() {
      if (window.gameConfig) {
        this.categories = window.gameConfig.getUpgradeCategories();
      }
    },
    getUpgradesByCategory(category) {
      return this.upgrades.filter(u => u.category === category);
    },
    isPurchased(codeName) {
      const state = this.upgradeStates[codeName];
      if (!state) return false;
      const upgrade = this.upgrades.find(u => u.codeName === codeName);
      if (!upgrade) return false;
      return upgrade.maxPurchases === 1 ? state.purchased : state.purchaseCount >= upgrade.maxPurchases;
    },
    getUpgradeCost(codeName) {
      const upgrade = this.upgrades.find(u => u.codeName === codeName);
      if (!upgrade) return Infinity;
      const state = this.upgradeStates[codeName];
      const purchaseCount = state?.purchaseCount || 0;
      return upgrade.cost * Math.pow(1.5, purchaseCount);
    },
    formatNumber(num) {
      if (num < 1000) return Math.floor(num).toLocaleString();
      if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
      if (num < 1000000000) return (num / 1000000).toFixed(2) + 'M';
      if (num < 1000000000000) return (num / 1000000000).toFixed(2) + 'B';
      return (num / 1000000000000).toFixed(2) + 'T';
    },
    getResourceName(codeName) {
      const config = window.gameConfig?.getResource(codeName);
      return config?.displayName || codeName;
    },
    handlePurchase(codeName) {
      const upgrade = this.upgrades.find(u => u.codeName === codeName);
      if (!upgrade) return;
      
      if (this.isPurchased(codeName)) return;
      if (!this.isUnlocked(codeName)) return;
      
      const cost = this.getUpgradeCost(codeName);
      const resourceAmount = this.resources[upgrade.costResource]?.quantity || 0;
      
      if (resourceAmount >= cost) {
        this.$emit('purchase', codeName);
      }
    }
  }
};

export default UpgradePanel;