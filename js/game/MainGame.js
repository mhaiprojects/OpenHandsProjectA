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

        // Listen for purchase events for screen shake
        eventBus.on('upgrade:purchased', (data) => {
            this.triggerScreenShake(5);
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

        // Create hex grid pattern
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x00ffcc, 0.1);

        // Vertical lines
        for (let x = 0; x < width; x += 40) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, height);
        }

        // Horizontal lines
        for (let y = 0; y < height; y += 40) {
            graphics.moveTo(0, y);
            graphics.lineTo(width, y);
        }

        graphics.strokePath();

        // Create floating particles
        for (let i = 0; i < 8; i++) {
            const x = Phaser.Math.Between(50, width - 50);
            const y = Phaser.Math.Between(50, height - 50);
            const size = Phaser.Math.Between(2, 6);
            const alpha = Phaser.Math.FloatBetween(0.2, 0.5);

            const particle = this.add.circle(x, y, size, 0x00ffcc, alpha);
            particle.setBlendMode(Phaser.BlendModes.ADD);

            // Floating animation
            this.tweens.add({
                targets: particle,
                y: `+=${Phaser.Math.Between(-20, 20)}`,
                alpha: alpha * 0.5,
                duration: Phaser.Math.Between(2000, 4000),
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
        }
    }

    /**
     * Create the main clickable sprite
     */
    createMainSprite() {
        // Try to use main_clicker sprite, fallback to glowing circle
        if (this.textures.exists('sprite_main_clicker')) {
            this.mainSprite = this.add.sprite(400, 300, 'sprite_main_clicker');
        } else {
            // Create placeholder glowing orb
            const graphics = this.add.graphics();
            graphics.fillStyle(0x00ffcc, 0.3);
            graphics.fillCircle(400, 300, 60);
            graphics.fillStyle(0x00ffcc, 0.6);
            graphics.fillCircle(400, 300, 40);
            graphics.fillStyle(0x00ffcc, 1);
            graphics.fillCircle(400, 300, 25);

            // Create sprite from graphics
            this.mainSprite = this.add.circle(400, 300, 40, 0x00ffcc);
            this.mainSprite.setStrokeStyle(4, 0x00aa88);
        }

        this.mainSprite.setInteractive({ useHandCursor: true });

        // Add glow effect
        const glow = this.add.circle(400, 300, 50, 0x00ffcc, 0.2);
        glow.setBlendMode(Phaser.BlendModes.ADD);

        // Pulse animation for glow
        this.tweens.add({
            targets: glow,
            scaleX: 1.3,
            scaleY: 1.3,
            alpha: 0.1,
            duration: 1500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // Add hover effect
        this.mainSprite.on('pointerover', () => {
            this.tweens.add({
                targets: [this.mainSprite, glow],
                scaleX: 1.15,
                scaleY: 1.15,
                duration: 100
            });
        });

        this.mainSprite.on('pointerout', () => {
            this.tweens.add({
                targets: [this.mainSprite, glow],
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });

        // Add idle floating animation
        this.tweens.add({
            targets: [this.mainSprite, glow],
            y: '+=8',
            duration: 2500,
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
        // Create expanding ring
        const ring = this.add.circle(x, y, 20, 0x00ffcc, 0.8);
        ring.setBlendMode(Phaser.BlendModes.ADD);

        this.tweens.add({
            targets: ring,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 300,
            ease: 'Quad.easeOut',
            onComplete: () => {
                ring.destroy();
            }
        });

        // Create floating particles
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const particle = this.add.circle(x, y, 4, 0x00ffcc, 0.8);
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
        this.showFloatingText(x, y, '+Crypto');
    }

    /**
     * Show floating text that rises and fades
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} text - Text to display
     */
    showFloatingText(x, y, text) {
        const style = {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#00ffcc',
            stroke: '#003333',
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
        eventBus.off('upgrade:purchased');
    }

    /**
     * Trigger screen shake effect
     * @param {number} intensity - Shake intensity
     */
    triggerScreenShake(intensity = 5) {
        const camera = this.cameras.main;
        camera.shake(150, intensity / 1000);
    }
}

export default MainGame;