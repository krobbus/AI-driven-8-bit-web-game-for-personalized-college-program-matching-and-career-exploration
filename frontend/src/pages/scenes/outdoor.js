import { db } from '../../config/firebase';
import Player from '/src/pages/prefabs/player.js';
import NPC from '/src/pages/prefabs/npc.js';
import DialogueBubble from '/src/pages/prefabs/dialoguebubble.js';
import { createMobileControls } from '/src/pages/utils/controls.js';
import { createKeyboardHints } from '/src/pages/utils/keyboardHints.js';
import Settings from '/src/pages/prefabs/settings.js';

export default class Outdoor extends Phaser.Scene {
    constructor() {
        super('Outdoor');
        this.lastInteractionTime = 0;
        this.interactionCooldown = 300;
    }

    async create() {
        const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
        const screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;

        this.bg = this.add.sprite(screenCenterX, screenCenterY, 'outdoorbg').setScale(1.5);                 // bg
        this.physics.world.setBounds(70, 260, 1160, 220);                                                   // bounds
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

        if (lastPosition && lastScene === 'Outdoor') {
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

        this.player = new Player(this, spawnX, spawnY, gender, this.playerName)                                          // player
            .setDepth(1)
            .setScale(1.8);

        this.npc1 = new NPC(this, 500, 420, 'female1').setScale(1.8);
        this.npcDialogue1 = new DialogueBubble(
            this,
            this.npc1,
            [
                "Hello there, welcome to the campus! Your journey starts with a single step.",
                "Check the manual at the top-right of the screen if you need guidance.",
                "This campus has a lot to explore — make sure to check every corner!",
                "The hallway inside has 8 doors, each leading to a different college course.",
                "You can take three types of assessments per course — Skill, Personality, and Course-Related.",
                "Answer every question honestly — the AI uses your responses to match you with the right program.",
                "Once you complete all three assessments for a course, the AI will generate an analysis just for you!",
                "Oh, and do not forget to visit the Left Wing — you can manage your profile and track your progress there.",
                "The Right Wing has the Leaderboard — see how you rank against other students!"
            ],
            {
                offsetX: -20,
                offsetY: -60,
                maxWidth: 220,
                typeDelay: 45,
                linePause: 2000,
                loop: false,
                depth: 200,
                onComplete: () => this.npcDialogue1.resetToIdle()
            }
        );

        this.professor = new NPC(this, 760, 290, 'professor').setScale(1.8);
        this.npcDialogueProfessor = new DialogueBubble(
            this,
            this.professor,
            [
                "Welcome, student. I'm your AI Professor, your guide in this career exploration journey.",
                "Before you proceed, I highly encourage you to create your profile and define your preferences first.",
                "It includes your personal information, preferred course, current skills, and interests.",
                "These details will be used by our AI to tailor its analysis and recommendations specifically for you.",
                "Without a profile, the AI cannot generate a personalized career and program suggestion.",
                "You may create your account through the Account Management found in the Left Wing.",
                "Remember! the more honest and accurate your inputs are, the better your results will be.",
                "Good luck on your journey, student. The campus awaits you!"
            ],
            {
                offsetX: -20,
                offsetY: -60,
                maxWidth: 220,
                typeDelay: 45,
                linePause: 2000,
                loop: false,
                depth: 200,
                onComplete: () => this.npcDialogueProfessor.resetToIdle()
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
                                                                          
        this.manual = this.add.sprite(this.scale.width - 60, 140, 'manual')                                         // manual
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
        this.add.sprite(this.scale.width - 60, 80, 'settings')
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
    
        let debugGraphics = this.add.graphics();//.lineStyle(2, 0x00ff00, 1);
        this.activeZone = null;

        this.zones = [ 
            { 
                x: 850, y: 230, w: 160, h: 60,
                hintText1: "DO YOU WANT TO", hintText2: "ENTER LEFT WING ?",
                hintHeight: 50, hintWidth: 210, gapY: 15,
                spawnInNextScene: { x: 870, y: 430 }, target: 'LeftWing'
            },
            {
                x: 730, y: 300, w: 60, h: 30,
                hintText1: "APPROACH THE PROFESSOR ?",
                hintHeight: 30, hintWidth: 280, gapY: 0,
                target: 'talkToProf'
            },
            { 
                x: 1050, y: 300, w: 60, h: 100,
                hintText1: "DO YOU WANT TO", hintText2: "ENTER RIGHT WING ?",
                hintHeight: 50, hintWidth: 220, gapY: 15, specialLayout: true,
                spawnInNextScene: { x: 420, y: 430 }, target: 'RightWing'
            },
            {
                x: 470, y: 430, w: 60, h: 30,
                hintText1: "INTERACT WITH HER ?",
                hintHeight: 30, hintWidth: 230, gapY: 0,
                target: 'talkToNPC1'
            }
        ];
        this.zones.forEach(z => { debugGraphics.strokeRect(z.x, z.y, z.w, z.h); });

        const savedMode = localStorage.getItem('mobileMode');
        if (savedMode === null) {
            this.isMobileMode = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            localStorage.setItem('mobileMode', this.isMobileMode);
        } else { this.isMobileMode = savedMode === 'true'; }
        
        this.mobileControls = createMobileControls(this);
        this.keyboardHints = createKeyboardHints(this);
        this.createUIElements();
        this.updateMobileUI();
        window.dispatchEvent(new CustomEvent('openProfileSetupHintModal'));
    }

    createUIElements(){
        const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
        const screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;

        const obstacles = [                                                                            // obstacles
            { x: 350, y: 240, w: 610, h: 340 },
            { x: 410, y: 250, w: 720, h: 100 },
            { x: 1180, y: 240, w: 140, h: 340 },
            { x: 1150, y: 250, w: 100, h: 100 }
        ];
            this.obstacleGroup = this.physics.add.staticGroup(); 
        obstacles.forEach(ob => {
            let obstacle = this.add.rectangle(ob.x, ob.y, ob.w, ob.h);
            this.obstacleGroup.add(obstacle);
        });
        this.physics.add.collider(this.player, this.obstacleGroup);                                     // collider
        this.physics.add.collider(this.player, this.npc1);
        this.physics.add.collider(this.player, this.professor);

        this.stairZones = [                                                                             // stairs
            new Phaser.Geom.Rectangle(730, 230, 380, 70),
            new Phaser.Geom.Rectangle(600, 350, 520, 70)
        ];
        this.stairDebug = this.add.graphics()
            //.lineStyle(2, 0x00ffff, 1)
            .setDepth(100);
        this.stairZones.forEach(z => {
            this.stairDebug.strokeRect(z.x, z.y, z.width, z.height);
        });

        this.hintBubble = this.add.graphics()                                                            // hint
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
        if (this.npcDialogue1) this.npcDialogue1.update();
        
        const onStairs = this.stairZones.some(z => Phaser.Geom.Rectangle.Contains(z, this.player.x, this.player.y));
        if (onStairs) { this.applyStairPhysics() } else { this.player.body.setAllowGravity(true) }; 
        this.checkProximity();
    }

    checkProximity() {
        this.activeZone = this.zones.find(z => {
            return (
                this.player.x >= z.x && this.player.x <= z.x + z.w &&
                this.player.y >= z.y && this.player.y <= z.y + z.h
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

                if (this.activeZone.target === 'talkToNPC1') {
                    if (isInteracting) {
                        if (this.npcDialogue1.isPlaying) return;
                        const interactAudio = this.sound.add('interactaudio');
                        interactAudio.once('complete', () => interactAudio.destroy());
                        interactAudio.play();
                        
                        this.npcDialogue1.play();
                    }
                } else if (this.activeZone.target === 'talkToProf'){
                    if (isInteracting) {
                        if (this.npcDialogueProfessor.isPlaying) return;
                        const interactAudio = this.sound.add('interactaudio');
                        interactAudio.once('complete', () => interactAudio.destroy());
                        interactAudio.play();
                        
                        this.npcDialogueProfessor.play();
                    }
                } else {
                    if (this.activeZone.target === 'RightWing') {
                        if (!this.playerName || this.playerName === 'Guest') {
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
                this.hintLabel.setPosition(this.player.x - 220, this.player.y - this.activeZone.gapY);
            } else {
                this.hintLabel.setPosition(this.player.x + 50, this.player.y - this.activeZone.gapY);
            }
            this.hintLabel.setVisible(true);
        } else {
            this.hintLabel.setVisible(false);
        }
    }

    showBlockedHint() {
        window.dispatchEvent(new CustomEvent('openProfileSetupHintModal'));
    }

    applyStairPhysics(isRunning) {
        const body = this.player.body;
        const dampening = isRunning ? 0.15 : 0.4;
        const slope = 0.9;
        
        if (Math.abs(body.velocity.y) > 0.1) {
            body.setAllowGravity(false);
            body.velocity.y *= dampening;
            body.velocity.x = -(body.velocity.y * slope);

            const maxStairSpeed = isRunning ? 80 : 40;
            body.velocity.y = Phaser.Math.Clamp(body.velocity.y, -maxStairSpeed, maxStairSpeed);
            body.velocity.x = Phaser.Math.Clamp(body.velocity.x, -maxStairSpeed, maxStairSpeed);
        }
    }

    updateMobileUI() {
        this.mobileControls.setVisible(this.isMobileMode);
        this.keyboardHints.setVisible(!this.isMobileMode);
    }
    toggleSettings() { this.settingsPanel.setVisible(!this.settingsPanel.visible); }

    startPageTransition(targetSceneName, lastPosition) {
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