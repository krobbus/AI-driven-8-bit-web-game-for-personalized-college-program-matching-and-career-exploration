import { db } from '../../config/firebase';
import Player from '/src/pages/prefabs/player.js';
import NPC from '/src/pages/prefabs/npc.js';
import DialogueBubble from '/src/pages/prefabs/dialoguebubble.js';
import { createMobileControls } from '/src/pages/utils/controls.js';
import { createKeyboardHints } from '/src/pages/utils/keyboardHints.js';
import { positionTopRightIcons } from '/src/pages/utils/positionTopRightIcons.js';
import Settings from '/src/pages/prefabs/settings.js';

export default class LeftWing extends Phaser.Scene {
    constructor() {
        super('LeftWing');
        this.lastInteractionTime = 0;
        this.interactionCooldown = 300;
    }

    async create() {
        const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
        const screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;

        this.bg = this.add.sprite(screenCenterX, screenCenterY, 'leftwingbg').setScale(1.5);                // bg
        this.physics.world.setBounds(80, 400, 1140, 40);                                                    // bounds
        let bounds = this.add.graphics().setDepth(100)
            //.lineStyle(4, 0xffff00, 1)
            .strokeRect(
            this.physics.world.bounds.x, 
            this.physics.world.bounds.y, 
            this.physics.world.bounds.width, 
            this.physics.world.bounds.height
        );

        let spawnX = 870;
        let spawnY = 400;
        const lastPosition = localStorage.getItem('lastActivePosition');
        const lastScene = localStorage.getItem('lastActiveScene');

        if (lastPosition && lastScene === 'LeftWing') {
            const savedPos = JSON.parse(lastPosition);
            spawnX = savedPos.x;
            spawnY = savedPos.y;

            localStorage.removeItem('lastActivePosition');
        }

        const playerID = localStorage.getItem("playerID");
        const snapshot = await db.ref(`webGame/${playerID}`).once('value');
        const userData = snapshot.val();
        const gender = (userData && userData.gender) ? userData.gender : 'male';
        this.playerName = (userData && userData.name) ? userData.name : "Guest";        
        this.isPermanentPlayer = userData?.temporary === false;
        const profileTags = Array.isArray(userData?.tags) ? userData.tags : [];
        this.hasCompleteProfile = Boolean(
            userData?.name &&
            profileTags.some(tag => tag.type === 'skill') &&
            profileTags.some(tag => tag.type === 'personality') &&
            Array.isArray(userData?.courses) &&
            userData.courses.length > 0
        );

        this.player = new Player(this, spawnX, spawnY, gender, this.playerName)                                          // player
            .setDepth(1)
            .setScale(3);

        this.npc2 = new NPC(this, 180, 400, 'female2').setScale(3);
        this.npcDialogue2 = new DialogueBubble(
            this,
            this.npc2,
            [
                "Eyes up, classmate! I’m practicing my situational awareness.",
                "Did you know 'Forensics' comes from the Latin word for 'open court'?",
                "Pretty cool, right? Attention to detail is everything here.",
                "If you can spot the one thing out of place in this room, you’re already halfway to a degree."
            ],
            {
                offsetX: -20,
                offsetY: -80,
                maxWidth: 220,
                typeDelay: 45,
                linePause: 2000,
                loop: false,
                depth: 200,
                onComplete: () => this.npcDialogue2.resetToIdle()
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
        this.upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
        this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
        this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

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
                x: 150, y: 410, w: 60, h: 30,
                hintText1: "INTERACT WITH HER ?", hintHeight: 30, hintWidth: 230,
                target: 'talkToNPC2'
            },
            { 
                x: 250, y: 400, w: 220, h: 40, 
                hintText1: "CHECK PROFILE AND ", hintText2: "ACCOUNT INFORMATION ?", hintHeight: 50, hintWidth: 250, 
                target: 'openModal'
            },
            { 
                x: 770, y: 400, w: 200, h: 40, 
                hintText1: "DO YOU WANT TO", hintText2: "GO OUTSIDE ?", hintHeight: 50, hintWidth: 180, 
                spawnInNextScene: { x: 930, y: 280 }, target: "Outdoor"
            },
            { 
                x: 1170, y: 400, w: 50, h: 60, 
                hintText1: "ENTER", hintText2: "HALLWAY ?", hintHeight: 50, hintWidth: 130,  
                spawnInNextScene: { x: 50, y: 430 }, target: "Hallway", specialLayout: true 
            }
        ];
        this.zones.forEach(z => {
            debugGraphics.strokeRect(z.x, z.y, z.w, z.h);
        });

        this.isMenuOpen = false;
        this.menuIndex = 0;

        const profileText = this.hasCompleteProfile ? "PROFILE MANAGEMENT" : "PROFILE CREATION";
        const accountText = this.isPermanentPlayer ? "ACCOUNT MANAGEMENT" : "ACCOUNT REGISTRATION";
        this.menuOptions = [
            { text: profileText, target: "openProfileManagementModal" },
            { text: accountText, target: "openAccountManagementModal" },
            ...(this.isPermanentPlayer
                ? [{ text: "VIEW DASHBOARD", target: "openDashboardModal" }]
                : []),
            { text: "CANCEL", target: "cancel" }
        ];

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

        this.hintLabel = this.add.container(0, 0).setVisible(false).setDepth(20);
        this.hintBubble = this.add.graphics();
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

        this.menuHeader = this.add.text(0, 0, "SELECT ACTION:", {
            fontFamily: '"Press Start 2P"',
            fontSize: "10px",
            fill: "#ffffff"
        }).setVisible(false);

        this.menuPointer = this.add.text(0, 0, "<", {
            fontFamily: '"Press Start 2P"',
            fontSize: "10px",
            fill: "#80ff60"
        }).setVisible(false);
        this.hintLabel.add([this.hintBubble, this.hintPart1, this.hintPart2, this.menuHeader, this.menuPointer]);

        this.menuTextObjects = [];
        this.menuOptions.forEach((opt, i) => {
            const y = i * 25 + 35;
            const txt = this.add.text(0, y, opt.text, {
                fontFamily: '"Press Start 2P"',
                fontSize: "10px",
                fill: "#ffffff"
            });
            this.menuTextObjects.push(txt);
            this.hintLabel.add(txt);
        });
        this.menuBubbleWidth = Math.max(
            200,
            ...this.menuTextObjects.map((text, i) =>
                text.width + 30 + this.menuPointer.width + 30
            )
        );
    }

