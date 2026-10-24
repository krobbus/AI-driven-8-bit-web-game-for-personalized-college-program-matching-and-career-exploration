import { db } from '../../config/firebase';
import Player from '/src/pages/prefabs/player.js';
import NPC from '/src/pages/prefabs/npc.js';
import DialogueBubble from '/src/pages/prefabs/dialoguebubble.js';
import { createMobileControls } from '/src/pages/utils/controls.js';
import { createKeyboardHints } from '/src/pages/utils/keyboardHints.js';
import { positionTopRightIcons } from '/src/pages/utils/positionTopRightIcons.js';
import Settings from '/src/pages/prefabs/settings.js';

export default class RightWing extends Phaser.Scene {
    constructor() {
        super('RightWing');
        this.lastInteractionTime = 0;
        this.interactionCooldown = 300;
    }

    async create() {
        const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
        const screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;

        this.bg = this.add.sprite(screenCenterX, screenCenterY, 'rightwingbg').setScale(1.5);                // bg
        this.physics.world.setBounds(80, 400, 1140, 40);                                                    // bounds
        let bounds = this.add.graphics().setDepth(100)
            //.lineStyle(4, 0xffff00, 1)
            .strokeRect(
            this.physics.world.bounds.x, 
            this.physics.world.bounds.y, 
            this.physics.world.bounds.width, 
            this.physics.world.bounds.height
        );

        let spawnX = 100;
        let spawnY = 450;
        const lastPosition = localStorage.getItem('lastActivePosition');
        const lastScene = localStorage.getItem('lastActiveScene');

        if (lastPosition && lastScene === 'RightWing') {
            const savedPos = JSON.parse(lastPosition);
            spawnX = savedPos.x;
            spawnY = savedPos.y;

            localStorage.removeItem('lastActivePosition');
        }

        const playerID = localStorage.getItem("playerID");
        const snapshot = await db.ref(`webGame/${playerID}`).once('value');
        const userData = snapshot.val();
        const gender = (userData && userData.gender) ? userData.gender : 'male';
        const playerName = (userData && userData.name) ? userData.name : "Guest";        

        this.player = new Player(this, spawnX, spawnY, gender, playerName)                                              // player
            .setDepth(1)
            .setScale(3);

        this.npc5 = new NPC(this, 660, 400, 'male2').setScale(3);
        this.npcDialogue5 = new DialogueBubble(
            this,
            this.npc5,
            [
                "Time is money, friend! 'Company' literally means 'sharing bread.'",
                "Remember, business opportunities are like buses, there’s always another one coming.",
                "Your net worth is your network, so start making connections today!"
            ],
            {
                offsetX: -20,
                offsetY: -80,
                maxWidth: 220,
                typeDelay: 45,
                linePause: 2000,
                loop: false,
                depth: 200,
                onComplete: () => this.npcDialogue5.resetToIdle()
            }
        );

        this.npc6 = new NPC(this, 990, 410, 'musicmale').setScale(3);
        this.npcDialogue6 = new DialogueBubble(
            this,
            this.npc6,
            [
                "(Low-bit muffled singing)",
                "(He's vibing too hard to notice you...)"
            ],
            {
                offsetX: -20,
                offsetY: -70,
                maxWidth: 220,
                typeDelay: 45,
                linePause: 2000,
                loop: false,
                depth: 200,
                onComplete: () => this.npcDialogue6.resetToIdle()
            }
        );

        this.sound.stopAll();
        this.sound.removeAll();

        const startAudio = () => {
            if (this.gameAudio && this.gameAudio.isPlaying) return;
            if (this.sound.context.state === 'suspended') this.sound.context.resume();
            this.gameAudio = this.sound.add('gamebg', { loop: true });
            this.gameAudio.play();
        };

        this.input.once('pointerdown', startAudio);
        this.input.keyboard.once('keydown', startAudio);
        this.events.once('shutdown', () => {
            if (this.gameAudio) {
                this.gameAudio.stop();
                this.gameAudio.destroy();
                this.gameAudio = null;
            }
        });

        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.manual = this.add.sprite(0, 0, 'manual')
            .setDepth(3001)
            .setOrigin(1, 0)
            .setInteractive({ useHandCursor: true })
            .on("pointerdown", () => {
                const interactAudio = this.sound.add('interactaudio');
                interactAudio.once('complete', () => interactAudio.destroy());
                interactAudio.play();

                if (this.settings.isOpened) this.settings.toggle();
                this.input.keyboard.resetKeys();
                window.dispatchEvent(new CustomEvent('openManualModal'));
                return;
            });

        this.settings = new Settings(this);                                                                         // settings
        this.settings.setDepth(3000);
        this.settingsIcon = this.add.sprite(0, 0, 'settings')
            .setDepth(3001)
            .setOrigin(1, 0)
            .setInteractive({ useHandCursor: true })
            .on("pointerdown", () => {
                const interactAudio = this.sound.add('interactaudio');
                interactAudio.once('complete', () => interactAudio.destroy());
                interactAudio.play();
                
                const isModalOpened = document.querySelector('.modalBackdrop') || document.activeElement.tagName === 'INPUT';
                if (isModalOpened) return;
                this.settings.toggle()
            });
        positionTopRightIcons(this, this.manual, this.settingsIcon);

        let debugGraphics = this.add.graphics();//.lineStyle(2, 0x00ff00, 1);
        this.activeZone = null;

        this.zones = [
            { 
                x: 50, y: 400, w: 50, h: 60, 
                hintText1: "ENTER", hintText2: "HALLWAY ?", hintHeight: 50, hintWidth: 130, 
                spawnInNextScene: { x: 5970, y: 430 }, target: "Hallway"
            },
            { 
                x: 280, y: 400, w: 200, h: 40, 
                hintText1: "DO YOU WANT TO", hintText2: "GO OUTSIDE ?", hintHeight: 50, hintWidth: 180, 
                spawnInNextScene: { x: 1000, y: 340 }, target: "Outdoor"
            },
            {
                x: 630, y: 410, w: 60, h: 30,
                hintText1: "INTERACT WITH HIM ?", hintHeight: 30, hintWidth: 230,
                target: 'talkToNPC5'
            },
            { 
                x: 700, y: 400, w: 220, h: 40, 
                hintText1: "DO YOU WANT TO", hintText2: "VIEW LEADERBOARD ?", hintHeight: 50, hintWidth: 230, 
                target: "openLeaderboardModal"
            },
            {
                x: 960, y: 420, w: 60, h: 30,
                hintText1: "INTERACT WITH HIM ?", hintHeight: 30, hintWidth: 230,
                target: 'talkToNPC6'
            },
        ];
        this.zones.forEach(z => {
            debugGraphics.strokeRect(z.x, z.y, z.w, z.h);
        });

        const savedMode = localStorage.getItem('mobileMode');
        if (savedMode === null) {
            this.isMobileMode = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            localStorage.setItem('mobileMode', this.isMobileMode);
        } else { this.isMobileMode = savedMode === 'true'; }

        this.mobileControls = createMobileControls(this);
        this.keyboardHints = createKeyboardHints(this);
        this.createUIElements();
        this.updateMobileUI();
    }

