/**
 * Main App Vue Component
 * Orchestrates all game UI components and state
 */
import { createApp } from 'vue';
import ResourceBar from './ResourceBar.vue.js';
import GeneratorPanel from './GeneratorPanel.vue.js';
import UpgradePanel from './UpgradePanel.vue.js';
import CharacterPanel from './CharacterPanel.vue.js';
import InventoryPanel from './InventoryPanel.vue.js';
import AchievementPanel from './AchievementPanel.vue.js';
import StatsPanel from './StatsPanel.vue.js';
import PrestigePanel from './PrestigePanel.vue.js';

const App = {
  name: 'App',
  components: {
    ResourceBar,
    GeneratorPanel,
    UpgradePanel,
    CharacterPanel,
    InventoryPanel,
    AchievementPanel,
    StatsPanel,
    PrestigePanel
  },
  template: `
    <div class="app-container">
      <!-- Sidebar Navigation -->
      <nav class="sidebar">
        <div 
          v-for="tab in tabs" 
          :key="tab.id"
          class="nav-item"
          :class="{ active: activeTab === tab.id, locked: tab.locked && !isTabUnlocked(tab.id) }"
          @click="setActiveTab(tab.id)"
          :title="tab.label"
        >
          <span class="icon">{{ tab.icon }}</span>
          <span class="label">{{ tab.label }}</span>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="main-content">
        <!-- Resource Bar -->
        <ResourceBar 
          :resources="gameState.resources"
          :pps="pps"
        />

        <!-- Content Area -->
        <div class="content-area">
          <!-- Generators Tab -->
          <div v-if="activeTab === 'generators'" class="tab-content active">
            <GeneratorPanel
              :generators="generators"
              :generatorStates="gameState.generators"
              :resources="gameState.resources"
              :multipliers="gameState.multipliers"
              :isUnlocked="isGeneratorUnlocked"
              :getCost="getGeneratorCost"
              :canAfford="canAffordGenerator"
              @purchase="purchaseGenerator"
            />
          </div>

          <!-- Upgrades Tab -->
          <div v-if="activeTab === 'upgrades'" class="tab-content active">
            <UpgradePanel
              :upgrades="upgrades"
              :upgradeStates="gameState.upgrades"
              :resources="gameState.resources"
              :isUnlocked="isUpgradeUnlocked"
              @purchase="purchaseUpgrade"
            />
          </div>

          <!-- Characters Tab -->
          <div v-if="activeTab === 'characters'" class="tab-content active">
            <CharacterPanel
              :characters="characters"
              :characterStates="gameState.characters"
              :maxActive="3"
              @activate="activateCharacter"
              @deactivate="deactivateCharacter"
            />
          </div>

          <!-- Inventory Tab -->
          <div v-if="activeTab === 'inventory'" class="tab-content active">
            <InventoryPanel
              :items="items"
              :inventory="gameState.inventory"
              @use="useItem"
              @equip="equipItem"
            />
          </div>

          <!-- Achievements Tab -->
          <div v-if="activeTab === 'achievements'" class="tab-content active">
            <AchievementPanel
              :achievements="achievements"
              :achievementStates="gameState.achievements"
            />
          </div>

          <!-- Stats Tab -->
          <div v-if="activeTab === 'stats'" class="tab-content active">
            <StatsPanel
              :statistics="gameState.statistics"
              :pps="pps"
              :ppsBreakdown="ppsBreakdown"
              :multipliers="gameState.multipliers"
            />
          </div>

          <!-- Prestige Tab -->
          <div v-if="activeTab === 'prestige'" class="tab-content active">
            <PrestigePanel
              :prestigeStates="gameState.prestige"
              :prestigeConfig="prestigeConfig"
              :calculatePoints="calculatePrestigePoints"
              :canPrestige="canPrestige"
              @prestige="performPrestige"
            />
          </div>
        </div>

        <!-- Click Button -->
        <div class="click-area">
          <button class="click-button" @click="handleClick">
            ⏱️
          </button>
        </div>

        <!-- Active Events Banner -->
        <div v-if="activeEvents.length > 0" class="event-banner">
          <span class="icon">⚡</span>
          <span class="text">{{ activeEvents.length }} Active Event(s)</span>
        </div>

        <!-- Notifications -->
        <div 
          v-for="(notification, index) in notifications" 
          :key="notification.id"
          class="notification"
          :class="notification.type"
          :style="{ top: (80 + index * 70) + 'px' }"
        >
          <span class="icon">{{ notification.icon }}</span>
          <span class="message">{{ notification.message }}</span>
        </div>

        <!-- Save Controls -->
        <div class="save-controls">
          <button class="btn btn-sm btn-secondary" @click="saveGame">💾 Save</button>
          <button class="btn btn-sm btn-secondary" @click="exportSave">📤 Export</button>
          <button class="btn btn-sm btn-secondary" @click="showImportModal = true">📥 Import</button>
        </div>
      </main>

      <!-- Modal -->
      <div class="modal-overlay" :class="{ active: showImportModal }" @click.self="showImportModal = false">
        <div class="modal">
          <div class="modal-header">
            <h2>Import Save</h2>
            <button class="modal-close" @click="showImportModal = false">×</button>
          </div>
          <div class="modal-content">
            <textarea 
              v-model="importString" 
              placeholder="Paste your save data here..."
              class="import-textarea"
            ></textarea>
            <button class="btn btn-primary" @click="importSave" :disabled="!importString">
              Import
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      activeTab: 'generators',
      showImportModal: false,
      importString: '',
      notifications: [],
      tabs: [
        { id: 'generators', label: 'Generators', icon: '⚙️' },
        { id: 'upgrades', label: 'Upgrades', icon: '📈' },
        { id: 'characters', label: 'Characters', icon: '👤' },
        { id: 'inventory', label: 'Inventory', icon: '🎒' },
        { id: 'achievements', label: 'Achievements', icon: '🏆' },
        { id: 'stats', label: 'Stats', icon: '📊' },
        { id: 'prestige', label: 'Prestige', icon: '🔄' }
      ],
      generators: [],
      upgrades: [],
      characters: [],
      items: [],
      achievements: [],
      prestigeConfig: {}
    };
  },
  computed: {
    gameState() {
      return window.gameState?.state || {};
    },
    pps() {
      return window.gameState?.calculatePPS() || 0;
    },
    ppsBreakdown() {
      return window.gameState?.getPPSBreakdown() || {};
    },
    activeEvents() {
      return this.gameState.activeEvents || [];
    }
  },
  mounted() {
    this.loadConfig();
    this.setupEventListeners();
  },
  methods: {
    async loadConfig() {
      // Wait for config to load
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (window.gameConfig) {
        this.generators = window.gameConfig.getAllGenerators();
        this.upgrades = window.gameConfig.getAllUpgrades();
        this.characters = window.gameConfig.getAllCharacters();
        this.items = window.gameConfig.getAllItems();
        this.achievements = window.gameConfig.getAllAchievements();
        this.prestigeConfig = window.gameConfig.configs.prestige || {};
      }
    },
    setupEventListeners() {
      if (window.gameLoop) {
        window.gameLoop.eventBus.on('notification', (data) => {
          this.showNotification(data.message, data.type, data.icon);
        });
        window.gameLoop.eventBus.on('itemDropped', (data) => {
          const item = window.gameConfig?.getItem(data.item);
          if (item) {
            this.showNotification(`Found ${item.displayName}!`, 'success', item.icon);
          }
        });
        window.gameLoop.eventBus.on('achievementUnlocked', (data) => {
          this.showNotification(`Achievement: ${data.displayName}`, 'success', data.icon);
        });
      }
    },
    setActiveTab(tabId) {
      this.activeTab = tabId;
    },
    isTabUnlocked(tabId) {
      // Tab-specific unlock logic
      switch (tabId) {
        case 'characters':
          return this.gameState.statistics?.generatorsOwned >= 5;
        case 'inventory':
          return this.gameState.statistics?.itemsCollected > 0;
        case 'prestige':
          return this.pps >= 100;
        default:
          return true;
      }
    },
    isGeneratorUnlocked(codeName) {
      return window.gameState?.isGeneratorUnlocked(codeName) || false;
    },
    isUpgradeUnlocked(codeName) {
      return window.gameState?.isUpgradeUnlocked(codeName) || false;
    },
    getGeneratorCost(codeName) {
      return window.gameState?.getGeneratorCost(codeName) || {};
    },
    canAffordGenerator(codeName) {
      return window.gameState?.canAffordGenerator(codeName) || false;
    },
    purchaseGenerator(codeName) {
      if (window.gameState?.purchaseGenerator(codeName)) {
        this.showNotification('Generator purchased!', 'success', '✓');
      }
    },
    purchaseUpgrade(codeName) {
      if (window.gameState?.purchaseUpgrade(codeName)) {
        this.showNotification('Upgrade purchased!', 'success', '✓');
      }
    },
    activateCharacter(codeName) {
      if (window.gameState?.activateCharacter(codeName)) {
        this.showNotification('Character activated!', 'success', '✓');
      }
    },
    deactivateCharacter(codeName) {
      if (window.gameState?.deactivateCharacter(codeName)) {
        this.showNotification('Character deactivated', 'info', '✓');
      }
    },
    useItem(codeName) {
      if (window.gameState?.useItem(codeName)) {
        const item = window.gameConfig?.getItem(codeName);
        this.showNotification(`Used ${item?.displayName || codeName}!`, 'success', '✓');
      }
    },
    equipItem(codeName) {
      // Open equip modal or auto-equip to first available character
      this.showNotification(`Equip ${codeName} not implemented yet`, 'info', 'ℹ️');
    },
    handleClick() {
      const value = window.gameState?.handleClick() || 0;
      this.showFloatingNumber(event, value);
    },
    showFloatingNumber(event, value) {
      const num = document.createElement('div');
      num.className = 'floating-number';
      num.textContent = '+' + this.formatNumber(value);
      num.style.left = (event?.clientX || window.innerWidth / 2) + 'px';
      num.style.top = (event?.clientY || window.innerHeight / 2) + 'px';
      document.body.appendChild(num);
      setTimeout(() => num.remove(), 1000);
    },
    showNotification(message, type = 'info', icon = 'ℹ️') {
      const id = Date.now();
      this.notifications.push({ id, message, type, icon });
      setTimeout(() => {
        this.notifications = this.notifications.filter(n => n.id !== id);
      }, 3000);
    },
    calculatePrestigePoints(tier) {
      return window.gameState?.calculatePrestigePoints(tier) || 0;
    },
    canPrestige(tier) {
      const points = this.calculatePrestigePoints(tier);
      return points > 0;
    },
    performPrestige(tier) {
      if (confirm('Are you sure you want to prestige? This will reset some progress.')) {
        const result = window.gameState?.performPrestige(tier);
        if (result?.success) {
          this.showNotification(`Prestige successful! Gained ${result.points} points.`, 'success', '🎉');
        }
      }
    },
    saveGame() {
      if (window.gameLoop) {
        window.gameLoop.forceSave();
        this.showNotification('Game saved!', 'success', '💾');
      }
    },
    exportSave() {
      if (window.gameLoop) {
        const saveString = window.gameLoop.exportSave();
        navigator.clipboard.writeText(saveString).then(() => {
          this.showNotification('Save copied to clipboard!', 'success', '📋');
        }).catch(() => {
          prompt('Copy this save data:', saveString);
        });
      }
    },
    importSave() {
      if (window.gameLoop && this.importString) {
        if (window.gameLoop.importSave(this.importString)) {
          this.showNotification('Save imported successfully!', 'success', '✓');
          this.showImportModal = false;
          this.importString = '';
        } else {
          this.showNotification('Failed to import save', 'error', '✗');
        }
      }
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

export default App;