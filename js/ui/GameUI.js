/**
 * GameUI - UI overlay for HUD and Shop
 * Mobile-first design with tabbed panels
 */
import { eventBus } from '../core/EventBus.js';

export class GameUI {
    constructor(gameManager, containerSelector) {
        this.gameManager = gameManager;
        this.container = document.querySelector(containerSelector);
        this.currentTab = 'shop';
        this.state = {
            resources: {},
            upgrades: {},
            stats: {
                totalClicks: 0,
                totalTimePlayed: 0
            },
            notification: null
        };

        this.init();
    }

    /**
     * Initialize UI
     */
    init() {
        this.createUI();
        this.setupEventListeners();
    }

    /**
     * Create mobile-first UI with tabbed panels
     */
    createUI() {
        this.container.innerHTML = `
            <div class="game-ui">
                <div class="game-title">
                    <span class="title-text">MY AFK AI</span>
                    <span class="tagline">Build your AI empire</span>
                </div>
                <div class="hud">
                    <div class="resources-panel" id="resources-panel"></div>
                    <div class="stats-panel" id="stats-panel"></div>
                </div>
                
                <!-- Tab Bar (left side) -->
                <div class="tab-bar" id="tab-bar">
                    <button class="tab-btn active" data-tab="shop">⚙</button>
                    <button class="tab-btn" data-tab="achievements">🏆</button>
                    <button class="tab-btn" data-tab="stats">📊</button>
                    <button class="tab-btn" data-tab="settings">⚙️</button>
                </div>
                
                <!-- Panel Container -->
                <div class="panel-container" id="panel-container">
                    <!-- SHOP Panel -->
                    <div class="panel active" id="panel-shop">
                        <div class="panel-header">
                            <h2>⚙ AI Upgrades</h2>
                        </div>
                        <div class="panel-content" id="shop-content">
                            <div class="upgrades-list" id="upgrades-list"></div>
                        </div>
                    </div>
                    
                    <!-- ACHIEVEMENTS Panel -->
                    <div class="panel" id="panel-achievements">
                        <div class="panel-header">
                            <h2>🏆 Achievements</h2>
                        </div>
                        <div class="panel-content">
                            <div class="placeholder-content">
                                <p>Achievements coming soon!</p>
                                <p class="hint">Complete milestones to unlock achievements</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- STATS Panel -->
                    <div class="panel" id="panel-stats">
                        <div class="panel-header">
                            <h2>📊 Statistics</h2>
                        </div>
                        <div class="panel-content" id="stats-content">
                            <div class="stats-list" id="stats-list"></div>
                        </div>
                    </div>
                    
                    <!-- SETTINGS Panel -->
                    <div class="panel" id="panel-settings">
                        <div class="panel-header">
                            <h2>⚙️ Settings</h2>
                        </div>
                        <div class="panel-content">
                            <div class="settings-list">
                                <button class="settings-btn" id="save-game-btn">💾 Save Game</button>
                                <button class="settings-btn" id="reset-game-btn">🗑️ Reset Progress</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Mobile Toggle Button -->
                <button class="mobile-toggle" id="mobile-toggle">☰</button>
                
                <!-- Notification -->
                <div class="notification" id="notification" style="display:none;"></div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.id = 'game-ui-styles';
        style.textContent = `
            .game-ui { 
                font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; 
                color: #fff; 
                height: 100%; 
                position: relative;
            }
            
            /* Game Title */
            .game-title { 
                position: absolute; 
                top: 60px; 
                left: 50%; 
                transform: translateX(-50%); 
                text-align: center; 
                z-index: 5;
            }
            .game-title .title-text { 
                font-family: 'Courier New', monospace; 
                font-size: 24px; 
                font-weight: bold; 
                color: #00ffcc; 
                text-shadow: 0 0 20px rgba(0,255,204,0.5); 
            }
            .game-title .tagline { 
                display: block; 
                font-size: 11px; 
                color: #9d4edd; 
                margin-top: 4px; 
            }
            
            /* HUD */
            .hud { 
                position: absolute; 
                top: 10px; 
                left: 10px; 
                right: 10px; 
                display: flex; 
                justify-content: space-between; 
                gap: 8px;
                z-index: 5;
            }
            .resources-panel { 
                display: flex; 
                gap: 8px; 
                background: rgba(0,0,0,0.75); 
                padding: 8px 12px; 
                border-radius: 10px; 
                border: 1px solid rgba(0,255,204,0.2); 
                flex-wrap: wrap;
            }
            .stats-panel { 
                display: flex; 
                gap: 8px; 
                background: rgba(0,0,0,0.75); 
                padding: 8px 12px; 
                border-radius: 10px; 
                border: 1px solid rgba(0,255,204,0.2); 
            }
            
            /* Tab Bar - Left side, vertical */
            .tab-bar {
                position: fixed;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                display: flex;
                flex-direction: column;
                gap: 8px;
                padding: 12px 8px;
                background: rgba(10, 10, 26, 0.95);
                border-radius: 0 16px 16px 0;
                border: 1px solid rgba(0,255,204,0.2);
                border-left: none;
                z-index: 20;
                transition: transform 0.3s ease;
            }
            .tab-btn {
                width: 48px;
                height: 48px;
                border: none;
                background: rgba(255,255,255,0.05);
                color: #888;
                border-radius: 12px;
                font-size: 20px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .tab-btn:hover {
                background: rgba(0,255,204,0.1);
                color: #00ffcc;
            }
            .tab-btn.active {
                background: linear-gradient(135deg, #00ffcc 0%, #00aa88 100%);
                color: #0a0a1a;
            }
            
            /* Panel Container */
            .panel-container {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(10, 10, 26, 0.95);
                z-index: 15;
                display: none;
                flex-direction: column;
            }
            .panel-container.open {
                display: flex;
            }
            
            /* Panels */
            .panel {
                display: none;
                flex-direction: column;
                height: 100%;
            }
            .panel.active {
                display: flex;
            }
            .panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                background: rgba(0,0,0,0.5);
                border-bottom: 1px solid rgba(0,255,204,0.1);
                flex-shrink: 0;
            }
            .panel-header h2 {
                font-size: 18px;
                margin: 0;
                color: #00ffcc;
            }
            .panel-header .close-panel {
                background: rgba(255,255,255,0.1);
                border: none;
                color: #fff;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 18px;
            }
            .panel-content {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                -webkit-overflow-scrolling: touch;
            }
            
            /* Upgrades Grid */
            .upgrades-list { 
                display: grid; 
                grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); 
                gap: 12px; 
            }
            .upgrade-item { 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                gap: 8px; 
                background: rgba(255,255,255,0.05); 
                padding: 16px 12px; 
                border-radius: 14px; 
                border: 1px solid rgba(0,255,204,0.1);
                transition: all 0.2s ease;
            }
            .upgrade-item:hover {
                background: rgba(0,255,204,0.08);
                border-color: rgba(0,255,204,0.25);
                transform: translateY(-2px);
            }
            .upgrade-icon { font-size: 28px; }
            .upgrade-info { text-align: center; width: 100%; }
            .upgrade-info h3 { font-size: 13px; margin: 0 0 4px 0; color: #00ffcc; }
            .upgrade-info p { font-size: 10px; margin: 0; color: #777; line-height: 1.3; }
            .upgrade-cost { font-size: 10px; color: #00aa88; margin-top: 2px; }
            .buy-btn { 
                background: linear-gradient(135deg, #00ffcc 0%, #00aa88 100%); 
                border: none; 
                color: #0a0a1a; 
                padding: 10px 16px; 
                border-radius: 18px; 
                cursor: pointer; 
                font-weight: bold; 
                font-size: 12px; 
                width: 100%;
                touch-action: manipulation;
            }
            .buy-btn:disabled { background: #444; color: #666; cursor: not-allowed; }
            .buy-btn:not(:disabled):active { transform: scale(0.95); }
            
            /* Placeholder Content */
            .placeholder-content {
                text-align: center;
                padding: 40px 20px;
                color: #666;
            }
            .placeholder-content p { margin: 8px 0; }
            .placeholder-content .hint { font-size: 12px; color: #555; }
            
            /* Stats List */
            .stats-list { display: flex; flex-direction: column; gap: 12px; }
            .stat-item {
                background: rgba(255,255,255,0.05);
                padding: 16px;
                border-radius: 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .stat-item .label { color: #888; font-size: 14px; }
            .stat-item .value { color: #00ffcc; font-size: 16px; font-weight: bold; }
            
            /* Settings List */
            .settings-list { display: flex; flex-direction: column; gap: 12px; }
            .settings-btn {
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(0,255,204,0.2);
                color: #fff;
                padding: 16px 20px;
                border-radius: 12px;
                font-size: 14px;
                cursor: pointer;
                text-align: left;
                transition: all 0.2s ease;
            }
            .settings-btn:hover { background: rgba(0,255,204,0.1); }
            .settings-btn:active { transform: scale(0.98); }
            
            /* Mobile Toggle Button */
            .mobile-toggle {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 56px;
                height: 56px;
                background: linear-gradient(135deg, #00ffcc 0%, #00aa88 100%);
                color: #0a0a1a;
                border: none;
                border-radius: 50%;
                cursor: pointer;
                font-size: 24px;
                z-index: 10;
                box-shadow: 0 4px 20px rgba(0,255,204,0.4);
                touch-action: manipulation;
            }
            
            /* Notification */
            .notification { 
                position: fixed; 
                top: 100px; 
                left: 50%; 
                transform: translateX(-50%); 
                padding: 14px 28px; 
                border-radius: 25px; 
                font-weight: bold; 
                z-index: 200; 
                background: #00ffcc; 
                color: #0a0a1a; 
            }
            
            /* Mobile Responsive */
            @media (min-width: 768px) {
                .game-title .title-text { font-size: 28px; }
                .upgrades-list { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
                .tab-btn { width: 52px; height: 52px; font-size: 22px; }
            }
            
            /* Resource items */
            .resource-item {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 12px;
            }
            .resource-icon { font-size: 14px; }
            .resource-value { font-weight: bold; color: #00ffcc; }
            
            /* Scrollbar styling */
            .panel-content::-webkit-scrollbar { width: 6px; }
            .panel-content::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
            .panel-content::-webkit-scrollbar-thumb { background: rgba(0,255,204,0.3); border-radius: 3px; }
        `;
        document.head.appendChild(style);

        // Setup tab switching
        this.setupTabs();
        
        // Setup button handlers
        this.setupButtonHandlers();
        
        // Start update loop
        this.startUpdateLoop();
        
        // Initialize state
        this.state.resources = this.gameManager.getResources();
        this.state.upgrades = this.gameManager.getUpgrades();
    }

    /**
     * Setup tab switching
     */
    setupTabs() {
        const tabBar = document.getElementById('tab-bar');
        const panelContainer = document.getElementById('panel-container');
        const mobileToggle = document.getElementById('mobile-toggle');
        
        // Tab button clicks
        tabBar.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // Mobile toggle
        mobileToggle.addEventListener('click', () => {
            panelContainer.classList.toggle('open');
        });
        
        // Close panel
        panelContainer.querySelectorAll('.close-panel').forEach(btn => {
            btn.addEventListener('click', () => {
                panelContainer.classList.remove('open');
            });
        });
    }

    /**
     * Switch active tab
     */
    switchTab(tab) {
        this.currentTab = tab;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        // Update panels
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `panel-${tab}`);
        });
        
        // Open panel container on mobile
        document.getElementById('panel-container').classList.add('open');
    }

    /**
     * Setup button handlers
     */
    setupButtonHandlers() {
        window.__gameUI_purchase = (upgradeId) => {
            if (this.gameManager) {
                this.gameManager.purchaseUpgrade(upgradeId);
            }
        };
        
        document.getElementById('save-game-btn')?.addEventListener('click', () => {
            if (this.gameManager) {
                this.gameManager.save();
                this.showNotification('Game saved!');
            }
        });
        
        document.getElementById('reset-game-btn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all progress?')) {
                localStorage.clear();
                location.reload();
            }
        });
    }

    /**
     * Start update loop
     */
    startUpdateLoop() {
        const updateUI = () => {
            if (!this.gameManager) return;
            
            const state = this.gameManager.getState();
            const resources = this.gameManager.getResources();
            const upgrades = this.gameManager.getUpgrades();
            
            // Update resources
            const resourcesPanel = document.getElementById('resources-panel');
            if (resourcesPanel) {
                const symbols = { crypto: '₿', hash: '#', data: '◈', token: '◇' };
                resourcesPanel.innerHTML = Object.entries(resources).map(([id, r]) => `
                    <div class="resource-item">
                        <span class="resource-icon" style="color: ${r.color}">${symbols[id] || '●'}</span>
                        <span class="resource-value">${this.formatNumber(r.amount)}</span>
                    </div>
                `).join('');
            }
            
            // Update stats
            const statsPanel = document.getElementById('stats-panel');
            if (statsPanel) {
                statsPanel.innerHTML = `
                    <span>⚡ ${this.formatNumber(state.totalClicks)}</span>
                    <span>⏱ ${this.formatTime(state.totalTimePlayed)}</span>
                `;
            }
            
            // Update upgrades grid
            const upgradesList = document.getElementById('upgrades-list');
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
                            <div class="upgrade-cost">${u.owned}/${u.maxOwned} owned</div>
                            <button class="buy-btn" ${(!u.canAfford || u.maxOwnedReached) ? 'disabled' : ''}
                                onclick="window.__gameUI_purchase('${u.id}')">
                                ${u.maxOwnedReached ? 'MAX' : this.formatNumber(u.currentCost) + ' ₿'}
                            </button>
                        </div>
                    `).join('');
            }
            
            // Update stats panel
            const statsList = document.getElementById('stats-list');
            if (statsList) {
                statsList.innerHTML = `
                    <div class="stat-item">
                        <span class="label">Total Clicks</span>
                        <span class="value">${this.formatNumber(state.totalClicks)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="label">Time Played</span>
                        <span class="value">${this.formatTime(state.totalTimePlayed)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="label">Total Earned</span>
                        <span class="value">₿${this.formatNumber(resources.crypto?.totalEarned || 0)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="label">Upgrades Owned</span>
                        <span class="value">${Object.values(upgrades).reduce((sum, u) => sum + u.owned, 0)}</span>
                    </div>
                `;
            }
            
            this.state.resources = resources;
            this.state.upgrades = upgrades;
        };
        
        updateUI();
        setInterval(updateUI, 500);
    }

    /**
     * Show notification
     */
    showNotification(message) {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.textContent = message;
            notification.style.display = 'block';
            setTimeout(() => { notification.style.display = 'none'; }, 2000);
        }
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
            this.showNotification('Welcome back!');
        });
    }

    /**
     * Format large numbers
     */
    formatNumber(num) {
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
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