    update(){
        if (!this.mobileControls || !this.player || !this.player.body) return;
    
        const isModalOpened = document.querySelector('.modalBackdrop') || document.activeElement.tagName === 'INPUT';
        if ((this.settings && this.settings.isOpened) || isModalOpened || this.isMenuOpen) {
            this.player.body.setVelocity(0);
            this.player.anims.stop();
            this.checkProximity();
            return;
        }

        const joystick = this.mobileControls.getForce();
        this.player.update(this.isMobileMode, joystick.x, joystick.y, joystick.isRunning);
        if (this.npcDialogue2) this.npcDialogue2.update();
        this.checkProximity();
    }

    checkProximity() {
        const enterJustDown = Phaser.Input.Keyboard.JustDown(this.enterKey);
        const spaceJustDown = Phaser.Input.Keyboard.JustDown(this.spaceKey);
        const interactJustDown = enterJustDown || spaceJustDown;
        const upJustDown = Phaser.Input.Keyboard.JustDown(this.upKey) || Phaser.Input.Keyboard.JustDown(this.wKey);
        const downJustDown = Phaser.Input.Keyboard.JustDown(this.downKey) || Phaser.Input.Keyboard.JustDown(this.sKey);

        this.activeZone = this.zones.find(z => {
            return (
                this.player.x >= z.x && this.player.x <= z.x + z.w &&
                this.player.y >= z.y && this.player.y <= z.y + z.h
            );
        });

        if (!this.activeZone) {
            this.isMenuOpen = false;
            if (this.hintLabel) this.hintLabel.setVisible(false);
            return;
        }

        const mobileUp = this.mobileControls.isDpadUpJustDown ? this.mobileControls.isDpadUpJustDown() : false;
        const mobileDown = this.mobileControls.isDpadDownJustDown ? this.mobileControls.isDpadDownJustDown() : false;
        const mobileInteractDown = this.mobileControls.isInteractJustDown();

        const isUp = upJustDown || mobileUp;
        const isDown = downJustDown || mobileDown;
        const isInteracting = interactJustDown || mobileInteractDown;

        if (this.activeZone.target === 'openModal') {
            if (!this.isMenuOpen) {
                if (isInteracting) {
                    this.isMenuOpen = true;
                    this.menuIndex = 0;
                }
            } else {
                if (isUp) {
                    const interactAudio = this.sound.add('interactaudio');
                    interactAudio.once('complete', () => interactAudio.destroy());
                    interactAudio.play();

                    this.menuIndex = (this.menuIndex - 1 + this.menuOptions.length) % this.menuOptions.length;
                }

                if (isDown) {
                    const interactAudio = this.sound.add('interactaudio');
                    interactAudio.once('complete', () => interactAudio.destroy());
                    interactAudio.play();

                    this.menuIndex = (this.menuIndex + 1) % this.menuOptions.length;
                }

                if (isInteracting) {
                    const choice = this.menuOptions[this.menuIndex];

                    if (choice.target === "cancel") {
                        const interactAudio = this.sound.add('interactaudio');
                        interactAudio.once('complete', () => interactAudio.destroy());
                        interactAudio.play();

                        this.isMenuOpen = false;
                    } else {
                        const interactAudio = this.sound.add('interactaudio');
                        interactAudio.once('complete', () => interactAudio.destroy());
                        interactAudio.play();

                        this.startPageTransition(choice.target, null, this.activeZone.course, choice.type);
                    }
                }
            }
        } else {
            this.menuPointer.setVisible(false);
            this.isMenuOpen = false;

            if (isInteracting) {
                const currentTime = this.time.now;
                if (currentTime - this.lastInteractionTime < this.interactionCooldown) {
                    return;
                }
                this.lastInteractionTime = currentTime;

                const returnPos = this.activeZone.spawnInNextScene || null;

                if (this.activeZone.target === 'talkToNPC2') {
                    if (isInteracting){
                        if (this.npcDialogue2.isPlaying) return;
                        const interactAudio = this.sound.add('interactaudio');
                        interactAudio.once('complete', () => interactAudio.destroy());
                        interactAudio.play();

                        this.npcDialogue2.play();
                    }
                } else {
                    if (this.activeZone.target === 'Hallway') {
                        if (this.playerName === "Guest") {
                            this.showBlockedHint();
                            return;
                        }
                    }

                    const interactAudio = this.sound.add('interactaudio');
                    interactAudio.once('complete', () => interactAudio.destroy());
                    interactAudio.play();

                    this.startPageTransition(this.activeZone.target, returnPos);
                }
            }
        }

        this.isMenuOpen ? this.renderMenu() : this.renderStandardHint();
    }

