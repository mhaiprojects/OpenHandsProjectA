/**
 * InventoryPanel Vue Component
 * Displays all items in inventory
 */
const InventoryPanel = {
  name: 'InventoryPanel',
  props: {
    items: { type: Array, required: true },
    inventory: { type: Object, required: true }
  },
  emits: ['use', 'equip'],
  template: `
    <div class="inventory-panel">
      <div class="inventory-tabs">
        <button 
          v-for="type in itemTypes" 
          :key="type.codeName"
          class="tab-btn"
          :class="{ active: activeTab === type.codeName }"
          @click="activeTab = type.codeName"
        >
          <span class="icon">{{ type.icon }}</span>
          {{ type.displayName }}
        </button>
      </div>
      
      <div class="inventory-grid">
        <div 
          v-for="item in getFilteredItems()" 
          :key="item.codeName"
          class="inventory-item"
          :class="'rarity-' + item.rarity"
          :title="item.displayName + '\\n' + item.description"
          @click="handleItemClick(item)"
        >
          <span class="icon">{{ item.icon }}</span>
          <span class="count" v-if="inventory[item.codeName] > 1">
            {{ inventory[item.codeName] }}
          </span>
        </div>
        
        <div v-if="getFilteredItems().length === 0" class="empty-state">
          <span class="icon">📦</span>
          <p>No items in this category</p>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      activeTab: 'all',
      itemTypes: []
    };
  },
  created() {
    this.loadItemTypes();
  },
  methods: {
    loadItemTypes() {
      if (window.gameConfig) {
        const types = window.gameConfig.configs.items?.itemTypes || [];
        this.itemTypes = [{ codeName: 'all', displayName: 'All', icon: '📦' }, ...types];
      }
    },
    getFilteredItems() {
      const items = this.items.filter(item => {
        if (this.activeTab === 'all') return true;
        return item.type === this.activeTab;
      });
      
      return items.filter(item => (this.inventory[item.codeName] || 0) > 0);
    },
    handleItemClick(item) {
      if (item.type === 'consumable') {
        this.$emit('use', item.codeName);
      } else if (item.equippable) {
        this.$emit('equip', item.codeName);
      }
    }
  }
};

export default InventoryPanel;