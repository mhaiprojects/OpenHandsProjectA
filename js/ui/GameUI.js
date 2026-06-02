/**
 * GameUI - Vue 3 application for game UI
 * Pure DOM rendering - no Canvas, no Phaser
 */
import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import { GameState } from '../game/GameState.js';
import { GameLoop } from '../game/GameLoop.js';
import { RandomEvents } from '../game/RandomEvents.js';
import { SkillsSystem } from '../game/SkillsSystem.js';
import { eventBus } from '../core/EventBus.js';

export function createGameUI(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('GameUI: Container not found:', containerId);
        return null;
    }

    const app = createApp({
        data() {
            return {
                // Game state
                resources: {},
                upgrades: {},
                achievements: {},
                stats: { totalClicks: 0, totalTimePlayed: 0, prestigeLevel: 0 },
                rates: { crypto: 0, compute: 0, storage: 0, credits: 0 },
                clickPower: 1,
                
                // UI state
                activePanel: 'home',
                navExpanded: false,
                shopFilter: 'all',
                detailsModalOpen: false,
                notification: null,
                
                // Modal state
                activeModal: null, // 'shop', 'prestige', 'achievements', 'settings', 'stats'
                
                // Floating text effects
                floatingTexts: [],
                
                // Random boosts
                currentBoost: null,
                activeBoosts: [],
                
                // Skills system
                skills: [],
                activeEffects: [],
                
                // Game instances
                gameState: null,
                gameLoop: null,
                randomEvents: null,
                skillsSystem: null
            };
        },
        
        computed: {
            filteredUpgrades() {
                const all = Object.values(this.upgrades);
                if (this.shopFilter === 'all') return all;
                return all.filter(u => u.category === this.shopFilter);
            },
            
            sortedAchievements() {
                return Object.values(this.achievements).sort((a, b) => {
                    if (a.unlocked === b.unlocked) return 0;
                    return a.unlocked ? -1 : 1;
                });
            },
            
            totalIncome() {
                return this.rates.crypto || 0;
            }
        },
        
        methods: {
            // Formatting
            formatNumber(num) {
                if (!num || isNaN(num)) return '0';
                if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
                if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
                if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
                if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
                return Math.floor(num).toString();
            },
            
            formatTime(seconds) {
                const hrs = Math.floor(seconds / 3600);
                const mins = Math.floor((seconds % 3600) / 60);
                const secs = seconds % 60;
                return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            },
            
            // Navigation - Opens modals instead of panels
            openModal(modalName) {
                this.activeModal = modalName;
                this.navExpanded = false; // Close nav after selecting
                console.log('Modal opened:', modalName);
            },
            
            closeModal() {
                this.activeModal = null;
            },
            
            switchPanel(panel) {
                this.activePanel = panel;
                eventBus.emit('ui:nav_change', panel);
            },
            
            toggleNav() {
                this.navExpanded = !this.navExpanded;
            },
            
            // CPU Core click
            handleCoreClick(event) {
                const reward = this.gameState.handleClick();
                
                // Create floating text
                this.createFloatingText(event, `+${this.formatNumber(reward)}`);
            },
            
            createFloatingText(event, text) {
                const rect = event.currentTarget.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                
                const id = Date.now() + Math.random();
                this.floatingTexts.push({ id, x, y, text });
                
                setTimeout(() => {
                    this.floatingTexts = this.floatingTexts.filter(t => t.id !== id);
                }, 800);
            },
            
            // Shop
            purchaseUpgrade(upgradeId) {
                const success = this.gameState.purchaseUpgrade(upgradeId);
                if (success) {
                    this.showNotification('Purchased!');
                }
            },
            
            setShopFilter(filter) {
                this.shopFilter = filter;
            },
            
            // Prestige
            performPrestige() {
                if (this.gameState.performPrestige()) {
                    this.showNotification('Prestige performed!');
                }
            },
            
            canPrestige() {
                return this.gameState?.canPrestige() || false;
            },
            
            // Modal - Stats Panel
            openStatsModal() {
                this.activePanel = 'stats';
            },
            
            closeStatsModal() {
                this.activePanel = 'home';
            },
            
            // Modal - Stats Modal
            openDetailsModal() {
                this.detailsModalOpen = true;
            },
            
            closeDetailsModal() {
                this.detailsModalOpen = false;
            },
            
            // Collect boost if available
            collectBoost() {
                if (this.currentBoost && this.randomEvents) {
                    const boost = this.randomEvents.collectBoost();
                    if (boost) {
                        this.showNotification(`Collected: ${boost.name}!`);
                    }
                }
            },
            
            // Skills
            useSkill(skillId) {
                if (this.skillsSystem) {
                    this.skillsSystem.useSkill(skillId);
                }
            },
            
            formatCooldown(seconds) {
                if (seconds <= 0) return '';
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return `${mins}:${secs.toString().padStart(2, '0')}`;
            },
            
            // Notifications
            showNotification(msg) {
                this.notification = msg;
                setTimeout(() => { this.notification = null; }, 2000);
            },
            
            // Save/Reset
            saveGame() {
                this.gameState?.save();
                this.showNotification('Game saved!');
            },
            
            exportSave() {
                const saveData = this.gameState?.exportSave();
                if (saveData) {
                    const blob = new Blob([saveData], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `my-afk-ai-save-${Date.now()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    this.showNotification('Save exported!');
                }
            },
            
            importSave() {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                            const success = this.gameState?.importSave(ev.target.result);
                            if (success) {
                                this.showNotification('Save imported!');
                            } else {
                                this.showNotification('Import failed!');
                            }
                        };
                        reader.readAsText(file);
                    }
                };
                input.click();
            },
            
            resetGame() {
                if (confirm('Reset all progress? This cannot be undone!')) {
                    this.gameState?.reset();
                    this.showNotification('Progress reset!');
                }
            }
        },
        
        mounted() {
            // Initialize game state
            this.gameState = new GameState();
            
            this.gameState.init().then(() => {
                // Initialize game loop
                this.gameLoop = new GameLoop(this.gameState, 100);
                this.gameLoop.start();
                
                // Subscribe to events
                eventBus.on('game:state_update', (data) => {
                    this.resources = data.resources;
                    this.upgrades = data.upgrades;
                    this.achievements = data.achievements || {};
                    this.stats = data.stats;
                    this.rates = data.rates;
                    this.clickPower = data.clickPower;
                });
                
                eventBus.on('game:click', (data) => {
                    // Handle click feedback if needed
                });
                
                eventBus.on('achievement:unlocked', (achievement) => {
                    this.showNotification(`Achievement: ${achievement.name}!`);
                });
                
                eventBus.on('game:offline_progress', (data) => {
                    this.showNotification(`Welcome back! +${this.formatNumber(data.seconds)}s offline`);
                });
                
                eventBus.on('prestige:performed', (data) => {
                    this.showNotification(`Prestige! +${data.levelGain} levels`);
                });
                
                eventBus.on('game:saved', () => {
                    // Silent save
                });
                
                // Initialize RandomEvents
                this.randomEvents = new RandomEvents(this.gameState);
                this.randomEvents.start();
                
                // Listen for boost events
                eventBus.on('boost:spawn', (data) => {
                    this.currentBoost = data.boost;
                    this.showNotification(`Boost available! ${data.boost.icon}`);
                });
                
                eventBus.on('boost:collected', (data) => {
                    this.currentBoost = null;
                    this.showNotification(`Collected: ${data.boost.name}!`);
                });
                
                eventBus.on('boost:active', (data) => {
                    this.activeBoosts = data.boosts;
                });
                
                // Initialize SkillsSystem
                this.skillsSystem = new SkillsSystem(this.gameState);
                this.skillsSystem.start();
                this.skills = this.skillsSystem.getSkills();
                
                // Listen for skill events
                eventBus.on('skill:used', (data) => {
                    this.skills = this.skillsSystem.getSkills();
                    if (data.message) {
                        this.showNotification(data.message);
                    } else {
                        this.showNotification(`Skill: ${data.skill?.name || data.skillId} activated!`);
                    }
                });
                
                eventBus.on('skill:active', (data) => {
                    this.activeEffects = this.skillsSystem.getActiveEffects();
                });
                
                eventBus.on('skill:deactivated', (data) => {
                    this.activeEffects = this.skillsSystem.getActiveEffects();
                });
                
                // Auto-save every 30 seconds
                setInterval(() => {
                    this.gameState?.save();
                }, 30000);
            });
        },
        
        beforeUnmount() {
            this.gameLoop?.stop();
        },
        
        template: `
            <div id="app" :class="{ 'nav-expanded': navExpanded }">
                <!-- Top HUD -->
                <div class="top-hud">
                    <div class="hud-left">
                        <span class="game-logo">🤖</span>
                        <div class="game-header">
                            <span class="game-title">MY AFK AI</span>
                            <span class="game-tagline">Build your AI empire</span>
                        </div>
                        
                        <div class="hud-divider"></div>
                        
                        <!-- Currency Summary -->
                        <div class="currency-summary">
                            <div v-for="(res, id) in resources" :key="id" 
                                 class="currency-item"
                                 :title="res.name || id">
                                <span class="currency-icon" :style="{ color: res.color }">
                                    {{ res.icon || id.substring(0, 3).toUpperCase() }}
                                </span>
                                <span class="currency-value">{{ formatNumber(res.amount) }}</span>
                                <span class="currency-rate" v-if="rates[id] > 0">+{{ formatNumber(rates[id]) }}/s</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="hud-right">
                        <button class="stats-btn" @click="openModal('stats')">
                            <span>📊</span> Stats
                        </button>
                    </div>
                </div>
                
                <!-- Navigation Bar -->
                <nav class="nav-bar" :class="{ expanded: navExpanded }">
                    <button class="nav-toggle" @click="toggleNav">☰</button>
                    
                    <div class="nav-items">
                        <button class="nav-item" @click="openModal('stats')">
                            <span class="nav-item-icon">📊</span>
                            <span class="nav-item-label">Stats</span>
                        </button>
                        
                        <button class="nav-item" @click="openModal('shop')">
                            <span class="nav-item-icon">🛒</span>
                            <span class="nav-item-label">Shop</span>
                        </button>
                        
                        <button class="nav-item" @click="openModal('prestige')">
                            <span class="nav-item-icon">🔄</span>
                            <span class="nav-item-label">Prestige</span>
                        </button>
                        
                        <button class="nav-item" @click="openModal('achievements')">
                            <span class="nav-item-icon">🏆</span>
                            <span class="nav-item-label">Achievements</span>
                        </button>
                        
                        <button class="nav-item" @click="openModal('settings')">
                            <span class="nav-item-icon">⚙️</span>
                            <span class="nav-item-label">Settings</span>
                        </button>
                    </div>
                </nav>
                
                <!-- Game Container -->
                <div class="game-container">
                    <!-- Floating particles -->
                    <div class="particle" style="top: 15%; left: 20%;"></div>
                    <div class="particle" style="top: 25%; left: 70%;"></div>
                    <div class="particle" style="top: 45%; left: 15%;"></div>
                    <div class="particle" style="top: 35%; left: 80%;"></div>
                    <div class="particle" style="top: 65%; left: 25%;"></div>
                    <div class="particle" style="top: 55%; left: 75%;"></div>
                    <div class="particle" style="top: 75%; left: 50%;"></div>
                    <div class="particle" style="top: 85%; left: 35%;"></div>
                    
                    <!-- Home Panel - CPU Core Clicker -->
                    <div class="panel" :class="{ active: activePanel === 'home' }">
                        <div class="cpu-core-container">
                            <div class="cpu-core" @click="handleCoreClick">
                                <div class="cpu-core-glow">
                                    <div class="cpu-core-orb"></div>
                                    <div class="cpu-core-highlight"></div>
                                </div>
                            </div>
                            
                            <!-- Floating texts -->
                            <div v-for="ft in floatingTexts" :key="ft.id"
                                 class="floating-text"
                                 :style="{ left: ft.x + 'px', top: ft.y + 'px' }">
                                {{ ft.text }}
                            </div>
                            
                            <div class="click-power-display">
                                <div class="click-power-label">Click Power</div>
                                <div class="click-power-value">+{{ formatNumber(clickPower) }}</div>
                            </div>
                            
                            <!-- Active Boosts Display -->
                            <div class="active-boosts" v-if="activeBoosts.length > 0">
                                <div v-for="boost in activeBoosts" :key="boost.id" class="boost-badge">
                                    {{ boost.icon }} {{ boost.name }}
                                    <span v-if="boost.remaining">({{ boost.remaining }}s)</span>
                                </div>
                            </div>
                            
                            <!-- Current Boost Available to Collect -->
                            <div v-if="currentBoost" class="boost-available" @click="collectBoost">
                                <span class="boost-icon">{{ currentBoost.icon }}</span>
                                <span class="boost-name">{{ currentBoost.name }}</span>
                                <span class="boost-hint">Click to collect!</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Shop Panel -->
                    <div class="panel" :class="{ active: activePanel === 'shop' }">
                        <div class="shop-container">
                            <div class="shop-header">
                                <h2 class="shop-title">⚙ AI Upgrades</h2>
                                <div class="shop-filters">
                                    <button class="filter-btn" 
                                            :class="{ active: shopFilter === 'all' }"
                                            @click="setShopFilter('all')">All</button>
                                    <button class="filter-btn" 
                                            :class="{ active: shopFilter === 'systems' }"
                                            @click="setShopFilter('systems')">Systems</button>
                                    <button class="filter-btn" 
                                            :class="{ active: shopFilter === 'models' }"
                                            @click="setShopFilter('models')">Models</button>
                                    <button class="filter-btn" 
                                            :class="{ active: shopFilter === 'extensions' }"
                                            @click="setShopFilter('extensions')">Extensions</button>
                                </div>
                            </div>
                            
                            <div class="upgrades-grid">
                                <div v-for="upgrade in filteredUpgrades" :key="upgrade.id" 
                                     class="upgrade-card">
                                    <div class="upgrade-header">
                                        <span class="upgrade-icon">📦</span>
                                        <div class="upgrade-info">
                                            <div class="upgrade-name">{{ upgrade.name }}</div>
                                            <div class="upgrade-category">{{ upgrade.category }}</div>
                                        </div>
                                    </div>
                                    <div class="upgrade-description">{{ upgrade.description }}</div>
                                    <div class="upgrade-stats">
                                        <span class="upgrade-owned">{{ upgrade.owned }}/{{ upgrade.maxOwned }}</span>
                                        <span class="upgrade-effect" v-if="upgrade.effect.crypto">
                                            +{{ formatNumber(upgrade.effect.crypto) }}/s
                                        </span>
                                    </div>
                                    <button class="buy-btn"
                                            :disabled="!upgrade.canAfford || upgrade.maxOwnedReached"
                                            @click="purchaseUpgrade(upgrade.id)">
                                        {{ upgrade.maxOwnedReached ? 'MAX' : formatNumber(upgrade.currentCost) + ' ₿' }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Prestige Panel -->
                    <div class="panel" :class="{ active: activePanel === 'prestige' }">
                        <div class="prestige-container">
                            <h2 class="prestige-title">🔄 Reboot</h2>
                            <p class="prestige-description">
                                Reset your progress and gain permanent multipliers
                            </p>
                            
                            <div class="prestige-info">
                                <div class="prestige-level">{{ stats.prestigeLevel }}</div>
                                <div class="prestige-multiplier">
                                    {{ stats.prestigeLevel > 0 ? (1 + stats.prestigeLevel * 0.5).toFixed(1) + 'x' : '1x' }} multiplier
                                </div>
                                <div class="prestige-reward">
                                    <div class="prestige-reward-label">Total Clicks</div>
                                    <div class="prestige-reward-value">{{ formatNumber(stats.totalClicks) }}</div>
                                </div>
                            </div>
                            
                            <button class="prestige-btn"
                                    :disabled="!canPrestige()"
                                    @click="performPrestige">
                                Perform Reboot
                            </button>
                            <p style="margin-top: 12px; font-size: 12px; color: #888;">
                                Requires {{ 1000 }} total clicks
                            </p>
                        </div>
                    </div>
                    
                    <!-- Achievements Panel -->
                    <div class="panel" :class="{ active: activePanel === 'achievements' }">
                        <div class="achievements-container">
                            <h2 class="achievements-title">🏆 Achievements</h2>
                            
                            <div class="achievements-list">
                                <div v-for="achievement in sortedAchievements" 
                                     :key="achievement.id"
                                     class="achievement-card"
                                     :class="{ unlocked: achievement.unlocked, locked: !achievement.unlocked }">
                                    <span class="achievement-icon">{{ achievement.icon }}</span>
                                    <div class="achievement-info">
                                        <div class="achievement-name">{{ achievement.name }}</div>
                                        <div class="achievement-description">{{ achievement.description }}</div>
                                        <div class="achievement-progress" v-if="!achievement.unlocked">
                                            {{ formatNumber(achievement.progress) }} / {{ formatNumber(achievement.condition?.value || 1) }}
                                        </div>
                                    </div>
                                    <span class="achievement-reward" v-if="achievement.reward">
                                        +{{ formatNumber(achievement.reward.crypto || 0) }} ₿
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Settings Panel -->
                    <div class="panel" :class="{ active: activePanel === 'settings' }">
                        <div class="settings-container">
                            <h2 class="settings-title">⚙️ Settings</h2>
                            
                            <div class="settings-section">
                                <h3 class="settings-section-title">💾 Save & Load</h3>
                                <div class="settings-buttons">
                                    <button class="settings-btn" @click="saveGame">
                                        💾 Save Game
                                    </button>
                                    <button class="settings-btn" @click="exportSave">
                                        📤 Export Save
                                    </button>
                                    <button class="settings-btn" @click="importSave">
                                        📥 Import Save
                                    </button>
                                </div>
                            </div>
                            
                            <div class="settings-section">
                                <h3 class="settings-section-title">🎮 Game Stats</h3>
                                <div class="settings-item">
                                    <span class="settings-label">Total Clicks</span>
                                    <span class="settings-value">{{ formatNumber(stats.totalClicks) }}</span>
                                </div>
                                <div class="settings-item">
                                    <span class="settings-label">Time Played</span>
                                    <span class="settings-value">{{ formatTime(stats.totalTimePlayed) }}</span>
                                </div>
                                <div class="settings-item">
                                    <span class="settings-label">Prestige Level</span>
                                    <span class="settings-value">{{ stats.prestigeLevel }}</span>
                                </div>
                            </div>
                            
                            <div class="settings-section">
                                <h3 class="settings-section-title">📊 Currency Stats</h3>
                                <div v-for="(res, id) in resources" :key="id" class="settings-item">
                                    <span class="settings-label">{{ res.name || id }}</span>
                                    <span class="settings-value">{{ formatNumber(res.amount) }} ({{ formatNumber(res.totalEarned) }} total)</span>
                                </div>
                            </div>
                            
                            <div class="settings-section">
                                <h3 class="settings-section-title">🔧 Actions</h3>
                                <button class="settings-btn danger" @click="resetGame">
                                    🗑️ Reset Progress
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Stats Panel - Accessible from Top HUD -->
                    <div class="panel" :class="{ active: activePanel === 'stats' }">
                        <div class="stats-container">
                            <button class="panel-back-btn" @click="closeStatsModal">← Back</button>
                            <h2 class="stats-title">📊 Statistics</h2>
                            
                            <div class="stats-grid">
                                <div class="stats-card">
                                    <h3 class="stats-card-title">💰 Currencies</h3>
                                    <div v-for="(res, id) in resources" :key="id" class="stats-item">
                                        <span class="stats-icon" :style="{ color: res.color }">
                                            {{ res.icon || id.substring(0, 3).toUpperCase() }}
                                        </span>
                                        <span class="stats-name">{{ res.name || id }}</span>
                                        <span class="stats-value">{{ formatNumber(res.amount) }}</span>
                                    </div>
                                </div>
                                
                                <div class="stats-card">
                                    <h3 class="stats-card-title">📈 Income Rates</h3>
                                    <div v-for="(rate, id) in rates" :key="id" class="stats-item" v-if="rate > 0 || resources[id]">
                                        <span class="stats-icon" :style="{ color: resources[id]?.color }">
                                            {{ resources[id]?.icon || id.substring(0, 3).toUpperCase() }}
                                        </span>
                                        <span class="stats-name">{{ resources[id]?.name || id }}</span>
                                        <span class="stats-rate">+{{ formatNumber(rate) }}/s</span>
                                    </div>
                                    <div class="stats-item" v-if="Object.values(rates).every(r => r === 0)">
                                        <span class="stats-empty">No income yet - buy upgrades!</span>
                                    </div>
                                </div>
                                
                                <div class="stats-card">
                                    <h3 class="stats-card-title">🎯 Game Stats</h3>
                                    <div class="stats-item">
                                        <span class="stats-name">Total Clicks</span>
                                        <span class="stats-value">{{ formatNumber(stats.totalClicks) }}</span>
                                    </div>
                                    <div class="stats-item">
                                        <span class="stats-name">Time Played</span>
                                        <span class="stats-value">{{ formatTime(stats.totalTimePlayed) }}</span>
                                    </div>
                                    <div class="stats-item">
                                        <span class="stats-name">Click Power</span>
                                        <span class="stats-value">+{{ formatNumber(clickPower) }}</span>
                                    </div>
                                    <div class="stats-item">
                                        <span class="stats-name">Prestige Level</span>
                                        <span class="stats-value">{{ stats.prestigeLevel }}</span>
                                    </div>
                                </div>
                                
                                <div class="stats-card">
                                    <h3 class="stats-card-title">🏆 Achievements</h3>
                                    <div class="stats-item">
                                        <span class="stats-name">Unlocked</span>
                                        <span class="stats-value">{{ Object.values(achievements).filter(a => a.unlocked).length }} / {{ Object.keys(achievements).length }}</span>
                                    </div>
                                </div>
                                
                                <div class="stats-card" v-if="activeBoosts.length > 0">
                                    <h3 class="stats-card-title">⚡ Active Boosts</h3>
                                    <div v-for="boost in activeBoosts" :key="boost.id" class="stats-item">
                                        <span class="stats-icon">{{ boost.icon }}</span>
                                        <span class="stats-name">{{ boost.name }}</span>
                                        <span class="stats-rate" v-if="boost.remaining">{{ boost.remaining }}s</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Modal Overlay -->
                <div class="modal-overlay" :class="{ open: activeModal }" @click.self="closeModal">
                    <!-- Stats Modal -->
                    <div class="modal-content" v-if="activeModal === 'stats'" @click.stop>
                        <div class="modal-header">
                            <h2 class="modal-title">📊 Statistics</h2>
                            <button class="modal-close" @click="closeModal">✕</button>
                        </div>
                        <div class="modal-body">
                            <div class="stats-grid">
                                <div class="stats-card">
                                    <h3 class="stats-card-title">💰 Currencies</h3>
                                    <div v-for="(res, id) in resources" :key="id" class="stats-item">
                                        <span class="stats-icon" :style="{ color: res.color }">
                                            {{ res.icon || id.substring(0, 3).toUpperCase() }}
                                        </span>
                                        <span class="stats-name">{{ res.name || id }}</span>
                                        <span class="stats-value">{{ formatNumber(res.amount) }}</span>
                                    </div>
                                </div>

                                <div class="stats-card">
                                    <h3 class="stats-card-title">📈 Income Rates</h3>
                                    <div v-for="(rate, id) in rates" :key="id" class="stats-item" v-if="rate > 0 || resources[id]">
                                        <span class="stats-icon" :style="{ color: resources[id]?.color }">
                                            {{ resources[id]?.icon || id.substring(0, 3).toUpperCase() }}
                                        </span>
                                        <span class="stats-name">{{ resources[id]?.name || id }}</span>
                                        <span class="stats-rate">+{{ formatNumber(rate) }}/s</span>
                                    </div>
                                </div>

                                <div class="stats-card">
                                    <h3 class="stats-card-title">🎯 Game Stats</h3>
                                    <div class="stats-item">
                                        <span class="stats-name">Total Clicks</span>
                                        <span class="stats-value">{{ formatNumber(stats.totalClicks) }}</span>
                                    </div>
                                    <div class="stats-item">
                                        <span class="stats-name">Time Played</span>
                                        <span class="stats-value">{{ formatTime(stats.totalTimePlayed) }}</span>
                                    </div>
                                    <div class="stats-item">
                                        <span class="stats-name">Click Power</span>
                                        <span class="stats-value">+{{ formatNumber(clickPower) }}</span>
                                    </div>
                                </div>

                                <div class="stats-card">
                                    <h3 class="stats-card-title">🏆 Achievements</h3>
                                    <div class="stats-item">
                                        <span class="stats-name">Unlocked</span>
                                        <span class="stats-value">{{ Object.values(achievements).filter(a => a.unlocked).length }}/{{ Object.keys(achievements).length }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Shop Modal -->
                    <div class="modal-content modal-large" v-if="activeModal === 'shop'" @click.stop>
                        <div class="modal-header">
                            <h2 class="modal-title">🛒 AI Upgrades</h2>
                            <button class="modal-close" @click="closeModal">✕</button>
                        </div>
                        <div class="modal-body">
                            <div class="shop-filters">
                                <button class="filter-btn" 
                                        :class="{ active: shopFilter === 'all' }"
                                        @click="setShopFilter('all')">All</button>
                                <button class="filter-btn" 
                                        :class="{ active: shopFilter === 'systems' }"
                                        @click="setShopFilter('systems')">Systems</button>
                                <button class="filter-btn" 
                                        :class="{ active: shopFilter === 'models' }"
                                        @click="setShopFilter('models')">Models</button>
                                <button class="filter-btn" 
                                        :class="{ active: shopFilter === 'extensions' }"
                                        @click="setShopFilter('extensions')">Extensions</button>
                            </div>
                            <div class="upgrades-grid">
                                <div v-for="upgrade in filteredUpgrades" :key="upgrade.id" 
                                     class="upgrade-card"
                                     :class="{ locked: !canAfford(upgrade) }">
                                    <div class="upgrade-header">
                                        <span class="upgrade-icon">{{ upgrade.icon }}</span>
                                        <span class="upgrade-name">{{ upgrade.name }}</span>
                                    </div>
                                    <div class="upgrade-desc">{{ upgrade.description }}</div>
                                    <div class="upgrade-stats">
                                        <span class="upgrade-effect">{{ upgrade.effectText }}</span>
                                        <span class="upgrade-rate" v-if="upgrade.rate">+{{ formatNumber(upgrade.rate) }}/s</span>
                                    </div>
                                    <div class="upgrade-footer">
                                        <span class="upgrade-level">{{ upgrade.owned }}/{{ upgrade.maxLevel }}</span>
                                        <button class="upgrade-buy-btn" 
                                                @click="buyUpgrade(upgrade.id)"
                                                :disabled="!canAfford(upgrade)">
                                            {{ formatNumber(upgrade.cost) }} Ƀ
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Prestige Modal -->
                    <div class="modal-content" v-if="activeModal === 'prestige'" @click.stop>
                        <div class="modal-header">
                            <h2 class="modal-title">🔄 Prestige</h2>
                            <button class="modal-close" @click="closeModal">✕</button>
                        </div>
                        <div class="modal-body">
                            <div class="prestige-info">
                                <p>Reset your progress to gain prestige points and start with bonuses!</p>
                                <div class="prestige-reward">
                                    <span class="prestige-label">Prestige Points Earned:</span>
                                    <span class="prestige-value">{{ calculatePrestigePoints() }}</span>
                                </div>
                                <div class="prestige-warning">
                                    ⚠️ This will reset all currencies and upgrades!
                                </div>
                                <button class="prestige-btn" @click="performPrestige">
                                    Perform Reboot
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Achievements Modal -->
                    <div class="modal-content" v-if="activeModal === 'achievements'" @click.stop>
                        <div class="modal-header">
                            <h2 class="modal-title">🏆 Achievements</h2>
                            <button class="modal-close" @click="closeModal">✕</button>
                        </div>
                        <div class="modal-body">
                            <div class="achievements-list">
                                <div v-for="achievement in sortedAchievements" :key="achievement.id"
                                     class="achievement-item"
                                     :class="{ unlocked: achievement.unlocked }">
                                    <span class="achievement-icon">{{ achievement.icon }}</span>
                                    <div class="achievement-info">
                                        <span class="achievement-name">{{ achievement.name }}</span>
                                        <span class="achievement-desc">{{ achievement.description }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Settings Modal -->
                    <div class="modal-content" v-if="activeModal === 'settings'" @click.stop>
                        <div class="modal-header">
                            <h2 class="modal-title">⚙️ Settings</h2>
                            <button class="modal-close" @click="closeModal">✕</button>
                        </div>
                        <div class="modal-body">
                            <div class="settings-section">
                                <h3 class="settings-section-title">💾 Save Management</h3>
                                <div class="settings-buttons">
                                    <button class="settings-btn" @click="saveGame">💾 Save Game</button>
                                    <button class="settings-btn" @click="exportSave">💾 Export Save</button>
                                    <button class="settings-btn" @click="importSave">💾 Import Save</button>
                                </div>
                            </div>
                            <div class="settings-section">
                                <h3 class="settings-section-title">⚠️ Danger Zone</h3>
                                <button class="settings-btn danger" @click="resetProgress">🗑️ Reset Progress</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Action Bar - Skills -->
                <div class="action-bar">
                    <div v-for="(skill, index) in skills" :key="skill.id"
                         class="action-slot"
                         :class="{ 
                             locked: !skill.unlocked, 
                             ready: skill.unlocked && skill.currentCooldown === 0,
                             cooldown: skill.currentCooldown > 0
                         }"
                         @click="skill.unlocked && skill.currentCooldown === 0 ? useSkill(skill.id) : null"
                         :title="skill.unlocked ? (skill.currentCooldown > 0 ? skill.name + ' - ' + formatCooldown(skill.currentCooldown) : skill.name) : 'Locked'">
                        <span class="skill-icon">{{ skill.icon }}</span>
                        <span v-if="skill.currentCooldown > 0" class="skill-cooldown">
                            {{ formatCooldown(skill.currentCooldown) }}
                        </span>
                        <span v-else-if="!skill.unlocked" class="skill-locked">🔒</span>
                    </div>
                </div>
                
                <!-- Notification -->
                <div v-if="notification" class="notification show">
                    {{ notification }}
                </div>
            </div>
        `
    });
    
    return app.mount(container);
}

export default createGameUI;