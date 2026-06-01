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
                <!-- Game Title -->
                <div class="game-title">
                    <span class="title-text">MY AFK AI</span>
                    <span class="tagline">Build your AI empire</span>
                </div>

                <!-- HUD -->
                <div class="hud">
                    <div class="resources-panel">
                        <div v-for="(resource, id) in state.resources" :key="id" class="resource-item">
                            <span class="resource-icon" :style="{ color: resource.color }">
                                {{ getResourceSymbol(id) }}
                            </span>
                            <div class="resource-info">
                                <span class="resource-name">{{ resource.name }}</span>
                                <span class="resource-rate">{{ formatRate(getResourceRate(id)) }}/s</span>
                            </div>
                            <span class="resource-value">{{ formatNumber(resource.amount) }}</span>
                        </div>
                    </div>
                    <div class="stats-panel">
                        <span class="stat">⚡ {{ state.stats.totalClicks }} clicks</span>
                        <span class="stat">⏱ {{ formatTime(state.stats.totalTimePlayed) }}</span>
                    </div>
                </div>

                <button class="shop-toggle" @click="state.shopOpen = !state.shopOpen">
                    {{ state.shopOpen ? '✕' : '⚙' }} SHOP
                </button>

                <div v-if="state.shopOpen" class="shop-overlay" @click.self="state.shopOpen = false">
                    <div class="shop-panel">
                        <div class="shop-header">
                            <h2>⚙ AI Upgrades</h2>
                            <button class="close-btn" @click="state.shopOpen = false">✕</button>
                        </div>

                        <div class="category-filter">
                            <button :class="{ active: state.selectedCategory === 'all' }" @click="state.selectedCategory = 'all'">📦 All</button>
                            <button :class="{ active: state.selectedCategory === 'system' }" @click="state.selectedCategory = 'system'">🖥 Systems</button>
                            <button :class="{ active: state.selectedCategory === 'model' }" @click="state.selectedCategory = 'model'">🤖 AI Models</button>
                            <button :class="{ active: state.selectedCategory === 'extension' }" @click="state.selectedCategory = 'extension'">🔌 Extensions</button>
                            <button :class="{ active: state.selectedCategory === 'automation' }" @click="state.selectedCategory = 'automation'">⚡ Auto</button>
                        </div>

                        <div class="upgrades-list">
                            <div v-for="upgrade in filteredUpgrades" :key="upgrade.id" class="upgrade-item"
                                 :class="{ 
                                     disabled: !upgrade.canAfford || upgrade.maxOwnedReached,
                                     affordable: upgrade.canAfford && !upgrade.maxOwnedReached
                                 }"
                                 @mouseenter="state.hoveredUpgrade = upgrade.id"
                                 @mouseleave="state.hoveredUpgrade = null">
                                <div class="upgrade-icon" :style="{ background: getCategoryColor(upgrade.category) }">
                                    {{ getUpgradeSymbol(upgrade) }}
                                </div>
                                <div class="upgrade-info">
                                    <h3>{{ upgrade.name }}</h3>
                                    <p>{{ upgrade.description }}</p>
                                    <div class="upgrade-meta">
                                        <span class="upgrade-owned">Owned: {{ upgrade.owned }}/{{ upgrade.maxOwned }}</span>
                                        <span class="upgrade-effect">{{ getEffectDescription(upgrade) }}</span>
                                    </div>
                                </div>
                                <button class="buy-btn"
                                        @click="purchaseUpgrade(upgrade.id)"
                                        :disabled="!upgrade.canAfford || upgrade.maxOwnedReached">
                                    {{ upgrade.maxOwnedReached ? '✓ MAX' : formatNumber(upgrade.currentCost) }}
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
            
            .game-title {
                position: absolute;
                top: 60px;
                left: 50%;
                transform: translateX(-50%);
                text-align: center;
                pointer-events: none;
            }
            .game-title .title-text {
                font-family: 'Courier New', monospace;
                font-size: 28px;
                font-weight: bold;
                color: #00ffcc;
                text-shadow: 0 0 20px rgba(0,255,204,0.5);
                letter-spacing: 4px;
            }
            .game-title .tagline {
                display: block;
                font-size: 12px;
                color: #9d4edd;
                margin-top: 4px;
            }
            
            .hud { position: absolute; top: 10px; left: 10px; right: 10px; display: flex; justify-content: space-between; pointer-events: auto; }
            .resources-panel { display: flex; gap: 12px; background: rgba(0, 0, 0, 0.7); padding: 12px 16px; border-radius: 12px; backdrop-filter: blur(10px); border: 1px solid rgba(0,255,204,0.2); }
            .resource-item { display: flex; align-items: center; gap: 8px; padding: 4px 8px; border-radius: 8px; transition: background 0.2s; }
            .resource-item:hover { background: rgba(255,255,255,0.05); }
            .resource-icon { font-size: 24px; width: 32px; text-align: center; }
            .resource-info { display: flex; flex-direction: column; }
            .resource-name { font-size: 11px; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px; }
            .resource-rate { font-size: 10px; color: #666; }
            .resource-value { font-family: 'Courier New', monospace; font-weight: bold; font-size: 18px; min-width: 80px; text-align: right; color: #fff; }
            
            .stats-panel { display: flex; gap: 12px; background: rgba(0, 0, 0, 0.7); padding: 12px 16px; border-radius: 12px; backdrop-filter: blur(10px); border: 1px solid rgba(0,255,204,0.2); }
            .stat { font-size: 12px; color: #00ffcc; }
            
            .shop-toggle { position: absolute; bottom: 20px; right: 20px; background: linear-gradient(135deg, #00ffcc 0%, #00aa88 100%); color: #0a0a1a; border: none; padding: 14px 28px; border-radius: 25px; cursor: pointer; font-size: 16px; font-weight: bold; box-shadow: 0 4px 20px rgba(0,255,204,0.4); transition: all 0.2s; pointer-events: auto; letter-spacing: 1px; }
            .shop-toggle:hover { transform: scale(1.05); box-shadow: 0 6px 25px rgba(0,255,204,0.6); }
            
            .shop-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.85); display: flex; justify-content: center; align-items: center; z-index: 100; pointer-events: auto; backdrop-filter: blur(5px); }
            .shop-panel { background: linear-gradient(135deg, #0a0a1a 0%, #12122a 100%); border-radius: 20px; padding: 28px; width: 92%; max-width: 650px; max-height: 85vh; overflow-y: auto; box-shadow: 0 0 60px rgba(0,255,204,0.2); border: 1px solid rgba(0,255,204,0.3); }
            .shop-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); }
            .shop-header h2 { margin: 0; font-family: 'Courier New', monospace; color: #00ffcc; }
            .close-btn { background: rgba(255, 255, 255, 0.1); border: none; color: #fff; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 18px; transition: background 0.2s; }
            .close-btn:hover { background: rgba(255, 255, 255, 0.2); }
            
            .category-filter { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
            .category-filter button { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255,255,255,0.1); color: #aaa; padding: 10px 16px; border-radius: 20px; cursor: pointer; transition: all 0.2s; font-size: 13px; }
            .category-filter button:hover { background: rgba(255,255,255,0.1); color: #fff; }
            .category-filter button.active { background: linear-gradient(135deg, #00ffcc 0%, #00aa88 100%); color: #0a0a1a; border-color: transparent; font-weight: bold; }
            
            .upgrades-list { display: flex; flex-direction: column; gap: 12px; }
            .upgrade-item { display: flex; align-items: center; gap: 16px; background: rgba(255, 255, 255, 0.03); padding: 16px; border-radius: 14px; transition: all 0.2s; border: 1px solid transparent; }
            .upgrade-item:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(0,255,204,0.2); }
            .upgrade-item.affordable { border-color: rgba(0,255,204,0.3); }
            .upgrade-item.disabled { opacity: 0.5; }
            
            .upgrade-icon { font-size: 28px; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.1); border-radius: 12px; flex-shrink: 0; }
            
            .upgrade-info { flex: 1; min-width: 0; }
            .upgrade-info h3 { margin: 0 0 4px 0; font-size: 16px; font-weight: bold; }
            .upgrade-info p { margin: 0 0 8px 0; color: #888; font-size: 12px; }
            .upgrade-meta { display: flex; gap: 12px; font-size: 11px; }
            .upgrade-owned { color: #9d4edd; }
            .upgrade-effect { color: #00ffcc; font-weight: bold; }
            
            .buy-btn { background: linear-gradient(135deg, #00ffcc 0%, #00aa88 100%); border: none; color: #0a0a1a; padding: 12px 20px; border-radius: 20px; cursor: pointer; font-weight: bold; min-width: 90px; font-size: 14px; transition: all 0.2s; }
            .buy-btn:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 4px 15px rgba(0,255,204,0.4); }
            .buy-btn:disabled { background: #333; color: #666; cursor: not-allowed; }
            
            .notification { position: fixed; top: 100px; left: 50%; transform: translateX(-50%); padding: 14px 28px; border-radius: 25px; font-weight: bold; z-index: 200; animation: slideDown 0.3s ease; }
            .notification.success { background: linear-gradient(135deg, #00ffcc 0%, #00aa88 100%); color: #0a0a1a; }
            .notification.error { background: linear-gradient(135deg, #ff6b6b 0%, #cc4444 100%); }
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
                    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
                    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
                    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
                    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
                    return num.toFixed(num < 10 ? 1 : 0);
                },
                formatRate(rate) {
                    if (rate >= 1e6) return (rate / 1e6).toFixed(1) + 'M';
                    if (rate >= 1e3) return (rate / 1e3).toFixed(1) + 'K';
                    return rate.toFixed(2);
                },
                formatTime(seconds) {
                    const hrs = Math.floor(seconds / 3600);
                    const mins = Math.floor((seconds % 3600) / 60);
                    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
                },
                getResourceSymbol(id) {
                    const symbols = { crypto: '₿', hash: '#', data: '◈', token: '◇' };
                    return symbols[id] || '●';
                },
                getResourceRate(id) {
                    const resource = this._state.resources[id];
                    if (!resource) return 0;
                    return resource.baseRate * resource.rateMultiplier * this._state.gameManager.globalRateMultiplier;
                },
                getUpgradeSymbol(upgrade) {
                    const symbols = { 
                        system: '🖥', model: '🤖', extension: '🔌', 
                        automation: '⚡', cpu: '⚙', gpu: '🎮', 
                        server: '🗄', brain: '🧠', ai: '🤖',
                        gemini: '✨', pickaxe: '⛏', robot: '🤖',
                        neural: '🔗', quantum: '⚛', network: '🌐',
                        token: '◇'
                    };
                    return symbols[upgrade.icon] || '📦';
                },
                getCategoryColor(category) {
                    const colors = { 
                        system: 'rgba(0,204,255,0.2)', 
                        model: 'rgba(157,78,221,0.2)', 
                        extension: 'rgba(255,215,0,0.2)', 
                        automation: 'rgba(0,255,204,0.2)' 
                    };
                    return colors[category] || 'rgba(255,255,255,0.1)';
                },
                getEffectDescription(upgrade) {
                    const effect = upgrade.effect;
                    if (effect.type === 'rate_multiplier') return `+${((effect.value - 1) * 100).toFixed(0)}% ${effect.resource}`;
                    if (effect.type === 'generate') return `+${effect.value} ${effect.resource}/s`;
                    if (effect.type === 'click') return `+${effect.value} click/s`;
                    if (effect.type === 'global_rate_multiplier') return `+${((effect.value - 1) * 100).toFixed(0)}% all`;
                    return '';
                },
                purchaseUpgrade(upgradeId) {
                    const success = this._state.gameManager.purchaseUpgrade(upgradeId);
                    this._state.notification = { message: success ? '✓ Purchased!' : '✗ Not enough!', type: success ? 'success' : 'error' };
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