/**
 * GeneratorPanel Vue Component
 * Displays all generators with purchase options
 */
const GeneratorPanel = {
  name: 'GeneratorPanel',
  props: {
    generators: { type: Array, required: true },
    generatorStates: { type: Object, required: true },
    resources: { type: Object, required: true },
    multipliers: { type: Object, required: true },
    isUnlocked: { type: Function, required: true },
    getCost: { type: Function, required: true },
    canAfford: { type: Function, required: true }
  },
  emits: ['purchase'],
  template: `
    <div class="generator-panel">
      <div v-for="category in categories" :key="category.codeName" class="category-section">
        <div class="category-header" @click="toggleCategory(category.codeName)">
          <span class="icon" :style="{ color: category.color }">{{ category.icon }}</span>
          <h3>{{ category.displayName }}</h3>
          <span class="count">{{ getCategoryOwned(category.codeName) }} owned</span>
          <span class="toggle">{{ expandedCategories[category.codeName] ? '▼' : '▶' }}</span>
        </div>
        
        <div v-show="expandedCategories[category.codeName]" class="category-content">
          <div 
            v-for="gen in getGeneratorsByCategory(category.codeName)" 
            :key="gen.codeName"
            class="generator-card"
            :class="{
              locked: !isUnlocked(gen.codeName),
              unaffordable: isUnlocked(gen.codeName) && !canAfford(gen.codeName),
              owned: generatorStates[gen.codeName]?.quantityPurchased > 0
            }"
            @click="handlePurchase(gen.codeName)"
          >
            <div class="icon">{{ gen.icon }}</div>
            <div class="generator-info">
              <h3>{{ gen.displayName }}</h3>
              <p>{{ gen.description }}</p>
              <span class="quantity" v-if="generatorStates[gen.codeName]?.quantityPurchased > 0">
                Owned: {{ generatorStates[gen.codeName].quantityPurchased }}
              </span>
            </div>
            <div class="generator-stats">
              <span class="cost">
                {{ formatCost(getCost(gen.codeName)) }}
              </span>
              <span class="pps">
                +{{ formatNumber(calculatePPS(gen)) }}/s each
              </span>
              <span class="purchased" v-if="generatorStates[gen.codeName]?.quantityPurchased > 0">
                {{ generatorStates[gen.codeName].quantityPurchased }}
              </span>
            </div>
          </div>
          
          <div v-if="getGeneratorsByCategory(category.codeName).length === 0" class="empty-state">
            <span class="icon">🔒</span>
            <p>No generators unlocked in this category yet</p>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      expandedCategories: {},
      categories: []
    };
  },
  created() {
    this.loadCategories();
    // Expand first category by default
    if (this.categories.length > 0) {
      this.$set(this.expandedCategories, this.categories[0].codeName, true);
    }
  },
  methods: {
    loadCategories() {
      if (window.gameConfig) {
        this.categories = window.gameConfig.getGeneratorCategories();
      }
    },
    toggleCategory(codeName) {
      this.$set(this.expandedCategories, codeName, !this.expandedCategories[codeName]);
    },
    getGeneratorsByCategory(category) {
      return this.generators.filter(g => g.category === category);
    },
    getCategoryOwned(category) {
      const categoryGens = this.getGeneratorsByCategory(category);
      return categoryGens.reduce((sum, gen) => {
        return sum + (this.generatorStates[gen.codeName]?.quantityPurchased || 0);
      }, 0);
    },
    calculatePPS(gen) {
      let pps = gen.basePPS;
      
      // Apply category multiplier
      if (this.multipliers.category?.[gen.category]) {
        pps *= this.multipliers.category[gen.category];
      }
      
      // Apply global multiplier
      pps *= this.multipliers.global || 1;
      
      // Apply prestige multiplier
      pps *= this.multipliers.prestige || 1;
      
      return pps;
    },
    formatCost(costs) {
      return Object.entries(costs)
        .map(([res, amount]) => `${this.formatNumber(Math.ceil(amount))} ${this.getResourceName(res)}`)
        .join(', ');
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
      if (this.isUnlocked(codeName) && this.canAfford(codeName)) {
        this.$emit('purchase', codeName);
      }
    }
  }
};

export default GeneratorPanel;