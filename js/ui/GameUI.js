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
     * Initialize UI - use vanilla JS fallback for reliability
     */
    init() {
        // Create fallback UI directly (no Vue dependency)
        this.createFallbackUI();
        this.setupEventListeners();
    }

    /**
     * Create fallback vanilla JS UI if Vue fails
     */
    createFallbackUI() {
        // Immediately create the basic UI structure
        this.container.innerHTML = `
            <div class="game-ui-fallback">
                <div class="game-title">
                    <span class="title-text">MY AFK AI</span>
                    <span class="tagline">Build your AI empire</span>
                </div>
                <div class="hud">
                    <div class="resources-panel" id="resources-panel"></div>
                    <div class="stats-panel" id="stats-panel"></div>
                </div>
                <button class="shop-toggle" id="shop-toggle">⚙ SHOP</button>
                <div class="shop-overlay" id="shop-overlay" style="display:none;">
                    <div class="shop-panel">
                        <div class="shop-header">
                            <h2>⚙ AI Upgrades</h2>
                            <button class="close-btn" id="close-shop">✕</button>
                        </div>
                        <div class="upgrades-list" id="upgrades-list"></div>
                    </div>
                </div>
                <div class="notification" id="notification" style="display:none;"></div>
            </div>
        `;

        // Add fallback styles
        const style = document.createElement('style');
        style.id = 'fallback-styles';
        style.textContent = `
            .game-ui-fallback { font-family: 'Segoe UI', sans-serif; color: #fff; }
            .game-title { position: absolute; top: 60px; left: 50%; transform: translateX(-50%); text-align: center; }
            .game-title .title-text { font-family: 'Courier New', monospace; font-size: 28px; font-weight: bold; color: #00ffcc; text-shadow: 0 0 20px rgba(0,255,204,0.5); }
            .game-title .tagline { display: block; font-size: 12px; color: #9d4edd; margin-top: 4px; }
            .hud { position: absolute; top: 10px; left: 10px; right: 10px; display: flex; justify-content: space-between; }
            .resources-panel { display: flex; gap: 12px; background: rgba(0,0,0,0.7); padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(0,255,204,0.2); }
            .stats-panel { display: flex; gap: 12px; background: rgba(0,0,0,0.7); padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(0,255,204,0.2); }
            .shop-toggle { position: absolute; bottom: 20px; right: 20px; background: linear-gradient(135deg, #00ffcc 0%, #00aa88 100%); color: #0a0a1a; border: none; padding: 14px 28px; border-radius: 25px; cursor: pointer; font-size: 16px; font-weight: bold; }
            .shop-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 100; }
            .shop-panel { background: #0a0a1a; border-radius: 16px; padding: 24px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto; border: 1px solid rgba(0,255,204,0.3); }
            .shop-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
            .upgrade-item { display: flex; align-items: center; gap: 15px; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; margin-bottom: 10px; }
            .buy-btn { background: #00ffcc; border: none; color: #0a0a1a; padding: 10px 20px; border-radius: 20px; cursor: pointer; font-weight: bold; }
            .buy-btn:disabled { background: #555; color: #666; }
            .notification { position: fixed; top: 100px; left: 50%; transform: translateX(-50%); padding: 14px 28px; border-radius: 25px; font-weight: bold; z-index: 200; background: #00ffcc; color: #0a0a1a; }
            .close-btn { background: rgba(255,255,255,0.1); border: none; color: #fff; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; }
        `;
        document.head.appendChild(style);

        // Setup event handlers
        document.getElementById('shop-toggle').onclick = () => {
            document.getElementById('shop-overlay').style.display = 'flex';
        };
        document.getElementById('close-shop').onclick = () => {
            document.getElementById('shop-overlay').style.display = 'none';
        };
        
        // Start update loop for fallback UI
        this.startFallbackUpdateLoop();
        
        // Initialize state from game manager
        this.state.resources = this.gameManager.getResources();
        this.state.upgrades = this.gameManager.getUpgrades();
    }
    
    /**
     * Update fallback UI with current game state
     */
    startFallbackUpdateLoop() {
        const updateUI = () => {
            const resourcesPanel = document.getElementById('resources-panel');
            const statsPanel = document.getElementById('stats-panel');
            const upgradesList = document.getElementById('upgrades-list');
            
            if (this.gameManager) {
                const state = this.gameManager.getState();
                const resources = this.gameManager.getResources();
                const upgrades = this.gameManager.getUpgrades();
                
                // Update resources panel
                if (resourcesPanel) {
                    const symbols = { crypto: '₿', hash: '#', data: '◈', token: '◇' };
                    resourcesPanel.innerHTML = Object.entries(resources).map(([id, r]) => `
                        <div class="resource-item">
                            <span class="resource-icon" style="color: ${r.color}">${symbols[id] || '●'}</span>
                            <span class="resource-name">${r.name}</span>
                            <span class="resource-value">${this.formatNumber(r.amount)}</span>
                        </div>
                    `).join('');
                }
                
                // Update stats panel
                if (statsPanel) {
                    statsPanel.innerHTML = `
                        <span>⚡ ${state.totalClicks} clicks</span>
                        <span>⏱ ${this.formatTime(state.totalTimePlayed)}</span>
                    `;
                }
                
                // Update upgrades list
                if (upgradesList) {
                    upgradesList.innerHTML = Object.values(upgrades)
                        .filter(u => u.unlocked)
                        .map(u => `
                            <div class="upgrade-item">
                                <div class="upgrade-icon">📦</div>
                                <div class="upgrade-info">
                                    <h3>${u.name}</h3>
                                    <p>${u.description}</p>
                                </div>
                                <button class="buy-btn" ${(!u.canAfford || u.maxOwnedReached) ? 'disabled' : ''}
                                    onclick="window.__gameUI_purchase('${u.id}')">
                                    ${u.maxOwnedReached ? 'MAX' : this.formatNumber(u.currentCost)}
                                </button>
                            </div>
                        `).join('');
                }
                
                // Update state for event listeners
                this.state.resources = resources;
                this.state.upgrades = upgrades;
            }
        };
        
        // Make purchase function globally available
        window.__gameUI_purchase = (upgradeId) => {
            if (this.gameManager) {
                this.gameManager.purchaseUpgrade(upgradeId);
            }
        };
        
        // Initial update
        updateUI();
        
        // Update every 500ms
        setInterval(updateUI, 500);
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
            const notification = document.getElementById('notification');
            if (notification) {
                notification.textContent = 'Welcome back!';
                notification.style.display = 'block';
                setTimeout(() => { notification.style.display = 'none'; }, 2000);
            }
        });
    }

    /**
     * Format large numbers
     */
    formatNumber(num) {
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        return Math.floor(num).toString();
    }
    
    /**
     * Format time in HH:MM format
     */
    formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
}

export default GameUI;