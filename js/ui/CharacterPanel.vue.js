/**
 * CharacterPanel Vue Component
 * Displays all characters with activation options
 */
const CharacterPanel = {
  name: 'CharacterPanel',
  props: {
    characters: { type: Array, required: true },
    characterStates: { type: Object, required: true },
    maxActive: { type: Number, default: 3 }
  },
  emits: ['activate', 'deactivate', 'equip'],
  template: `
    <div class="character-panel">
      <div class="panel-header">
        <h3>Active Characters: {{ activeCount }} / {{ maxActive }}</h3>
      </div>
      
      <div class="character-list">
        <div 
          v-for="char in characters" 
          :key="char.codeName"
          class="character-card"
          :class="{
            locked: !characterStates[char.codeName]?.unlocked,
            activated: characterStates[char.codeName]?.activated
          }"
        >
          <div class="avatar">{{ char.icon }}</div>
          <div class="info">
            <h4>{{ char.displayName }}</h4>
            <span class="class">{{ char.class }}</span>
            <span class="rarity" :class="'rarity-' + char.rarity">{{ char.rarity }}</span>
          </div>
          
          <div class="stats" v-if="characterStates[char.codeName]?.unlocked">
            <div class="stat">
              <span class="value">{{ formatMultiplier(char.baseStats.resourceGain) }}</span>
              <span class="label">Resources</span>
            </div>
            <div class="stat">
              <span class="value">{{ formatMultiplier(char.baseStats.generatorEfficiency) }}</span>
              <span class="label">Efficiency</span>
            </div>
          </div>
          
          <div class="actions">
            <button 
              v-if="characterStates[char.codeName]?.unlocked && !characterStates[char.codeName]?.activated"
              class="btn btn-primary btn-sm"
              :disabled="activeCount >= maxActive"
              @click="$emit('activate', char.codeName)"
            >
              Activate
            </button>
            <button 
              v-if="characterStates[char.codeName]?.activated"
              class="btn btn-secondary btn-sm"
              @click="$emit('deactivate', char.codeName)"
            >
              Deactivate
            </button>
            <span v-if="!characterStates[char.codeName]?.unlocked" class="lock-info">
              {{ getUnlockText(char) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  computed: {
    activeCount() {
      return Object.values(this.characterStates).filter(s => s.activated).length;
    }
  },
  methods: {
    formatMultiplier(value) {
      if (value === 1) return '1x';
      return ((value - 1) * 100).toFixed(0) + '%';
    },
    getUnlockText(char) {
      if (!char.unlockRequirement) return '';
      return `Unlock: ${char.unlockRequirement.generator} x${char.unlockRequirement.quantity}`;
    }
  }
};

export default CharacterPanel;