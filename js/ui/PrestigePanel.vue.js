/**
 * PrestigePanel Vue Component
 * Displays prestige options and bonuses
 */
const PrestigePanel = {
  name: 'PrestigePanel',
  props: {
    prestigeStates: { type: Object, required: true },
    prestigeConfig: { type: Object, required: true },
    calculatePoints: { type: Function, required: true },
    canPrestige: { type: Function, required: true }
  },
  emits: ['prestige'],
  template: `
    <div class="prestige-panel">
      <div class="prestige-tiers">
        <div 
          v-for="tier in prestigeTiers" 
          :key="tier.codeName"
          class="prestige-tier"
          :class="{ available: canPrestige(tier.codeName) }"
        >
          <div class="tier-header">
            <span class="icon">{{ tier.icon }}</span>
            <h3>{{ tier.displayName }}</h3>
          </div>
          
          <div class="tier-info">
            <p class="description">{{ tier.description }}</p>
            
            <div class="current-points">
              <span class="label">Current Points:</span>
              <span class="value">{{ getTierPoints(tier.codeName) }}</span>
            </div>
            
            <div class="potential-gain" v-if="tier.codeName === 'reset'">
              <span class="label">Potential Gain:</span>
              <span class="value text-warning">+{{ calculatePoints(1) }}</span>
            </div>
            
            <div class="requirement" v-if="tier.codeName !== 'reset'">
              <span class="label">Requires:</span>
              <span class="value">{{ getTierRequirement(tier.codeName) }}</span>
            </div>
          </div>
          
          <button 
            class="btn btn-warning btn-lg"
            :disabled="!canPrestige(tier.codeName)"
            @click="handlePrestige(tier.codeName)"
          >
            {{ tier.displayName }}
          </button>
        </div>
      </div>
      
      <div class="prestige-bonuses">
        <h3>Prestige Bonuses</h3>
        <div 
          v-for="bonus in prestigeBonuses" 
          :key="bonus.codeName"
          class="bonus-item"
        >
          <div class="bonus-info">
            <span class="icon">{{ bonus.icon }}</span>
            <div>
              <h4>{{ bonus.displayName }}</h4>
              <p>{{ bonus.description }}</p>
            </div>
          </div>
          <div class="bonus-level">
            <span class="level">Lv {{ getBonusLevel(bonus.codeName) }} / {{ bonus.maxLevel }}</span>
            <button class="btn btn-sm btn-secondary" :disabled="!canLevelBonus(bonus.codeName)" @click="levelBonus(bonus.codeName)">
              +1 ({{ getBonusCost(bonus.codeName) }} pts)
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      prestigeTiers: [],
      prestigeBonuses: []
    };
  },
  created() {
    this.loadConfig();
  },
  methods: {
    loadConfig() {
      if (window.gameConfig) {
        this.prestigeTiers = window.gameConfig.getPrestigeTiers();
        this.prestigeBonuses = window.gameConfig.getPrestigeBonuses();
      }
    },
    getTierPoints(tier) {
      const tierKey = `tier${tier === 'reset' ? 1 : tier === 'transcend' ? 2 : 3}`;
      return this.prestigeStates[tierKey]?.points || 0;
    },
    getTierRequirement(tier) {
      const requirements = this.prestigeConfig?.prestigeTierRequirements || {};
      return requirements[tier]?.name || 'Unknown';
    },
    getBonusLevel(codeName) {
      return this.prestigeStates.tier1?.bonuses?.[codeName] || 0;
    },
    getBonusCost(codeName) {
      const bonus = this.prestigeBonuses.find(b => b.codeName === codeName);
      return bonus?.costPerLevel || 1;
    },
    canLevelBonus(codeName) {
      const bonus = this.prestigeBonuses.find(b => b.codeName === codeName);
      if (!bonus) return false;
      const currentLevel = this.getBonusLevel(codeName);
      if (currentLevel >= bonus.maxLevel) return false;
      return this.getTierPoints('reset') >= this.getBonusCost(codeName);
    },
    levelBonus(codeName) {
      // Emit to parent to handle
    },
    handlePrestige(tier) {
      const tierNum = tier === 'reset' ? 1 : tier === 'transcend' ? 2 : 3;
      this.$emit('prestige', tierNum);
    }
  }
};

export default PrestigePanel;