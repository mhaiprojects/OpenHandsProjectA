/**
 * AssetManager - Handles loading of SVG assets and creating Phaser textures
 * Supports dynamic sprite generation from SVG data URLs
 */
export class AssetManager {
    constructor(configManager) {
        this.configManager = configManager;
        this.textures = new Map();
        this.spritesConfig = null;
        this.basePath = './assets/sprites/';
    }

    /**
     * Load all assets based on sprites.json config
     * @returns {Promise<void>}
     */
    async loadAll() {
        this.spritesConfig = this.configManager.get('sprites');
        if (!this.spritesConfig || !this.spritesConfig.sprites) {
            console.warn('AssetManager: No sprites configuration found');
            return;
        }

        // Load all SVG assets
        const loadPromises = Object.entries(this.spritesConfig.sprites).map(
            async ([spriteId, spriteData]) => {
                try {
                    await this.loadSprite(spriteId, spriteData);
                } catch (error) {
                    console.error(`AssetManager: Failed to load sprite ${spriteId}:`, error);
                }
            }
        );

        await Promise.all(loadPromises);
    }

    /**
     * Load a single sprite SVG file
     * @param {string} spriteId - Unique sprite identifier
     * @param {Object} spriteData - Sprite configuration from sprites.json
     * @returns {Promise<string>} Base64 data URL
     */
    async loadSprite(spriteId, spriteData) {
        const path = spriteData.path || `${spriteId}.svg`;
        const fullPath = `${this.basePath}${path}`;

        const response = await fetch(fullPath);
        if (!response.ok) {
            throw new Error(`Failed to load SVG: ${fullPath}`);
        }

        const svgText = await response.text();
        const dataUrl = `data:image/svg+xml;base64,${btoa(svgText)}`;

        this.textures.set(spriteId, {
            dataUrl,
            width: spriteData.width || 64,
            height: spriteData.height || 64,
            animations: spriteData.animations || []
        });

        return dataUrl;
    }

    /**
     * Create Phaser texture from loaded SVG
     * @param {Phaser.Scene} scene - Phaser scene to create texture in
     * @param {string} spriteId - Sprite identifier
     */
    createPhaserTexture(scene, spriteId) {
        const texture = this.textures.get(spriteId);
        if (!texture) {
            console.warn(`AssetManager: Sprite ${spriteId} not found`);
            return;
        }

        const key = `sprite_${spriteId}`;

        // Create canvas for texture
        const canvas = document.createElement('canvas');
        canvas.width = texture.width;
        canvas.height = texture.height;
        const ctx = canvas.getContext('2d');

        // Load and draw SVG
        const img = new Image();
        img.src = texture.dataUrl;

        return new Promise((resolve) => {
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                scene.textures.addBase64(key, canvas.toDataURL());
                resolve(key);
            };
            img.onerror = () => {
                console.error(`AssetManager: Failed to decode SVG for ${spriteId}`);
                resolve(null);
            };
        });
    }

    /**
     * Create all Phaser textures for a scene
     * @param {Phaser.Scene} scene - Phaser scene
     * @returns {Promise<void>}
     */
    async createAllPhaserTextures(scene) {
        const promises = [];
        for (const spriteId of this.textures.keys()) {
            promises.push(this.createPhaserTexture(scene, spriteId));
        }
        await Promise.all(promises);
    }

    /**
     * Get sprite data
     * @param {string} spriteId - Sprite identifier
     * @returns {Object|null} Sprite data or null
     */
    getSprite(spriteId) {
        return this.textures.get(spriteId) || null;
    }

    /**
     * Get all loaded sprite IDs
     * @returns {string[]} Array of sprite IDs
     */
    getSpriteIds() {
        return Array.from(this.textures.keys());
    }
}

export default AssetManager;