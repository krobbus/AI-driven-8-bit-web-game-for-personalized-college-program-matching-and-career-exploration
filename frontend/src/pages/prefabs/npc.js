import { AssetLib } from '../data/assetLib.js';

export default class NPC extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setAllowGravity(false);
        this.body.setImmovable(true);
        this.body.setSize(30, 30).setOffset(10, 0);

        if (texture !== 'staticgroup') {
            this.initAnims();
            this.play(`${texture}-idle`, true);
        }
    }

    initAnims() {
        const textureKey = this.texture.key;
        const animKey = `${textureKey}-idle`;
        
        if (!this.scene.anims.exists(animKey)) {
            const assetDef = AssetLib.spritesheets.find(s => s.key === textureKey);
            const endFrame = assetDef?.end ?? 1;

            this.scene.anims.create({
                key: animKey,
                frames: this.scene.anims.generateFrameNumbers(textureKey, { start: 0, end: endFrame }),
                frameRate: 2,
                repeat: -1
            });
        }
    }

    update() { if (this.body) this.body.setVelocity(0, 0); }
}