    createUIElements(){
        const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
        const screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;

        const color = 0x125729;
        const alpha = 0.9;
        const outlineColor = 0xffffff;

        this.hintBubble = this.add.graphics();
        this.hintLabel = this.add.container(0, 0).setVisible(false).setDepth(20);
            this.hintPart1 = this.add.text(0, 0, "", {
                fontFamily: '"Press Start 2P"',
                fontSize: "10px",
                fill: "#ffffff"
            }).setOrigin(0, 0.5);

            this.hintPart2 = this.add.text(0, 20, "", {
                fontFamily: '"Press Start 2P"',
                fontSize: "10px",
                fill: "#ffffff"
            }).setOrigin(0, 0.5);
        this.hintLabel.add([this.hintBubble, this.hintPart1, this.hintPart2]);
    }

    update(){
        if (!this.mobileControls || !this.player || !this.player.body) return;
        
        const isModalOpened = document.querySelector('.modalBackdrop') || document.activeElement.tagName === 'INPUT';
        if ((this.settings && this.settings.isOpened) || isModalOpened) {
            this.player.body.setVelocity(0);
            this.player.anims.stop();
            this.checkProximity();
            return;
        }
        
        const joystick = this.mobileControls.getForce();
        this.player.update(this.isMobileMode, joystick.x, joystick.y, joystick.isRunning);
        if (this.npcDialogue5) this.npcDialogue5.update();
        if (this.npcDialogue6) this.npcDialogue6.update();
        this.checkProximity();
    }

