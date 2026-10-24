import { db } from '../../config/firebase';
import Player from '/src/pages/prefabs/player.js';
import NPC from '/src/pages/prefabs/npc.js';
import DialogueBubble from '/src/pages/prefabs/dialoguebubble.js';
import { createMobileControls } from '/src/pages/utils/controls.js';
import { createKeyboardHints } from '/src/pages/utils/keyboardHints.js';
import Settings from '/src/pages/prefabs/settings.js';

export default class Hallway extends Phaser.Scene {
    constructor() {
        super('Hallway');
        this.lastInteractionTime = 0;
        this.interactionCooldown = 300;
    }

    async create() {
        const screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;

        const viewWidth = 1200;
        const viewHeight = 600;
        const xPadding = (this.scale.width - viewWidth) / 2;
        const yPadding = (this.scale.height - viewHeight) / 2;
        const hallwayWidth = 4000 * 1.5;
        this.cameras.main.setViewport(xPadding, yPadding, viewWidth, viewHeight);
        this.cameras.main.setBounds(0, 0, hallwayWidth, 600);

        this.bg = this.add.sprite(0, screenCenterY, 'hallwaybg')                                            // bg
            .setScale(1.5)
            .setOrigin(0, 0.5)

        this.physics.world.setBounds(0, 400, hallwayWidth, 40);                                             // bounds
        let bounds = this.add.graphics().setDepth(100)
            //.lineStyle(4, 0xffff00, 1)
            .strokeRect(
            this.physics.world.bounds.x, 
            this.physics.world.bounds.y, 
            this.physics.world.bounds.width, 
            this.physics.world.bounds.height
        );

        let spawnX = 100;
        let spawnY = 420;
        const lastPosition = localStorage.getItem('lastActivePosition');
        const lastScene = localStorage.getItem('lastActiveScene');

        if (lastPosition && lastScene === 'Hallway') {
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

        this.player = new Player(this, spawnX, spawnY, gender, playerName)                                          // player
            .setDepth(1)
            .setScale(3);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        this.npc3 = new NPC(this, 2000, 400, 'male1').setScale(3);
        this.npcDialogue3 = new DialogueBubble(
            this,
            this.npc3,
            [
                "I was just standing here wondering... is creativity just intelligence having fun?",
                "Did you know Steve Jobs took calligraphy classes just for the art of it?",
                "In CAS, we don't just learn facts; we learn how to connect the dots.",
                "Don't be afraid to be a little 'different' here."
            ],
            {
                offsetX: -20,
                offsetY: -80,
                maxWidth: 220,
                typeDelay: 45,
                linePause: 2000,
                loop: false,
                depth: 200,
                onComplete: () => this.npcDialogue3.resetToIdle()
            }
        );

        this.npc4 = new NPC(this, 2970, 400, 'group').setScale(3);
        this.staticNpc4 = this.add.sprite(2970, 400, 'staticgroup').setScale(3).setVisible(false);
        this.npcDialogue4 = new DialogueBubble(
            this,
            this.npc4,
            [
                "Hi there! We're just polishing our lesson plan.",
                "They say teaching is the profession that creates all others, and it’s true!",
                "Did you know 'Education' means to 'draw out' what’s already inside?",
                "It takes a lot of patience, but seeing that 'aha!' moment in a student's eyes is worth it."
            ],
            {
                offsetX: -60,
                offsetY: -80,
                maxWidth: 220,
                typeDelay: 45,
                linePause: 2000,
                loop: false,
                depth: 200,
                onComplete: () => this.npcDialogue4.resetToIdle()
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

        this.manual = this.add.sprite(viewWidth - 10, 140, 'manual')                                         // manual
            .setDepth(3001)
            .setOrigin(1, 0)
            .setScrollFactor(0)
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
        this.settings.setPosition(viewWidth / 2, viewHeight / 2);
        this.add.sprite(viewWidth - 10, 80, 'settings')
            .setDepth(3001)
            .setOrigin(1, 0)
            .setScrollFactor(0)
            .setInteractive({ useHandCursor: true })
            .on("pointerdown", () => {
                const interactAudio = this.sound.add('interactaudio');
                interactAudio.once('complete', () => interactAudio.destroy());
                interactAudio.play();

                const isModalOpened = document.querySelector('.modalBackdrop') || document.activeElement.tagName === 'INPUT';
                if (isModalOpened) return;
                this.settings.toggle()
            });

        let debugGraphics = this.add.graphics();//.lineStyle(2, 0x00ff00, 1);
        this.activeZone = null;

        this.zones = [
            {                   // left wing
                x: 0, y: 400, w: 50, h: 40, hintText1: "DO YOU WANT TO", hintText2: "ENTER LEFT WING ?", 
                hintHeight: 50, hintWidth: 210, spawnInNextScene: { x: 1160, y: 430 }, target: "LeftWing" },
            { 
                x: 60, y: 400, w: 590, h: 40, hintText1: "DO YOU WANT TO", hintText2: "PLAY CITCS ?", 
                hintHeight: 50, hintWidth: 180, target: "openMenu", course: "CITCS" },
            { 
                x: 720, y: 400, w: 590, h: 40, hintText1: "DO YOU WANT TO", hintText2: "PLAY CCJ ?", 
                hintHeight: 50, hintWidth: 180, target: "openMenu", course: "CCJ" },
            { 
                x: 1390, y: 400, w: 590, h: 40, hintText1: "DO YOU WANT TO", hintText2: "PLAY CBA ?",
                hintHeight: 50, hintWidth: 180, target: "openMenu", course: "CBA" },
            {                   // NPC 3
                x: 1970, y: 410, w: 60, h: 30, hintText1: "INTERACT WITH HIM ?", 
                hintHeight: 30, hintWidth: 230, target: "talkToNPC3" },
            { 
                x: 2050, y: 400, w: 590, h: 40, hintText1: "DO YOU WANT TO", hintText2: "PLAY CAS ?", 
                hintHeight: 50, hintWidth: 180, target: "openMenu", course: "CAS" },
            {                      // NPC 4
                x: 2940, y: 410, w: 60, h: 30, hintText1: "INTERACT WITH THEM ?", 
                hintHeight: 30, hintWidth: 240, target: "talkToNPC4" },
            { 
                x: 3375, y: 400, w: 590, h: 40, hintText1: "DO YOU WANT TO", hintText2: "PLAY CTE ?", 
                hintHeight: 50, hintWidth: 180, target: "openMenu", course: "CTE" },
            { 
                x: 4040, y: 400, w: 590, h: 40, hintText1: "DO YOU WANT TO", hintText2: "PLAY COM ?", 
                hintHeight: 50, hintWidth: 180, target: "openMenu", course: "COM" },
            {
                x: 4705, y: 400, w: 590, h: 40, hintText1: "DO YOU WANT TO", hintText2: "PLAY ISW ?", 
                hintHeight: 50, hintWidth: 180, target: "openMenu", course: "ISW" },
            { 
                x: 5365, y: 400, w: 590, h: 40, hintText1: "DO YOU WANT TO", hintText2: "PLAY IPPG ?", 
                hintHeight: 50, hintWidth: 180, target: "openMenu", course: "IPPG", specialLayout1: true },
            {                   // right wing
                x: 5960, y: 400, w: 50, h: 40, hintText1: "DO YOU WANT TO", hintText2: "ENTER RIGHT WING ?", 
                hintHeight: 50, hintWidth: 220, spawnInNextScene: { x: 50, y: 430 }, target: "RightWing", specialLayout2: true }
        ];
        this.zones.forEach(z => {
            debugGraphics.strokeRect(z.x, z.y, z.w, z.h);
        });

        this.isMenuOpen = false;
        this.menuIndex = 0;
        this.menuOptions = [
            { text: "COURSE-RELATED ASSESSMENT", target: "Classroom", type: "CourseRelated" },
            { text: "SKILL ASSESSMENT", target: "Classroom", type: "Skill" },
            { text: "PERSONALITY ASSESSMENT", target: "Classroom", type: "Personality" },
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

        this.mobileControls.reposition(viewWidth, viewHeight);
    }

    createUIElements(){
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

            this.menuHeader = this.add.text(0, 0, "SELECT TYPE OF ASSESSMENT:", {
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
            let txt = this.add.text(0, i * 25 + 35, opt.text, { 
                fontFamily: '"Press Start 2P"', 
                fontSize: "10px", 
                fill: "#ffffff"
            });
            this.menuTextObjects.push(txt);
            this.hintLabel.add(txt);
        });
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
        if (this.npcDialogue3) this.npcDialogue3.update();
        if (this.npcDialogue4) this.npcDialogue4.update();
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

        if (this.activeZone.target === 'openMenu') {
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

                if (this.activeZone.target === 'talkToNPC3') {
                    if (isInteracting) {
                        if (this.npcDialogue3.isPlaying) return;
                        const interactAudio = this.sound.add('interactaudio');
                        interactAudio.once('complete', () => interactAudio.destroy());
                        interactAudio.play();
                        
                        this.npcDialogue3.play();
                    }
                } else if (this.activeZone.target === 'talkToNPC4') {
                    if (isInteracting) {
                        if (this.npcDialogue4.isPlaying) return;
                        this.npc4.setVisible(false);
                        this.staticNpc4.setVisible(true);
                        this.npcDialogue4.npc = this.staticNpc4;

                        const interactAudio = this.sound.add('interactaudio');
                        interactAudio.once('complete', () => interactAudio.destroy());
                        interactAudio.play();

                        this.npcDialogue4.play();

                        this.npcDialogue4.onComplete = () => {
                            this.npcDialogue4.resetToIdle();
                            this.staticNpc4.setVisible(false);
                            this.npc4.setVisible(true);
                            this.npcDialogue4.npc = this.npc4;
                        };
                    }
                } else {
                    const interactAudio = this.sound.add('interactaudio');
                    interactAudio.once('complete', () => interactAudio.destroy());
                    interactAudio.play();

                    this.startPageTransition(this.activeZone.target, returnPos);
                }
            }
        }

        this.isMenuOpen ? this.renderMenu() : this.renderStandardHint();
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
        
        const labelX = this.activeZone.x;
        const labelY = this.activeZone.y - 120;
        
        this.hintPart1.setVisible(true).setText(this.activeZone.hintText1);
        this.hintPart2.setVisible(true).setText(this.activeZone.hintText2);

        const offsetX = this.activeZone.specialLayout1 ? -210 : this.activeZone.specialLayout2 ? -260 : 70;
        this.hintLabel.setPosition(this.player.x + offsetX, this.player.y - 15);
        this.hintLabel.setVisible(true);
    }

    renderMenu(){
        const isMenu = this.activeZone.target === 'openMenu' && this.isMenuOpen;

        this.hintBubble
            .clear()
            .fillStyle(0x125729, 0.9)
            .lineStyle(4, 0xffffff, 1)
            .fillRoundedRect(-20, -15, 310, 155, 10)
            .strokeRoundedRect(-20, -15, 310, 155, 10);

        this.hintPart1.setVisible(!isMenu);
        this.hintPart2.setVisible(!isMenu);
        if (this.menuHeader) this.menuHeader.setVisible(isMenu);
        
        if (isMenu) {
            this.menuTextObjects.forEach((txt, i) => {
                txt.setVisible(true);
                const isSelected = (i === this.menuIndex);
                const isCancel = this.menuOptions[i].target === "cancel";

                if (isSelected) {
                    txt.setFill(isCancel ? "#ff5555" : "#80ff60");
                    this.menuPointer.setFill(isCancel ? "#ff5555" : "#80ff60");
                    this.menuPointer.setVisible(true);
                    this.menuPointer.setPosition(txt.x + txt.width + 10, txt.y);
                } else { txt.setFill("#ffffff"); }
            });
        } else {
            this.menuPointer.setVisible(false);
            this.menuTextObjects.forEach(t => t.setVisible(false));
            this.hintPart1.setText(this.activeZone.hintText1);
            this.hintPart2.setText(this.activeZone.hintText2);
        }

        const hasSpecialLayout = this.activeZone.specialLayout1 || this.activeZone.specialLayout2;
        const offsetX = hasSpecialLayout ? -320 : 70;

        this.hintLabel.setPosition(this.player.x + offsetX, this.player.y - 60);
        this.hintLabel.setVisible(true);
    }

    updateMobileUI() {
        this.mobileControls.setVisible(this.isMobileMode);
        this.keyboardHints.setVisible(!this.isMobileMode);
    }
    toggleSettings() { this.settingsPanel.setVisible(!this.settingsPanel.visible); }

    startPageTransition(targetSceneName, lastPosition, courseName, typeName){
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
                    detail: { text: `${targetSceneName} | ${courseName} | ${typeName} - An AI-Driven 8-bit Web Game For Personalized College Program Matching and Career Exploration` } 
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

                this.scene.start(targetSceneName, { 
                    selectedCourse: courseName,
                    selectedType: typeName,
                    prevPos: lastPosition 
                });
            }
        });
    }
}