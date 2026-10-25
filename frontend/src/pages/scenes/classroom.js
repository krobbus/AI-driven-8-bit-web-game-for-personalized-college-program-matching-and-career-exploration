import { db } from '../../config/firebase';
import { createMobileControls } from '/src/pages/utils/controls.js';
import { createKeyboardHints } from '/src/pages/utils/keyboardHints.js';
import { positionTopRightIcons } from '../utils/positionTopRightIcons';
import Settings from '/src/pages/prefabs/settings.js';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:10000' 
    : 'https://eight-bit-backend.onrender.com';

export default class Classroom extends Phaser.Scene {
    constructor() {
        super('Classroom');
        this.courseQuestions = [];
        this.currentQuestionIndex = 0;
        this.isAnswering = false;
        this.assessmentResults = [];
        this.isSettingsOpen = false;
        this.selectedOptionIndex = 0;
        this.currentOptions = [];
        this.isLoadingQuestions = false;
    }

    init(data) {
        if (!data || !data.selectedCourse) {
            console.warn("No course selected. Redirecting to Hallway...");
            this.time.delayedCall(1, () => {
                this.scene.start('Hallway'); 
            });
            return;
        }

        const courseNames = {
            CITCS: "COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER STUDIES (CITCS)",
            CCJ: "COLLEGE OF CRIMINAL JUSTICE (CCJ)",
            CBA: "COLLEGE OF BUSINESS ADMINISTRATION (CBA)",
            CAS: "COLLEGE OF ARTS AND SCIENCES (CAS)",
            CTE: "COLLEGE OF TEACHER EDUCATION (CTE)",
            COM: "COLLEGE OF MEDICINE (COM)",
            ISW: "INSTITUTE OF SOCIAL WORK (ISW)",
            IPPG: "INSTITUTE OF PUBLIC POLICY AND GOVERNANCE (IPPG)"
        };

        const typeNames = {
            CourseRelated: "COURSE-RELATED ASSESSMENT",
            Skill: "SKILL ASSESSMENT",
            Personality: "PERSONALITY ASSESSMENT",
        };

        this.courseCode = data.selectedCourse; 
        this.rawType = data.selectedType;
        this.selectedCourse = courseNames[data.selectedCourse] || "GENERAL";
        this.selectedType = typeNames[data.selectedType] || "ASSESSMENT";
    }

