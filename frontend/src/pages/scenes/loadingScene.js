import { AssetLib } from '../data/assetLib.js';

export default class LoadingScene extends Phaser.Scene {
    constructor() { 
        super('Loading'); 
    }

    preload() {
        const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
        const screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;
        
        window.dispatchEvent(new CustomEvent('updateGameTitle', { 
            detail: { text: "Loading Assets" } 
        }));

        WebFont.load({
            google: { families: ['Press Start 2P'] },
            active: () => { this.fontsLoaded = true; }
        });

        const isGitHub = window.location.href.includes('github.io');
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.load.setBaseURL(isGitHub || isLocal ? '/8-Bit/' : '/');

        this.load.image('logo', 'Logo.png');

        this.load.spritesheet('hourglass', 'assets/GameAssets/SpriteHourglass.png', { 
            frameWidth: 200, frameHeight: 200 
        });

        if (this.textures.exists('hourglass')) {
            this.hourglassSprite = this.add.sprite(screenCenterX, screenCenterY - 60, 'hourglass', 0).setScale(0.8);
        } else {
            this.load.once('filecomplete-spritesheet-hourglass', () => {
                this.hourglassSprite = this.add.sprite(screenCenterX, screenCenterY - 60, 'hourglass', 0).setScale(0.8);
            });
        }

        this.loadingText = this.add.text(screenCenterX, screenCenterY + 60, "Loading... 0%", { 
            fontFamily: '"Press Start 2P"', 
            fontSize: "1rem", 
            fill: "#ffffff" 
        }).setOrigin(0.5);

        AssetLib.spritesheets.forEach(asset => { 
            this.load.spritesheet(asset.key, asset.path, {
                frameWidth: asset.width, 
                frameHeight: asset.height,
                ...(asset.end !== undefined && { endFrame: asset.end })
            });
        });
        AssetLib.images.forEach(asset => this.load.image(asset.key, asset.path));
        AssetLib.audio.forEach(asset => this.load.audio(asset.key, asset.path));

        this.load.on('progress', (value) => { this.loadingText.setText(`Loading... ${Math.floor(value * 100)}%`); });
    }

    async create() {
        const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
        const screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;

        if (!this.anims.exists('hourglassAnim')) {
            this.anims.create({
                key: 'hourglassAnim',
                frames: this.anims.generateFrameNumbers('hourglass', { start: 0, end: 13 }),
                frameRate: 12,
                repeat: -1
            });
        }
        
        if (this.hourglassSprite) {
            this.hourglassSprite.play('hourglassAnim');
        } else {
            this.hourglassSprite = this.add.sprite(screenCenterX, screenCenterY - 60, 'hourglass').setScale(0.8).play('hourglassAnim');
        }
        this.loadingText.setText("Fetching Player Data...");
        
        try{
            const playerid = window.playerID || localStorage.getItem("playerID");

            if (playerid) {
                const snapshot = await window.db.ref("webGame/" + playerid).once("value");
                window.playerData = snapshot.val();
            }
        } catch { console.error(error); }

        const playerKeys = ['standmale','standfemale','frontmale','frontfemale','sidemale','sidefemale','backmale','backfemale'];
        AssetLib.spritesheets
            .filter(a => playerKeys.includes(a.key))
            .forEach(a => {
                this.anims.create({
                    key: a.key,
                    frames: this.anims.generateFrameNumbers(a.key, { start: 0, end: a.end }),
                    frameRate: a.rate,
                    repeat: -1
                });
            });

        this.loadingText.setText("Ready!");
        this.time.delayedCall(1000, () => {
            const startScene = localStorage.getItem("startScene");
            const lastScene = localStorage.getItem('lastActiveScene') || 'Outdoor';
            const target = startScene === "LeftWing" ? "LeftWing" : lastScene;

            if (startScene === "LeftWing") {
                localStorage.removeItem("startScene");
                localStorage.setItem('lastActivePosition', JSON.stringify({ x: 870, y: 430 }));
                localStorage.setItem('lastActiveScene', 'LeftWing');
            }
            
            window.dispatchEvent(new CustomEvent('updateGameTitle', { 
                detail: { text: `${target} - An AI-Driven 8-bit Web Game For Personalized College Program Matching and Career Exploration` } 
            }));

            this.scene.start(target);
        });
    }
}