/**
 * GameUI - Vue 3 UI overlay for HUD and Shop
 * Uses Vue CDN with reactive components
 */
import { eventBus } from '../core/EventBus.js';

export class GameUI {
    constructor(gameManager, containerSelector) {
        this.gameManager = gameManager;
        this.container = document.querySelector(containerSelector);
        this.vue = null;
        this.state = {
            resources: {},
            upgrades: {},
            stats: {
                totalClicks: 0,
                totalTimePlayed: 0
            },
            shopOpen: false,
            notification: null,
            selectedCategory: 'all'
        };

        this.init();
    }

    /**
     * Initialize Vue app
     */
    async init() {
        try {
            // Use Vue global build for CDN compatibility
            const Vue = await import('https://unpkg.com/vue@3/dist/vue.global.js');
            this.Vue = Vue;
            this.createVueApp();
            this.setupEventListeners();
        } catch (err) {
            console.error('GameUI: Failed to load Vue:', err);
            this.createFallbackUI();
        }
    }

    /**
     * Create fallback vanilla JS UI if Vue fails
     */
    createFallbackUI() {
        this.container.innerHTML = `
            <div class="game-ui-fallback">
                <div class="hud">
                    <div class="resources-panel" id="resources-panel"></div>
                    <div class="stats-panel" id="stats-panel"></div>
                </div>
                <button class="shop-toggle" id="shop-toggle">☰ Shop</button>
                <div class="shop-overlay" id="shop-overlay" style="display:none;">
                    <div class="shop-panel">
                        <div class="shop-header">
                            <h2>Upgrades Shop</h2>
                            <button class="close-btn" id="close-shop">✕</button>
                        </div>
                        <div class="upgrades-list" id="upgrades-list"></div>
                    </div>
                </div>
                <div class="notification" id="notification" style="display:none;"></div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .game-ui-fallback { font-family: 'Segoe UI', sans-serif; color: #fff; }
            .hud { position: absolute; top: 10px; left: 10px; right: 10px; display: flex; justify-content: space-between; }
            .resources-panel { display: flex; gap: 20px; background: rgba(0,0,0,0.6); padding: 10px 20px; border-radius: 8px; }
            .resource-item { display: flex; align-items: center; gap: 8px; }
            .resource-icon { font-size: 18px; }
            .resource-value { font-weight: bold; min-width: 60px; }
            .stats-panel { display: flex; gap: 15px; background: rgba(0,0,0,0.6); padding: 10px 20px; border-radius: 8px; font-size: 12px; }
            .shop-toggle { position: absolute; bottom: 20px; right: 20px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer; font-size: 16px; }
            .shop-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; }
            .shop-panel { background: #1a1a2e; border-radius: 16px; padding: 24px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto; }
            .shop-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .upgrade-item { display: flex; align-items: center; gap: 15px; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; margin-bottom: 10px; }
            .upgrade-info { flex: 1; }
            .buy-btn { background: #0072ff; border: none; color: white; padding: 10px 20px; border-radius: 20px; cursor: pointer; }
            .buy-btn:disabled { background: #555; }
            .notification { position: fixed; top: 80px; left: 50%; transform: translateX(-50%); padding: 12px 24px; border-radius: 25px; font-weight: bold; z-index: 200; }
            .notification.success { background: #00b894; }
            .notification.error { background: #d63031; }
            .close-btn { background: rgba(255,255,255,0.1); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; }
        `;
        document.head.appendChild(style);

        // Event handlers
        document.getElementById('shop-toggle').onclick = () => {
            document.getElementById('shop-overlay').style.display = 'flex';
        };
        document.getElementById('close-shop').onclick = () => {
            document.getElementById('shop-overlay').style.display = 'none';
        };
    }

