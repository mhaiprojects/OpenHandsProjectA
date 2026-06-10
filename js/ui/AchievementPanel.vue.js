/**
 * AchievementPanel Vue Component
 * Displays all achievements with unlock status
 */
const AchievementPanel = {
  name: 'AchievementPanel',
  props: {
    achievements: { type: Array, required: true },
    achievementStates: { type: Object, required: true }
  },
  template: `
    <div class="achievement-panel">
      <div class="panel-header">
        <h3>Achievements ({{ unlockedCount }} / {{ achievements.length }})</h3>
      </div>
      
      <div class="achievement-list">
        <div 
          v-for="achievement in achievements" 
          :key="achievement.codeName"
          class="achievement"
          :class="{ unlocked: achievementStates[achievement.codeName]?.unlocked }"
        >
          <div class="icon">{{ achievement.icon }}</div>
          <div class="info">
            <h4>{{ achievement.displayName }}</h4>
            <p>{{ achievement.description }}</p>
          </div>
          <div class="reward" v-if="achievement.reward">
            <span v-if="achievement.reward.type === 'resource'">
              +{{ achievement.reward.amount }} {{ getResourceName(achievement.reward.resource) }}
            </span>
            <span v-else-if="achievement.reward.type === 'item'">
              +{{ achievement.reward.quantity || 1 }} {{ achievement.reward.item }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  computed: {
    unlockedCount() {
      return Object.values(this.achievementStates).filter(s => s?.unlocked).length;
    }
  },
  methods: {
    getResourceName(codeName) {
      const config = window.gameConfig?.getResource(codeName);
      return config?.displayName || codeName;
    }
  }
};

export default AchievementPanel;