    async create() {
        const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
        const screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;

        const playerID = localStorage.getItem("playerID");
        const snapshot = await db.ref(`webGame/${playerID}`).once('value');
        if (!this.scene.isActive('Classroom')) return;
        const userData = snapshot.val();
        const playerName = (userData && userData.name) ? userData.name : "Guest";
        this.gender = (userData && userData.gender) ? userData.gender.toLowerCase() : 'male';

        this.bg = this.add.sprite(screenCenterX, screenCenterY, `default${this.gender}`).setScale(1.5);                // bg

        this.nameContainer = this.add.container(230, 300);                                                      // name tag
            this.nameText = this.add.text(0, 0, playerName, {
                fontFamily: '"Press Start 2P"',
                fontSize: "10px",
                fill: "#ffffff",
                align: "center",
                resolution: 4
            }).setOrigin(0.5);

            const namePadding = 8;
            const bgW = this.nameText.width + namePadding * 2;
            const bgH = this.nameText.height + namePadding;

            this.nameBg = this.add.graphics()
                .fillStyle(0x125729, 1)
                .fillRoundedRect(-bgW / 2, -bgH / 2, bgW, bgH, 5)
                .strokeRoundedRect(-bgW / 2, -bgH / 2, bgW, bgH, 5);
        this.nameContainer.add([this.nameBg, this.nameText]);
        this.nameContainer.setDepth(110);
        
        this.sound.stopAll();
        this.sound.removeAll();

        const startAudio = () => {
            if (this.gameAudio && this.gameAudio.isPlaying) return;
            if (this.sound.context.state === 'suspended') this.sound.context.resume();
            this.gameAudio = this.sound.add('classroombg', { loop: true });
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

        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.manual = this.add.sprite(this.scale.width - 60, 140, 'manual')                                         // manual
            .setDepth(3001)
            .setOrigin(1, 0)
            .setInteractive({ useHandCursor: true })
            .on("pointerdown", () => {
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
                const isModalOpened = document.querySelector('.modalBackdrop') || document.activeElement.tagName === 'INPUT';
                if (isModalOpened) return;
                this.settings.toggle()
            });
        positionTopRightIcons(this, this.manual, this.settingsIcon);
        this.activeZone = null;

        const savedMode = localStorage.getItem('mobileMode');
        if (savedMode === null) {
            this.isMobileMode = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            localStorage.setItem('mobileMode', this.isMobileMode);
        } else { this.isMobileMode = savedMode === 'true'; }
        
        this.mobileControls = createMobileControls(this);
        this.keyboardHints = createKeyboardHints(this, 'classroom');
        this.updateMobileUI();
        this.classroomAnims();
        this.showStartScreen();
    }

    classroomAnims() {
        const states = [
            'default', 'thinking',
            'student1', 'student2',
            'student3', 'student4',
            'student5', 'student6',
            'student7', 'student8'
        ];

        states.forEach(state => {
            const animKey = `${state}${this.gender}`;
            
            if (!this.anims.exists(animKey)) {
                this.anims.create({
                    key: animKey,
                    frames: this.anims.generateFrameNumbers(animKey, { start: 0, end: 1 }),
                    frameRate: 2, 
                    repeat: -1
                });
            }
        });
    }

    showStartScreen() {
        const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
        const screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;
 
        this.bg.play(`default${this.gender}`);
        this.questionUI('idle');

        this.promptContainer = this.add.container(screenCenterX, screenCenterY + 140).setDepth(130);
            this.promptText = this.add.text(0, 0, "PRESS ANY KEY TO START", {
                fontFamily: '"Press Start 2P"',
                fontSize: "10px",
                fill: "#ffffff",
                align: "center",
                resolution: 2
            }).setOrigin(0.5);

            const paddingX = 40;
            const paddingY = 25;
            const bgW = this.promptText.width + paddingX;
            const bgH = this.promptText.height + paddingY;

            this.promptContainerStyle = this.add.graphics()
                .fillStyle(0x486947, 1)
                .fillRoundedRect(-bgW / 2, -bgH / 2, bgW, bgH, 10);
        this.promptContainer.add([this.promptContainerStyle, this.promptText]);
 
        this.tweens.add({
            targets: this.promptContainer,
            alpha: 0.2,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
 
        this.startHandler = () => this.beginAssessment();
        this.time.delayedCall(300, () => {
            this.input.keyboard.once('keydown', this.startHandler);
            this.input.once('pointerdown', this.startHandler);
        });
    }

    beginAssessment() {
        this.input.keyboard.off('keydown', this.startHandler);
        this.input.off('pointerdown', this.startHandler);
 
        if (this.promptContainer) {
            this.promptContainer.destroy();
            this.promptContainer = null;
        }
        this.loadQuestions();
    }

    async loadQuestions(){
        const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
        const screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;

        this.isLoadingQuestions = true;
        this.disableAllOptions();

        this.bg.play(`thinking${this.gender}`);
        this.startThinkingAnimation();

        const isAssessment = this.rawType === 'Skill' || this.rawType === 'Personality';
        const errorOptionsCount = isAssessment ? 5 : 4;
        const endpoint = isAssessment ? '/api/generate-skill-pers' : '/api/generate-course-related';

        try {
            try {
                const ping = await fetch(`${API_BASE_URL}/`, { method: 'GET' });
            } catch {
                this.questionUI("The AI is warming up!\nThis usually takes 20–30 seconds on the first try.\nThank you for your patience!");
            }

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    courseName: this.courseCode,
                    quizType: this.rawType
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Unknown Server Error" }));
                throw new Error(errorData.error || `Server Error: ${response.status}`);
            }
            const data = await response.json();
            if (!this.scene.isActive('Classroom')) return;

            if (data.questions && data.questions.length > 0) {
                this.stopThinkingAnimation();

                this.courseQuestions = data.questions;
                this.currentQuestionIndex = 0;

                const firstQ = this.courseQuestions[0];
                this.questionUI(firstQ.question);
                this.optionsUI(firstQ.options || []);

                this.isLoadingQuestions = false;
                this.enableAllOptions();

                this.bg.play(`default${this.gender}`);
            } else { 
                throw new Error("Error: Empty questions list"); 
            }
        } catch {
            if (!this.scene.isActive('Classroom')) return;
            this.stopThinkingAnimation();
            this.isLoadingQuestions = false;
            this.questionUI("Oops! The AI took too long to respond.\nPlease try again in a moment.");
            this.optionsUI(["Retry"]);
            this.enableAllOptions(); 
        }
    }

    questionUI(question, hasReferences = false){
        if (this.questionWheelHandler) {
            this.input.off('wheel', this.questionWheelHandler);
            this.questionWheelHandler = null;
        }
        if (this.questionScrollHandlers) {
            this.input.off('pointerdown', this.questionScrollHandlers.pointerdown);
            this.input.off('pointermove', this.questionScrollHandlers.pointermove);
            this.input.off('pointerup', this.questionScrollHandlers.pointerup);
            this.input.off('pointerupoutside', this.questionScrollHandlers.pointerup);
            this.questionScrollHandlers = null;
        }
        if (this.questionContainer) {
            if (this.questionText) this.questionText.clearMask(true);
            if (this.questionMaskGraphics) this.questionMaskGraphics.destroy();
            this.questionContainer.destroy();
        }
        const isIdle = question === 'idle';
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;
        const screenCenterX = screenWidth / 2;
        const panelMargin = Math.min(24, screenWidth * 0.04, screenHeight * 0.04);
        const panelWidth = Math.max(1, screenWidth - panelMargin * 6);
        const panelX = (screenWidth - panelWidth) / 2;
        const panelY = Math.max(90, panelMargin);
        const panelHeight = Math.min(
            300,
            Math.max(130, screenHeight * 0.06) + (hasReferences ? 80 : 0),
            screenHeight - panelY - panelMargin
        );
        const panelPadding = Math.min(28, Math.max(16, screenWidth * 0.025));
        const headerTop = panelY + 18;

            const isRealQuestion = !isIdle 
                && question !== null && question !== undefined
                && this.courseQuestions.length > 0
                && this.currentQuestionIndex < this.courseQuestions.length
                && question === this.courseQuestions[this.currentQuestionIndex]?.question;
 
            let displayText;
            if (isIdle) { displayText = "Your questions will appear here.\nPress any key to begin the assessment."; } 
            else if (question === null || question === undefined) { displayText = ""; }
            else if (isRealQuestion) {displayText = `Q${this.currentQuestionIndex + 1}: ${question}`; }
            else { displayText = question; } 

        const courseText = this.add.text(screenCenterX, headerTop, this.selectedCourse, {
            fontFamily: '"Press Start 2P"',
            fontSize: "11px",
            color: "#ffffff",
            align: "center",
            wordWrap: { width: panelWidth - panelPadding * 2 },
            lineSpacing: 4,
            resolution: 2
        }).setOrigin(0.5, 0);
        const typeText = this.add.text(screenCenterX, courseText.y + courseText.height + 10, this.selectedType, {
            fontFamily: '"Press Start 2P"',
            fontSize: "9px",
            color: "#b7e4a8",
            align: "center",
            wordWrap: { width: panelWidth - panelPadding * 2 },
            resolution: 2
        }).setOrigin(0.5, 0);

        const dividerY = typeText.y + typeText.height + 16;
        const bodyTop = dividerY + 18;
        const bodyHeight = Math.max(40, panelY + panelHeight - bodyTop - 20);
        this.questionText = this.add.text(screenCenterX, bodyTop, displayText, {
            fontFamily: '"Press Start 2P"',
            fontSize: "11px",
            fill: "#ffffff",
            align: "center",
            fixedWidth: panelWidth - panelPadding * 2,
            wordWrap: { width: panelWidth - panelPadding * 2 },
            lineSpacing: 8,
            resolution: 2
        }).setOrigin(0.5, 0);

        const maskGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        maskGraphics.fillRect(panelX + panelPadding, bodyTop, panelWidth - panelPadding * 2, bodyHeight);
        this.questionMaskGraphics = maskGraphics;
        this.questionText.setMask(maskGraphics.createGeometryMask());
        this.questionScroll = {
            top: bodyTop,
            bottom: bodyTop + bodyHeight,
            minY: bodyTop + bodyHeight - this.questionText.height,
            maxY: bodyTop
        };
        this.questionPanelBounds = { top: panelY, bottom: panelY + panelHeight };

        const panelGraphics = this.add.graphics()
            .fillStyle(0x294235, 0.96)
            .lineStyle(3, 0xa3b18a, 1)
            .fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 14)
            .strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 14)
            .fillStyle(0x344e41, 1)
            .fillRoundedRect(panelX + 3, panelY + 3, panelWidth - 6, dividerY - panelY, 11)
            .lineStyle(2, 0x83c782, 1)
            .lineBetween(panelX + panelPadding, dividerY, panelX + panelWidth - panelPadding, dividerY);
        this.questionContainer = this.add.container(0, 0, [
            panelGraphics,
            courseText,
            typeText,
            this.questionText
        ]).setDepth(120);

        if (this.questionText.height > bodyHeight) {
            const scrollHint = this.add.text(panelX + panelWidth - panelPadding, panelY + panelHeight - 10, "SCROLL TO READ", {
                fontFamily: '"Press Start 2P"',
                fontSize: "6px",
                color: "#b7e4a8",
                align: "right",
                resolution: 2
            }).setOrigin(1, 1);
            this.questionContainer.add(scrollHint);

            this.questionWheelHandler = (pointer, gameObjects, deltaX, deltaY) => {
                if (pointer.x < panelX || pointer.x > panelX + panelWidth
                    || pointer.y < bodyTop || pointer.y > bodyTop + bodyHeight) return;
                this.questionText.y = Phaser.Math.Clamp(
                    this.questionText.y - deltaY * 0.5,
                    this.questionScroll.minY,
                    this.questionScroll.maxY
                );
            };
            this.input.on('wheel', this.questionWheelHandler);

            const pointerState = { active: false, lastY: 0 };
            const pointerdown = pointer => {
                pointerState.active = pointer.x >= panelX && pointer.x <= panelX + panelWidth
                    && pointer.y >= bodyTop && pointer.y <= bodyTop + bodyHeight;
                pointerState.lastY = pointer.y;
            };
            const pointermove = pointer => {
                if (!pointerState.active || !pointer.isDown) return;
                this.questionText.y = Phaser.Math.Clamp(
                    this.questionText.y + pointer.y - pointerState.lastY,
                    this.questionScroll.minY,
                    this.questionScroll.maxY
                );
                pointerState.lastY = pointer.y;
            };
            const pointerup = () => { pointerState.active = false; };
            this.questionScrollHandlers = { pointerdown, pointermove, pointerup };
            this.input.on('pointerdown', pointerdown);
            this.input.on('pointermove', pointermove);
            this.input.on('pointerup', pointerup);
            this.input.on('pointerupoutside', pointerup);
        }
    }