    /**
     * Create Vue application
     */
    createVueApp() {
        const template = `
            <div class="game-ui">
                <div class="hud">
                    <div class="resources-panel">
                        <div v-for="(resource, id) in state.resources" :key="id" class="resource-item">
                            <span class="resource-icon" :style="{ color: resource.color }">●</span>
                            <span class="resource-name">{{ resource.name }}</span>
                            <span class="resource-value">{{ formatNumber(resource.amount) }}</span>
                        </div>
                    </div>
                    <div class="stats-panel">
                        <span>Clicks: {{ state.stats.totalClicks }}</span>
                        <span>Time: {{ formatTime(state.stats.totalTimePlayed) }}</span>
                    </div>
                </div>

                <button class="shop-toggle" @click="state.shopOpen = !state.shopOpen">
                    {{ state.shopOpen ? '✕' : '☰' }} Shop
                </button>

                <div v-if="state.shopOpen" class="shop-overlay" @click.self="state.shopOpen = false">
                    <div class="shop-panel">
                        <div class="shop-header">
                            <h2>Upgrades Shop</h2>
                            <button class="close-btn" @click="state.shopOpen = false">✕</button>
                        </div>

                        <div class="category-filter">
                            <button :class="{ active: state.selectedCategory === 'all' }" @click="state.selectedCategory = 'all'">All</button>
                            <button :class="{ active: state.selectedCategory === 'production' }" @click="state.selectedCategory = 'production'">Production</button>
                            <button :class="{ active: state.selectedCategory === 'click' }" @click="state.selectedCategory = 'click'">Click</button>
                            <button :class="{ active: state.selectedCategory === 'automation' }" @click="state.selectedCategory = 'automation'">Automation</button>
                        </div>

                        <div class="upgrades-list">
                            <div v-for="upgrade in filteredUpgrades" :key="upgrade.id" class="upgrade-item"
                                 :class="{ disabled: !upgrade.canAfford || upgrade.maxOwnedReached }">
                                <div class="upgrade-icon">⬡</div>
                                <div class="upgrade-info">
                                    <h3>{{ upgrade.name }}</h3>
                                    <p>{{ upgrade.description }}</p>
                                    <span class="upgrade-owned">Owned: {{ upgrade.owned }}/{{ upgrade.maxOwned }}</span>
                                </div>
                                <button class="buy-btn"
                                        @click="purchaseUpgrade(upgrade.id)"
                                        :disabled="!upgrade.canAfford || upgrade.maxOwnedReached">
                                    {{ upgrade.maxOwnedReached ? 'MAX' : formatNumber(upgrade.currentCost) }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="state.notification" class="notification" :class="state.notification.type">
                    {{ state.notification.message }}
                </div>
            </div>
        `;

        const style = document.createElement('style');
        style.id = 'game-ui-styles';
        style.textContent = `
            .game-ui { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #ffffff; font-size: 14px; }
            .hud { position: absolute; top: 10px; left: 10px; right: 10px; display: flex; justify-content: space-between; pointer-events: auto; }
            .resources-panel { display: flex; gap: 20px; background: rgba(0, 0, 0, 0.6); padding: 10px 20px; border-radius: 8px; backdrop-filter: blur(5px); }
            .resource-item { display: flex; align-items: center; gap: 8px; }
            .resource-icon { font-size: 18px; }
            .resource-name { color: #aaa; font-size: 12px; }
            .resource-value { font-weight: bold; font-size: 16px; min-width: 60px; text-align: right; }
            .stats-panel { display: flex; gap: 15px; background: rgba(0, 0, 0, 0.6); padding: 10px 20px; border-radius: 8px; backdrop-filter: blur(5px); font-size: 12px; }
            .shop-toggle { position: absolute; bottom: 20px; right: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer; font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: transform 0.2s; pointer-events: auto; }
            .shop-toggle:hover { transform: scale(1.05); }
            .shop-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; align-items: center; z-index: 100; pointer-events: auto; }
            .shop-panel { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 24px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); }
            .shop-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
            .shop-header h2 { margin: 0; }
            .close-btn { background: rgba(255, 255, 255, 0.1); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; }
            .category-filter { display: flex; gap: 10px; margin-bottom: 20px; }
            .category-filter button { background: rgba(255, 255, 255, 0.1); border: none; color: #fff; padding: 8px 16px; border-radius: 20px; cursor: pointer; }
            .category-filter button.active { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .upgrades-list { display: flex; flex-direction: column; gap: 12px; }
            .upgrade-item { display: flex; align-items: center; gap: 15px; background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 12px; }
            .upgrade-item.disabled { opacity: 0.5; }
            .upgrade-icon { font-size: 32px; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
            .upgrade-info { flex: 1; }
            .upgrade-info h3 { margin: 0 0 4px 0; font-size: 16px; }
            .upgrade-info p { margin: 0 0 4px 0; color: #aaa; font-size: 12px; }
            .upgrade-owned { font-size: 11px; color: #666; }
            .buy-btn { background: linear-gradient(135deg, #00c6ff 0%, #0072ff 100%); border: none; color: white; padding: 10px 20px; border-radius: 20px; cursor: pointer; font-weight: bold; min-width: 80px; }
            .buy-btn:disabled { background: #555; cursor: not-allowed; }
            .notification { position: fixed; top: 80px; left: 50%; transform: translateX(-50%); padding: 12px 24px; border-radius: 25px; font-weight: bold; z-index: 200; animation: slideDown 0.3s ease; }
            .notification.success { background: linear-gradient(135deg, #00b894 0%, #00cec9 100%); }
            .notification.error { background: linear-gradient(135deg, #d63031 0%, #e17055 100%); }
            @keyframes slideDown { from { opacity: 0; transform: translateX(-50%) translateY(-20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        `;
        document.head.appendChild(style);

        const component = {
            data() {
                return { state: this._state, _state: null };
            },
            created() {
                this._state = window.__gameUIState;
            },
            methods: {
                formatNumber(num) {
                    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
                    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
                    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
                    return Math.floor(num).toString();
                },
                formatTime(seconds) {
                    const hrs = Math.floor(seconds / 3600);
                    const mins = Math.floor((seconds % 3600) / 60);
                    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
                },
                purchaseUpgrade(upgradeId) {
                    const success = this._state.gameManager.purchaseUpgrade(upgradeId);
                    this._state.notification = { message: success ? 'Purchased!' : 'Not enough!', type: success ? 'success' : 'error' };
                    setTimeout(() => { this._state.notification = null; }, 1500);
                }
            },
            computed: {
                filteredUpgrades() {
                    const upgrades = Object.values(this._state.upgrades);
                    const cat = this._state.selectedCategory;
                    return upgrades.filter(u => u.unlocked && (cat === 'all' || u.category === cat));
                }
            },
            template
        };

        window.__gameUIState = this.state;
        window.__gameUIGameManager = this.gameManager;
        component.data._state = this.state;
        component.data._state.gameManager = this.gameManager;

        this.app = this.Vue.createApp(component);
        this.app.mount(this.container);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        eventBus.on('game:state_update', (data) => {
            Object.assign(this.state.resources, data.resources);
            Object.assign(this.state.upgrades, data.upgrades);
            Object.assign(this.state.stats, data.stats);
        });

        eventBus.on('game:offline_progress', () => {
            this.state.notification = { message: 'Welcome back!', type: 'success' };
            setTimeout(() => { this.state.notification = null; }, 2000);
        });
    }

    /**
     * Format large numbers
     */
    formatNumber(num) {
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        return Math.floor(num).toString();
    }
}

export default GameUI;