    checkProximity() {
        this.activeZone = this.zones.find(z => {
            return (
                this.player.x >= z.x &&
                this.player.x <= z.x + z.w &&
                this.player.y >= z.y &&
                this.player.y <= z.y + z.h
            );
        });

        if (this.activeZone) {
            const enterJustDown = Phaser.Input.Keyboard.JustDown(this.enterKey);
            const spaceJustDown = Phaser.Input.Keyboard.JustDown(this.spaceKey);
            const interactJustDown = enterJustDown || spaceJustDown;
            const mobileInteractDown = this.mobileControls.isInteractJustDown();
            const isInteracting = interactJustDown || mobileInteractDown;

            if (interactJustDown || mobileInteractDown) {
                const currentTime = this.time.now;
                if (currentTime - this.lastInteractionTime < this.interactionCooldown) {
                    return;
                }
                this.lastInteractionTime = currentTime;

                const returnPos = this.activeZone.spawnInNextScene || null;

                if (this.activeZone.target === 'talkToNPC5') {
                    if (isInteracting) {
                        if (this.npcDialogue5.isPlaying) return;
                        const interactAudio = this.sound.add('interactaudio');
                        interactAudio.once('complete', () => interactAudio.destroy());
                        interactAudio.play();

                        this.npcDialogue5.play();
                    }
                } else if (this.activeZone.target === 'talkToNPC6') {
                    if (isInteracting) {
                        if (this.npcDialogue6.isPlaying) return;
                        const interactAudio = this.sound.add('interactaudio');
                        interactAudio.once('complete', () => interactAudio.destroy());
                        interactAudio.play();
                        
                        this.npcDialogue6.play();
                    }
                } else {
                    const interactAudio = this.sound.add('interactaudio');
                    interactAudio.once('complete', () => interactAudio.destroy());
                    interactAudio.play();

                    this.startPageTransition(this.activeZone.target, returnPos);
                }
            }

            this.hintBubble
                .clear()
                .fillStyle(0x125729, 0.9)
                .lineStyle(4, 0xffffff, 1)
                .fillRoundedRect(-20, -15, this.activeZone.hintWidth, this.activeZone.hintHeight, 10)
                .strokeRoundedRect(-20, -15, this.activeZone.hintWidth, this.activeZone.hintHeight, 10);

            this.hintPart1.setText(this.activeZone.hintText1);
            this.hintPart2.setText(this.activeZone.hintText2);

            const labelX = this.activeZone.x;
            const labelY = this.activeZone.y - 120;

            if (this.activeZone.specialLayout) {
                this.hintLabel.setPosition(this.player.x - 170, this.player.y - 15);
            } else {
                this.hintLabel.setPosition(this.player.x + 70, this.player.y - 15);
            }
            this.hintLabel.setVisible(true);
        } else {
            this.hintLabel.setVisible(false);
        }
    }

    updateMobileUI() {
        this.mobileControls.setVisible(this.isMobileMode);
        this.keyboardHints.setVisible(!this.isMobileMode);
    }
    toggleSettings() { this.settingsPanel.setVisible(!this.settingsPanel.visible); }

    startPageTransition(targetSceneName, lastPosition) {
        if (targetSceneName === 'openLeaderboardModal') {
            const interactAudio = this.sound.add('interactaudio');
            interactAudio.once('complete', () => interactAudio.destroy());
            interactAudio.play();

            this.input.keyboard.resetKeys();
            window.dispatchEvent(new CustomEvent('openLeaderboardModal'));
            return;
        }

        const width = this.scale.width;
        const height = this.scale.height;

        let overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000).setAlpha(0);
        overlay.setScrollFactor(0).setDepth(5000);

        this.tweens.add({
            targets: overlay,
            alpha: 1,
            duration: 800,
            onComplete: () => {
                window.dispatchEvent(new CustomEvent('updateGameTitle', { 
                    detail: { text: `${targetSceneName} - An AI-Driven 8-bit Web Game For Personalized College Program Matching and Career Exploration` } 
                }));
                
                localStorage.setItem('lastActiveScene', targetSceneName);
                if (lastPosition){
                    localStorage.setItem('lastActivePosition', JSON.stringify(lastPosition));
                }

                if (this.gameAudio) {
                    this.gameAudio.stop();
                    this.gameAudio.destroy();
                    this.gameAudio = null;
                }
                
                this.scene.start(targetSceneName);
            }
        });
    }
}