    disableAllOptions() {
        if (!this.optionButtons) return;

        this.optionButtons.forEach(btn => {
            if (!btn.graphics || !btn.graphics.scene) return;
            btn.graphics.disableInteractive();
            btn.container.setAlpha(0.5);
        });
    }

    enableAllOptions() {
        if (!this.optionButtons) return;

        this.optionButtons.forEach(btn => {
            if (!btn.graphics || !btn.graphics.scene) return;
            const hitArea = new Phaser.Geom.Rectangle(-btn.w / 2, -btn.h / 2, btn.w, btn.h);
            btn.graphics.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
            btn.container.setAlpha(1);
        });
    }

    optionsUI(options) {
        if (this.optionsContainer) this.optionsContainer.destroy();
        this.currentOptions = options;
        this.selectedOptionIndex = 0;
        this.optionButtons = [];

        const screenHeight = this.scale.height;
        const screenWidth = this.scale.width;
        const isAssessment = this.rawType === 'Skill' || this.rawType === 'Personality';
        const horizontalGap = 14;
        const verticalGap = 12;
        const sideMargin = 28;
        const columns = isAssessment ? Math.min(3, Math.max(1, options.length)) : Math.min(2, Math.max(1, options.length));
        const buttonWidth = isAssessment
            ? Math.min(240, (screenWidth - sideMargin * 2 - horizontalGap * 2) / 3)
            : Math.min(520, (screenWidth - sideMargin * 2 - horizontalGap) / 2);
        const rows = [];
        const optionItems = [];

        options.forEach((optionText, index) => {
            const label = String.fromCharCode(65 + index);
            const displayText = isAssessment || optionText === "Retry" ? optionText : `${label}. ${optionText}`;
            const text = this.add.text(0, 0, displayText, {
                fontFamily: '"Press Start 2P"',
                fontSize: "8px",
                align: "center",
                fill: "#ffffff",
                wordWrap: { width: buttonWidth - 36 },
                lineSpacing: 6,
                resolution: 2
            }).setOrigin(0.5);
            const item = { optionText, text };
            optionItems.push(item);
            const rowIndex = Math.floor(index / columns);
            if (!rows[rowIndex]) rows[rowIndex] = [];
            rows[rowIndex].push(item);
        });

        rows.forEach(row => {
            row.height = Math.max(...row.map(item => item.text.height)) + 28;
        });
        const availableTop = (this.questionPanelBounds?.bottom || screenHeight * 0.45) + 20;
        const availableBottom = screenHeight - 36;
        const availableHeight = availableBottom - availableTop;
        this.optionsContainer = this.add.container(screenWidth / 2, 0).setDepth(130);

        const personalitySlots = new Map([
            ['strongly agree', { row: 'top', column: 0 }],
            ['neutral', { row: 'top', column: 1 }],
            ['strongly disagree', { row: 'top', column: 2 }],
            ['agree', { row: 'bottom', column: 0 }],
            ['disagree', { row: 'bottom', column: 1 }]
        ]);
        const personalityLayout = this.rawType === 'Personality'
            && optionItems.length === personalitySlots.size
            && new Set(optionItems.map(item => item.optionText.trim().toLowerCase())).size === personalitySlots.size
            && optionItems.every(item => personalitySlots.has(item.optionText.trim().toLowerCase()));
        if (personalityLayout) {
            this.selectedOptionIndex = optionItems.findIndex(
                item => item.optionText.trim().toLowerCase() === 'neutral'
            );
        }
        const positions = new Map();

        if (personalityLayout) {
            const groups = { top: [], bottom: [] };
            optionItems.forEach(item => {
                groups[personalitySlots.get(item.optionText.trim().toLowerCase()).row].push(item);
            });
            const groupHeights = {
                top: Math.max(...groups.top.map(item => item.text.height)) + 28,
                bottom: Math.max(...groups.bottom.map(item => item.text.height)) + 28
            };
            const totalHeight = groupHeights.top + groupHeights.bottom + verticalGap;
            const startY = availableTop + Math.max(0, (availableHeight - totalHeight) / 2);
            const centers = {
                top: startY + groupHeights.top / 2,
                bottom: startY + groupHeights.top + verticalGap + groupHeights.bottom / 2
            };
            const topStartX = -buttonWidth - horizontalGap;
            const bottomStartX = -(buttonWidth + horizontalGap) / 2;

            optionItems.forEach(item => {
                const { row, column } = personalitySlots.get(item.optionText.trim().toLowerCase());
                const x = row === 'top'
                    ? topStartX + column * (buttonWidth + horizontalGap)
                    : bottomStartX + column * (buttonWidth + horizontalGap);
                positions.set(item, { x, y: centers[row], height: groupHeights[row] });
            });
        } else {
            const totalHeight = rows.reduce((height, row) => height + row.height, 0)
                + Math.max(0, rows.length - 1) * verticalGap;
            let rowY = availableTop + Math.max(0, (availableHeight - totalHeight) / 2);
            rows.forEach((row, rowIndex) => {
                const rowWidth = row.length * buttonWidth + (row.length - 1) * horizontalGap;
                row.forEach((item, columnIndex) => {
                    const x = -rowWidth / 2 + buttonWidth / 2 + columnIndex * (buttonWidth + horizontalGap);
                    positions.set(item, { x, y: rowY + row.height / 2, height: row.height });
                });
                rowY += row.height + (rowIndex < rows.length - 1 ? verticalGap : 0);
            });
        }

        optionItems.forEach(item => {
            const position = positions.get(item);
            const buttonGraphics = this.add.graphics()
                .fillStyle(0x344e41, 1)
                .lineStyle(2, 0xa3b18a, 1)
                .fillRoundedRect(-buttonWidth / 2, -position.height / 2, buttonWidth, position.height, 10)
                .strokeRoundedRect(-buttonWidth / 2, -position.height / 2, buttonWidth, position.height, 10);
            const hitArea = new Phaser.Geom.Rectangle(-buttonWidth / 2, -position.height / 2, buttonWidth, position.height);
            buttonGraphics.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains)
                .on('pointerover', () => {
                    if (!this.isSettingsOpen && !this.isLoadingQuestions) buttonGraphics.setAlpha(0.8);
                })
                .on('pointerout', () => buttonGraphics.setAlpha(1))
                .on('pointerdown', () => {
                    if (this.isSettingsOpen || this.isLoadingQuestions) return;
                    if (item.optionText === "Retry") this.loadQuestions();
                    else this.handleAnswer(item.optionText);
                });

            const buttonContainer = this.add.container(position.x, position.y, [buttonGraphics, item.text]);
            this.optionsContainer.add(buttonContainer);
            this.optionButtons.push({
                container: buttonContainer,
                graphics: buttonGraphics,
                text: item.optionText,
                w: buttonWidth,
                h: position.height
            });
        });
        this.highlightOption(this.selectedOptionIndex);
    }

    highlightOption(index) {
        if (!this.optionButtons || this.optionButtons.length === 0) return;
        this.optionButtons.forEach((btn, i) => {
            btn.graphics.clear();
            const isSelected = i === index;
            btn.graphics
                .fillStyle(isSelected ? 0x588157 : 0x344e41, 1)
                .lineStyle(2, isSelected ? 0xffffff : 0xa3b18a, 1)
                .fillRoundedRect(-btn.w / 2, -btn.h / 2, btn.w, btn.h, 10)
                .strokeRoundedRect(-btn.w / 2, -btn.h / 2, btn.w, btn.h, 10);
        });
    }

    moveOptionSelection(direction) {
        if (!this.optionButtons || this.optionButtons.length < 2) return;

        const current = this.optionButtons[this.selectedOptionIndex];
        if (!current) return;

        const currentBounds = current.container.getBounds();
        const currentX = currentBounds.centerX;
        const currentY = currentBounds.centerY;
        let nearestIndex = this.selectedOptionIndex;
        let nearestScore = Infinity;

        this.optionButtons.forEach((button, index) => {
            if (index === this.selectedOptionIndex) return;

            const bounds = button.container.getBounds();
            const deltaX = bounds.centerX - currentX;
            const deltaY = bounds.centerY - currentY;
            const primaryDistance = direction === 'left' ? -deltaX
                : direction === 'right' ? deltaX
                    : direction === 'up' ? -deltaY : deltaY;
            if (primaryDistance <= 0) return;

            const secondaryDistance = direction === 'left' || direction === 'right'
                ? Math.abs(deltaY)
                : Math.abs(deltaX);
            const score = primaryDistance + secondaryDistance * 2;
            if (score < nearestScore) {
                nearestScore = score;
                nearestIndex = index;
            }
        });

        if (nearestIndex !== this.selectedOptionIndex) {
            this.selectedOptionIndex = nearestIndex;
            this.highlightOption(nearestIndex);
        }
    }

    startThinkingAnimation() {
        let dotCount = 0;
        const isAssessment = this.rawType === 'Skill' || this.rawType === 'Personality';
        const placeholderCount = isAssessment ? 5 : 4;

        this.thinkingTimer = this.time.addEvent({
            delay: 500,
            callback: () => {
                dotCount = (dotCount + 1) % 4;
                const dots = ".".repeat(dotCount);
                
                this.questionUI(`Connecting to the AI...\nHang tight! This might take a few seconds${dots}`);
                this.optionsUI(Array(placeholderCount).fill(dots));
            },
            loop: true
        });
    }
    stopThinkingAnimation() { if (this.thinkingTimer) this.thinkingTimer.remove(); }

    getStudentPos(id) {
        const positions = {
            1: { x: 130, y: 410 }, 2: { x: 230, y: 310 }, 
            3: { x: 330, y: 410 }, 4: { x: 430, y: 310 },
            5: { x: 860, y: 410 }, 6: { x: 960, y: 310 }, 
            7: { x: 1060, y: 410 }, 8: { x: 1160, y: 310 }
        };
        return positions[id];
    }

    handleAnswer(selectedOption) {
        if (this.isAnswering) return;

        const isAssessment = this.rawType === 'Skill' || this.rawType === 'Personality';
        if (this.optionsContainer) this.optionsContainer.setVisible(false);

        const currentQ = this.courseQuestions[this.currentQuestionIndex];
        if (!currentQ) return;

        this.isAnswering = true;
        this.disableAllOptions();

        if (isAssessment) {
            const answerAudio = this.sound.add('answeraudio');
            answerAudio.once('complete', () => answerAudio.destroy());
            answerAudio.play();
        }
        
        const npcCount = isAssessment ? 4 : 3;
        const shuffledNPCs = [1, 3, 4, 5, 6, 7, 8].sort(() => 0.5 - Math.random()).slice(0, npcCount);

        const assessmentPool = ["Strongly Agree", "Agree", "Neutral"];
        const otherOptions = isAssessment
            ? shuffledNPCs.map(() => assessmentPool[Math.floor(Math.random() * assessmentPool.length)])
            : currentQ.options.filter(opt => opt !== selectedOption).sort(() => 0.5 - Math.random());

        const sequence = [
            { id: 2, option: selectedOption, isPlayer: true },
            ...shuffledNPCs
                .map((npcId, i) => ({ 
                    id: npcId, 
                    option: otherOptions[i] || "...", 
                    isPlayer: false 
                }))
        ];

        let delayTimer = 0;
        sequence.forEach((turn) => {
            this.time.delayedCall(delayTimer, () => {
                this.bg.play(`student${turn.id}${this.gender}`, true);
                
                const pos = this.getStudentPos(turn.id);
                this.showAnswerBubble(turn.option, pos.x, pos.y, "pending", turn.isPlayer);
            });
            delayTimer += 800;
            this.time.delayedCall(delayTimer, () => { this.bg.play(`default${this.gender}`, true); });
            delayTimer += 200;
        });

        if (isAssessment) {
            currentQ.userResponse = selectedOption;

            this.assessmentResults.push({
                question: currentQ.question,
                answer: selectedOption
            });

            let dotCount = 0;
            this.timer = this.time.addEvent({
                delay: 500,
                callback: () => {
                    dotCount = (dotCount + 1) % 4;
                    const dots = ".".repeat(dotCount);    
                    
                    this.questionUI(`Next Question${dots}`);
                },
                loop: true
            });

            this.time.delayedCall(delayTimer + 1200, () => {
                this.cleanupAndNext(); 
            });
        } else {
            const correctAnswer = currentQ.answer || currentQ.correctAnswer;
            const isCorrect = selectedOption === correctAnswer;

            this.assessmentResults.push({
                question: currentQ.question,
                options: currentQ.options,
                answer: correctAnswer,
                selected: selectedOption,
                unanswered: currentQ.options.filter(opt => opt !== selectedOption),
                explanation: currentQ.explanation || "",
                source: currentQ.source || "",
                url: currentQ.url || "",
                correct: isCorrect
            });

            this.time.delayedCall(delayTimer + 2000, () => {
                const resultAudio = this.sound.add(isCorrect ? 'correctaudio' : 'wrongaudio');
                resultAudio.once('complete', () => resultAudio.destroy());
                resultAudio.play();

                this.questionUI(`The correct answer is:\n${correctAnswer}`);
                this.children.list
                    .filter(c => c.name === 'answerBubble')
                    .forEach(b => this.highlightBubble(b, b.getData('text') === correctAnswer));
            });
            this.time.delayedCall(delayTimer + 8000, () => { 
                this.children.list
                    .filter(c => c.name === 'answerBubble')
                    .forEach(c => c.destroy());
                const expParts = [currentQ.explanation || ""];
                if (currentQ.source) expParts.push(`Source: ${currentQ.source}`);
                if (currentQ.url) expParts.push(`${currentQ.url}`);
                this.questionUI(expParts.join("\n\n"), Boolean(currentQ.source || currentQ.url));
            });
            this.time.delayedCall(delayTimer + 15000, () => { this.cleanupAndNext(); });
        }
    }

    showAnswerBubble(text, x, y, status, isPlayer) {
        const container = this.add.container(x, y);
        container.setName('answerBubble');
        container.setData('text', text);
            let bgColor = 0x344E41;
            if (status === "correct") bgColor = 0x588157;
            if (status === "wrong") bgColor = 0xBC4749;

            const answerText = this.add.text(0, 0, `"${text}"`, {
                fontFamily: '"Press Start 2P"',
                fontSize: "10px",
                fill: "#ffffff",
                align: "center",
                wordWrap: { width: 160 },
                resolution: 2
            }).setOrigin(0.5);

            const padding = 10;
            const bgW = Math.max(60, answerText.width + padding * 2);
            const bgH = answerText.height + padding * 2;
            const bubbleColor = isPlayer ? 0x588157 : 0x486947;

            const bubbleBg = this.add.graphics()
                .setName('bg')
                .fillStyle(bubbleColor, 1)
                .lineStyle(2, 0xA3B18A, 1)
                .fillRoundedRect(-bgW / 2, -bgH / 2, bgW, bgH, 10)
                .strokeRoundedRect(-bgW / 2, -bgH / 2, bgW, bgH, 10);
            
            bubbleBg.fillTriangle(
                -6, bgH / 2, 
                6, bgH / 2, 
                0, bgH / 2 + 12
            );
        container.add([bubbleBg, answerText]);
        container.setDepth(150);
        container.setScale(0);

        this.tweens.add({
            targets: container,
            scale: 1,
            duration: 300,
            delay: isPlayer ? 0 : Phaser.Math.Between(100, 500),
            ease: 'Back.out'
        });
    }

    highlightBubble(container, isCorrect) {
        const bg = container.getByName('bg');
        const text = container.list.find(child => child instanceof Phaser.GameObjects.Text);
        bg.clear();

        const color = isCorrect ? 0x588157 : 0xBC4749;
        const bgW = Math.max(60, text.width + 16);
        const bgH = text.height + 16;

        bg.fillStyle(color, 1)
            .lineStyle(2, 0xffffff, 1)
            .fillRoundedRect(-bgW / 2, -bgH / 2, bgW, bgH, 8)
            .strokeRoundedRect(-bgW / 2, -bgH / 2, bgW, bgH, 8);
        bg.fillTriangle(-5, bgH / 2, 5, bgH / 2, 0, bgH / 2 + 10);
        
        this.tweens.add({
            targets: container,
            y: container.y - 10,
            duration: 100,
            yoyo: true,
            ease: 'Power1'
        });
    }

    cleanupAndNext() {
        if (this.timer) this.timer.remove();
        this.isAnswering = false;
        this.currentQuestionIndex++;

        this.children.list
            .filter(c => c.name === 'answerBubble')
            .forEach(c => c.destroy());

        if (this.currentQuestionIndex < this.courseQuestions.length) {
            const nextQ = this.courseQuestions[this.currentQuestionIndex];
            this.questionUI(nextQ.question);
            this.optionsUI(nextQ.options || []);
            if (this.optionsContainer) this.optionsContainer.setVisible(true);
        } else { this.finishAssessment(); }
    }

    finishAssessment() {
        this.questionUI("Assessment Complete! Analyzing your career matches...");
        this.bg.play(`default${this.gender}`);
        if (this.optionsContainer) this.optionsContainer.destroy();

        this.saveAssessmentResults();

        const isAssessment = this.rawType === 'Skill' || this.rawType === 'Personality';
        this.time.delayedCall(1200, () => {
            window.dispatchEvent(new CustomEvent('openResultModal', {
                detail: {
                    results: this.assessmentResults,
                    rawType: this.rawType,
                    courseCode: this.courseCode
                }
            }));

            window.addEventListener('resultModalClosed', () => {
                this.startPageTransition('Hallway');
            }, { once: true });
        });
    }

    async saveAssessmentResults(){
        try {
            const playerID = localStorage.getItem("playerID");
            if (!playerID) return;
 
            const key = `${this.courseCode}_${this.rawType}`;
            const baseRef = db.ref(`webGame/${playerID}/assessments/${key}`);
 
            const snapshot = await baseRef.once('value');
            const existing  = snapshot.val();
            const existingResults = (existing && existing.results) ? existing.results : {};
            const nextTakeIndex = Object.keys(existingResults).length;
 
            const questionsMap = {};
            this.assessmentResults.forEach((item, i) => {
                questionsMap[i] = item;
            });
 
            const score = this.rawType === 'CourseRelated'
                ? { correct: this.assessmentResults.filter(r => r.correct).length }
                : null;
 
            const meta = {
                course: this.courseCode,
                type: this.rawType,
                lastTakeAt: Date.now(),
                totalTakes: nextTakeIndex + 1,
                ...(score && { latestScore: score })
            };
            await baseRef.update(meta);
 
            await baseRef.child(`results/${nextTakeIndex}`).set({
                completedAt: Date.now(),
                ...(score && { score }),
                questions: questionsMap
            });
 
        } catch (err) {
            console.error("Failed to save assessment results:", err);
        }
    }

    update(){ 
        if (!this.mobileControls) return; 

        if (this.optionButtons && this.optionButtons.length > 0 && !this.isAnswering && this.currentOptions.length > 0 && !this.isLoadingQuestions) {
            const upJustDown =
                Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP)) ||
                Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)) ||
                (this.mobileControls.isDpadUpJustDown ? this.mobileControls.isDpadUpJustDown() : false);
            const downJustDown =
                Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN)) ||
                Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)) ||
                (this.mobileControls.isDpadDownJustDown ? this.mobileControls.isDpadDownJustDown() : false);
            const leftJustDown =
                Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT)) ||
                Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)) ||
                (this.mobileControls.isDpadLeftJustDown ? this.mobileControls.isDpadLeftJustDown() : false);
            const rightJustDown =
                Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT)) ||
                Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)) ||
                (this.mobileControls.isDpadRightJustDown ? this.mobileControls.isDpadRightJustDown() : false);
            const confirmJustDown =
                Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)) ||
                Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)) ||
                this.mobileControls.isInteractJustDown();

            if (upJustDown) this.moveOptionSelection('up');
            if (downJustDown) this.moveOptionSelection('down');
            if (leftJustDown) this.moveOptionSelection('left');
            if (rightJustDown) this.moveOptionSelection('right');

            if (confirmJustDown || this.isLoadingQuestions) {
                const selected = this.currentOptions[this.selectedOptionIndex];
                if (selected) selected === "Retry" ? this.loadQuestions() : this.handleAnswer(selected);
            }
        }
    }
    
    updateMobileUI() {
        this.mobileControls.setVisible(this.isMobileMode);
        this.keyboardHints.setVisible(!this.isMobileMode && !this.hideKeys);
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