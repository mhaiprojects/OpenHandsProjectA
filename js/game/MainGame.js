/**
 * MainGame - Phaser Scene for the main game view
 * Handles sprite rendering, click interactions, and visual feedback
 */
import { eventBus } from '../core/EventBus.js';

export class MainGame extends Phaser.Scene {
    constructor() {
        super({ key: 'MainGame' });
        this.mainSprite = null;
        this.clickFeedback = null;
        this.floatingTexts = [];
    }

    /**
     * Load assets for the scene
     */
    preload() {
        // Assets are loaded via AssetManager before scene creation
    }

    /**
     * Create the game scene
     */
    create() {
        const configManager = this.registry.get('configManager');
        const assetManager = this.registry.get('assetManager');

        // Create textures from loaded SVG assets
        assetManager.createAllPhaserTextures(this).then(() => {
            this.setupScene();
        });

        // Listen for click events from GameManager
        eventBus.on('game:click', (data) => {
            this.showClickFeedback();
        });
    }

    /**
     * Setup the scene elements
     */
    setupScene() {
        const configManager = this.registry.get('configManager');
        const gameConfig = configManager.get('game');

        // Create background decorations
        this.createBackground();

        // Create main clickable sprite
        this.createMainSprite();

        // Create particle effects area
        this.createParticles();

        // Setup click interaction
        this.input.on('pointerdown', (pointer) => {
            this.handlePointerDown(pointer);
        });
    }

    /**
     * Create background decorations
     */
    createBackground() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Create decorative circles
        for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(50, width - 50);
            const y = Phaser.Math.Between(50, height - 50);
            const radius = Phaser.Math.Between(20, 60);
            const alpha = Phaser.Math.FloatBetween(0.1, 0.2);

            const circle = this.add.circle(x, y, radius, 0x4a69bd, alpha);
            circle.setBlendMode(Phaser.BlendModes.ADD);
        }

        // Create grid pattern
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x4a69bd, 0.1);

        for (let x = 0; x < width; x += 50) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, height);
        }

        for (let y = 0; y < height; y += 50) {
            graphics.moveTo(0, y);
            graphics.lineTo(width, y);
        }

        graphics.strokePath();
    }

    /**
     * Create the main clickable sprite
     */
    createMainSprite() {
        // Try to use main_clicker sprite, fallback to colored circle
        if (this.textures.exists('sprite_main_clicker')) {
            this.mainSprite = this.add.sprite(400, 300, 'sprite_main_clicker');
        } else {
            // Create placeholder circle
            this.mainSprite = this.add.circle(400, 300, 50, 0x00ff88);
            this.mainSprite.setStrokeStyle(3, 0xffffff);
        }

        this.mainSprite.setInteractive({ useHandCursor: true });

        // Add hover effect
        this.mainSprite.on('pointerover', () => {
            this.tweens.add({
                targets: this.mainSprite,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 100
            });
        });

        this.mainSprite.on('pointerout', () => {
            this.tweens.add({
                targets: this.mainSprite,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });

        // Add idle floating animation
        this.tweens.add({
            targets: this.mainSprite,
            y: '+=10',
            duration: 2000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    /**
     * Create particle effects container
     */
    createParticles() {
        // Particle container for click effects
        this.particleContainer = this.add.container(0, 0);
    }

    /**
     * Handle pointer down event
     * @param {Phaser.Input.Pointer} pointer - Pointer object
     */
    handlePointerDown(pointer) {
        // Emit click event to GameManager via EventBus
        eventBus.emit('main_game:click', { x: pointer.x, y: pointer.y });

        // Visual feedback
        this.showClickFeedback(pointer.x, pointer.y);

        // Pulse animation on main sprite
        this.tweens.add({
            targets: this.mainSprite,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 100,
            yoyo: true,
            ease: 'Quad.easeOut'
        });
    }

    /**
     * Show click feedback animation
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    showClickFeedback(x = 400, y = 300) {
        const configManager = this.registry.get('configManager');
        const gameConfig = configManager.get('game');

        if (!gameConfig?.clickFeedback?.enabled) return;

        // Create expanding ring
        const ring = this.add.circle(x, y, 20, 0x00ff88, 0.8);
        ring.setBlendMode(Phaser.BlendModes.ADD);

        this.tweens.add({
            targets: ring,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: gameConfig.clickFeedback.duration || 200,
            ease: 'Quad.easeOut',
            onComplete: () => {
                ring.destroy();
            }
        });

        // Create floating particles
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const particle = this.add.circle(x, y, 4, 0x00ff88, 0.8);
            particle.setBlendMode(Phaser.BlendModes.ADD);

            const targetX = x + Math.cos(angle) * 80;
            const targetY = y + Math.sin(angle) * 80;

            this.tweens.add({
                targets: particle,
                x: targetX,
                y: targetY,
                alpha: 0,
                scaleX: 0.5,
                scaleY: 0.5,
                duration: 300,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }

        // Show floating text
        this.showFloatingText(x, y, '+1');
    }

    /**
     * Show floating text that rises and fades
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} text - Text to display
     */
    showFloatingText(x, y, text) {
        const style = {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#00ff88',
            stroke: '#000000',
            strokeThickness: 4
        };

        const floatingText = this.add.text(x, y, text, style);
        floatingText.setOrigin(0.5);
        floatingText.setBlendMode(Phaser.BlendModes.ADD);

        this.tweens.add({
            targets: floatingText,
            y: y - 60,
            alpha: 0,
            duration: 800,
            ease: 'Quad.easeOut',
            onComplete: () => {
                floatingText.destroy();
            }
        });
    }

    /**
     * Update game state
     * @param {number} time - Current time
     * @param {number} delta - Delta time
     */
    update(time, delta) {
        // Update any animated elements
    }

    /**
     * Cleanup when scene is destroyed
     */
    shutdown() {
        this.input.off('pointerdown');
        eventBus.off('game:click');
    }
}

export default MainGame;