    showBlockedHint() {
        window.dispatchEvent(new CustomEvent('openProfileSetupHintModal'));
    }

    renderStandardHint(){
        if (this.menuHeader) this.menuHeader.setVisible(false);
        this.menuPointer.setVisible(false);
        this.menuTextObjects.forEach(t => t.setVisible(false));

        this.hintBubble
            .clear()
            .fillStyle(0x125729, 0.9)
            .lineStyle(4, 0xffffff, 1)
            .fillRoundedRect(-20, -15, this.activeZone.hintWidth, this.activeZone.hintHeight, 10)
            .strokeRoundedRect(-20, -15, this.activeZone.hintWidth, this.activeZone.hintHeight, 10);

        this.hintPart1.setVisible(true).setText(this.activeZone.hintText1);
        this.hintPart2.setVisible(true).setText(this.activeZone.hintText2);
        
        const labelX = this.activeZone.x;
        const labelY = this.activeZone.y - 120;

        if (this.activeZone.specialLayout) {
            this.hintLabel.setPosition(this.player.x - 170, this.player.y - 15);
        } else {
            this.hintLabel.setPosition(this.player.x + 70, this.player.y - 15);
        }
        this.hintLabel.setVisible(true);
    }

    renderMenu(){
        const isMenu = this.activeZone.target === 'openModal' && this.isMenuOpen;

        this.hintBubble
            .clear()
            .fillStyle(0x125729, 0.9)
            .lineStyle(4, 0xffffff, 1)
            .fillRoundedRect(-30, -15, this.menuBubbleWidth, 35 + this.menuOptions.length * 30, 10)
            .strokeRoundedRect(-30, -15, this.menuBubbleWidth, 35 + this.menuOptions.length * 30, 10);

        this.hintPart1.setVisible(!isMenu);
        this.hintPart2.setVisible(!isMenu);
        if (this.menuHeader) this.menuHeader.setVisible(isMenu);

        if (isMenu) {
            this.menuTextObjects.forEach((txt, i) => {
                txt.setVisible(true);
                const isSelected = (i === this.menuIndex);
                const isCancel = this.menuOptions[i].target === "cancel";
                const pointerX = txt.x + txt.width + 8;
                if (isSelected) {
                    txt.setFill(isCancel ? "#ff5555" : "#80ff60");
                    this.menuPointer.setFill(isCancel ? "#ff5555" : "#80ff60");
                    this.menuPointer.setVisible(true);
                    this.menuPointer.setPosition(pointerX, txt.y);
                } else { txt.setFill("#ffffff"); }
            });
        } else {
            this.menuPointer.setVisible(false);
            this.menuTextObjects.forEach(t => t.setVisible(false));
            this.hintPart1.setText(this.activeZone.hintText1);
            this.hintPart2.setText(this.activeZone.hintText2);
        }

        const offsetX = this.activeZone.specialLayout ? -170 : 70;
        this.hintLabel.setPosition(this.player.x + offsetX, this.player.y - 55);
        this.hintLabel.setVisible(true);
    }

    updateMobileUI() {
        this.mobileControls.setVisible(this.isMobileMode);
        this.keyboardHints.setVisible(!this.isMobileMode && !this.hideKeys);
    }
    toggleSettings() { this.settingsPanel.setVisible(!this.settingsPanel.visible); }

    startPageTransition(targetSceneName, lastPosition) {
        if (targetSceneName === 'openProfileManagementModal') {
            this.input.keyboard.resetKeys();
            window.dispatchEvent(new CustomEvent('openProfileManagementModal'));
            return;
        }

        if (targetSceneName === 'openAccountManagementModal' || targetSceneName === 'openModal') {
            this.input.keyboard.resetKeys();
            window.dispatchEvent(new CustomEvent('openAccountManagementModal'));
            return;
        }

        if (targetSceneName === 'openDashboardModal') {
            const interactAudio = this.sound.add('interactaudio');
            interactAudio.once('complete', () => interactAudio.destroy());
            interactAudio.play();

            this.input.keyboard.resetKeys();
            window.dispatchEvent(new CustomEvent('openDashboardModal'));
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