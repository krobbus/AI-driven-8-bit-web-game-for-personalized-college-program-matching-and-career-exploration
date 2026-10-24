import { db } from '../../config/firebase';
import { createMobileControls } from '/src/pages/utils/controls.js';
import { createKeyboardHints } from '/src/pages/utils/keyboardHints.js';
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
        this.add.sprite(this.scale.width - 60, 80, 'settings')
            .setDepth(3001)
            .setOrigin(1, 0)
            .setInteractive({ useHandCursor: true })
            .on("pointerdown", () => {
                const isModalOpened = document.querySelector('.modalBackdrop') || document.activeElement.tagName === 'INPUT';
                if (isModalOpened) return;
                this.settings.toggle()
            });
        
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
            this.questionUI("Oops! The AI took too long to respond.\nPlease try again in a moment.");
            this.optionsUI(["Retry"]);
            this.enableAllOptions(); 
        }
    }

    questionUI(question){
        if (this.questionContainer) this.questionContainer.destroy();
        const isIdle = question === 'idle';

        this.questionContainer = this.add.container(0, 75).setDepth(120);
            const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2; 

            const padding = 30;
            const bottomPad = 24;
            const headerGap = 8;
            const dividerGap = padding / 2;
            const bodyTop = 10; 
            const verticalGap = 5;

            const tempCourseText = this.add.text(-9999, -9999, this.selectedCourse, {
                fontFamily: '"Press Start 2P"', 
                fontSize: "12px"
            });

            const tempTypeText = this.add.text(-9999, -9999, this.selectedType, {
                fontFamily: '"Press Start 2P"', 
                fontSize: "10px"
            });

            const headerWidth = Math.max(tempCourseText.width, tempTypeText.width) + 160;

            this.headerWidth = headerWidth;
                tempCourseText.destroy();
                tempTypeText.destroy();
            
            const boxWidth = this.headerWidth + 160;
            const boxY = verticalGap;

            const CourseText = this.add.text(screenCenterX, boxY + padding, `${this.selectedCourse}`, {
                fontFamily: '"Press Start 2P"',
                fontSize: "12px",
                color: "#ffffff",
                align: "center",
                resolution: 2
            }).setOrigin(0.5, 0);

            const typeText = this.add.text(screenCenterX, CourseText.y + CourseText.height + headerGap, `${this.selectedType}`, {
                fontFamily: '"Press Start 2P"',
                fontSize: "10px",
                color: "#83c782",
                align: "center",
                resolution: 2
            }).setOrigin(0.5, 0);

            const dividerY = typeText.y + typeText.height + dividerGap;

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
                   
            this.questionText = this.add.text(screenCenterX, dividerY + bodyTop + padding / 2, displayText, {
                fontFamily: '"Press Start 2P"',
                fontSize: "12px",
                fill: "#ffffff",
                align: "center",
                wordWrap: { width: boxWidth - (padding * 2) },
                lineSpacing: 10,
                resolution: 2
            }).setOrigin(0.5, 0);

            const totalHeight = (dividerY - boxY) + bodyTop + padding / 2 + this.questionText.height + bottomPad;
            this.headerBottom = boxY + totalHeight + verticalGap;

            const headerBg = this.add.graphics()
                .fillStyle(0x344E41, 1)
                .fillRoundedRect(screenCenterX - boxWidth / 2, boxY, boxWidth, dividerY - boxY, 10);
 
            const headerBgOverlap = this.add.graphics()
                .fillStyle(0x344E41, 1)
                .fillRect(screenCenterX - boxWidth / 2, dividerY - 10, boxWidth, 10);
            
            const dividerLine = this.add.graphics()
                .lineBetween(
                    screenCenterX - boxWidth / 2 + padding, dividerY,
                    screenCenterX + boxWidth / 2 - padding, dividerY
                );

            this.questionContainerStyle = this.add.graphics()
                .fillStyle(0x486947, 1)
                .lineStyle(2, 0xA3B18A, 1)
                .fillRoundedRect(screenCenterX - boxWidth / 2, boxY, boxWidth, totalHeight, 10)
                .strokeRoundedRect(screenCenterX - boxWidth / 2, boxY, boxWidth, totalHeight, 10);

        this.questionContainer.add([
            this.questionContainerStyle,
            headerBg,
            headerBgOverlap,
            dividerLine,
            CourseText,
            typeText,
            this.questionText
        ]);
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
            const hitArea = new Phaser.Geom.Rectangle(0, 0, btn.w, btn.h);
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

        if (isAssessment) {
            this.optionsContainer = this.add.container(screenWidth / 2, screenHeight - 190).setDepth(130);
        
            const paddingSide = 24;
            const paddingTopBottom = 14;
            const maxWidth = 300;

            this.optionButtons = [];

            options.forEach((optionText) => {
                let offsetX = 0;
                let offsetY = 0;

                const textCheck = optionText.toUpperCase().trim();
                if (textCheck.includes("STRONGLY DISAGREE")) { offsetX = 105; offsetY = 50; }
                else if (textCheck.includes("STRONGLY AGREE")) { offsetX = -105; offsetY = -50; }
                else if (textCheck.includes("DISAGREE")) { offsetX = -105; offsetY = 50; }
                else if (textCheck.includes("AGREE")) { offsetX = 105; offsetY = -50; }
                else if (textCheck.includes("NEUTRAL")) { offsetX = 0; offsetY: 0; }
                else { offsetX = 0; offsetY = 0; }

                const optionsText = this.add.text(0, 0, optionText, {
                    fontFamily: '"Press Start 2P"',
                    fontSize: "8px",
                    align: "center",
                    fill: "#ffffff",
                    wordWrap: { width: maxWidth - (paddingSide * 2) },
                    resolution: 2
                }).setOrigin(0.5);

                const finalWidth = 200;
                const finalHeight = optionsText.height + (paddingTopBottom * 2);

                const optionsStyleContainer = this.add.graphics()
                    .fillStyle(0x486947, 1)
                    .lineStyle(2, 0xA3B18A, 1)
                    .fillRoundedRect(-finalWidth / 2, -finalHeight / 2, finalWidth, finalHeight, 8)
                    .strokeRoundedRect(-finalWidth / 2, -finalHeight / 2, finalWidth, finalHeight, 8);

                const hitArea = new Phaser.Geom.Rectangle(-finalWidth / 2, -finalHeight / 2, finalWidth, finalHeight);    
                optionsStyleContainer.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains)
                    .on('pointerover', () => {
                        if (!this.isSettingsOpen && !this.isLoadingQuestions) optionsStyleContainer.setAlpha(0.8);
                    })
                    .on('pointerout', () => optionsStyleContainer.setAlpha(1))
                    .on('pointerdown', () => {
                        if (this.isSettingsOpen || this.isLoadingQuestions) return;

                        if (optionText === "Retry") {
                            this.loadQuestions();
                        } else {
                            this.handleAnswer(optionText);
                        }
                    });

                const buttonContainer = this.add.container(offsetX, offsetY, [optionsStyleContainer, optionsText]);
                this.optionsContainer.add(buttonContainer);
                this.optionButtons.push({ container: buttonContainer, graphics: optionsStyleContainer, text: optionText, w: finalWidth, h: finalHeight });
            });
            this.highlightOption(this.selectedOptionIndex);
        } else {          
            this.optionsContainer = this.add.container(120, 0).setDepth(130);

            let currentY = 0;
            const verticalGap = 10;
            const paddingSide = 24;
            const paddingTopBottom = 14;
            const maxWidth = 700;
            const startX = 250;
            const offsetStep = 50;

            this.optionButtons = [];

            options.forEach((optionText, index) => {
                const label = String.fromCharCode(65 + index);
                const currentX = startX - (index * offsetStep);

                const displayText = optionText === "Retry" ? optionText : `${label}. ${optionText}`;

                const optionsText = this.add.text(0, 0, displayText, {
                    fontFamily: '"Press Start 2P"',
                    fontSize: "8px",
                    align: "center",
                    fill: "#ffffff",
                    wordWrap: { width: maxWidth - (paddingSide * 2) },
                    lineSpacing: 6,
                    resolution: 2
                }).setOrigin(0.5);

                const finalWidth = optionsText.width + (paddingSide * 2);
                const finalHeight = optionsText.height + (paddingTopBottom * 2);

                optionsText.setPosition(finalWidth / 2, finalHeight / 2);

                const optionsStyleContainer = this.add.graphics()
                    .fillStyle(0x344E41, 1)
                    .lineStyle(2, 0xA3B18A, 1)
                    .fillRoundedRect(0, 0, finalWidth, finalHeight, 8)
                    .strokeRoundedRect(0, 0, finalWidth, finalHeight, 8);

                const hitArea = new Phaser.Geom.Rectangle(0, 0, finalWidth, finalHeight);    
                optionsStyleContainer.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains)
                    .on('pointerover', () => {
                        if (!this.isSettingsOpen && !this.isLoadingQuestions) optionsStyleContainer.setAlpha(0.8);
                    })
                    .on('pointerout', () => optionsStyleContainer.setAlpha(1))
                    .on('pointerdown', () => {
                        if (this.isSettingsOpen || this.isLoadingQuestions) return;

                        if (optionText === "Retry") {
                            this.loadQuestions();
                        } else {
                            this.handleAnswer(optionText);
                        }
                    });

                const buttonContainer = this.add.container(currentX, currentY, [optionsStyleContainer, optionsText]);
                this.optionsContainer.add(buttonContainer);
                currentY += finalHeight + verticalGap;
                this.optionButtons.push({ container: buttonContainer, graphics: optionsStyleContainer, text: optionText, w: finalWidth, h: finalHeight });
            });
            this.optionsContainer.y = screenHeight - currentY - 80;
            this.highlightOption(this.selectedOptionIndex);
        }
    }

    highlightOption(index) {
        if (!this.optionButtons || this.optionButtons.length === 0) return;
        const isAssessment = this.rawType === 'Skill' || this.rawType === 'Personality';

        this.optionButtons.forEach((btn, i) => {
            btn.graphics.clear();
            const isSelected = i === index;

            if (isAssessment) {
                btn.graphics
                    .fillStyle(isSelected ? 0x588157 : 0x486947, 1)
                    .lineStyle(2, isSelected ? 0xffffff : 0xA3B18A, 1)
                    .fillRoundedRect(-btn.w / 2, -btn.h / 2, btn.w, btn.h, 8)
                    .strokeRoundedRect(-btn.w / 2, -btn.h / 2, btn.w, btn.h, 8);
            } else {
                btn.graphics
                    .fillStyle(isSelected ? 0x588157 : 0x344E41, 1)
                    .lineStyle(2, isSelected ? 0xffffff : 0xA3B18A, 1)
                    .fillRoundedRect(0, 0, btn.w, btn.h, 8)
                    .strokeRoundedRect(0, 0, btn.w, btn.h, 8);
            }
        });
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
                this.questionUI(expParts.join("\n\n"));
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
            const isAssessment = this.rawType === 'Skill' || this.rawType === 'Personality';
            const upJustDown =
                Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP)) ||
                Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)) ||
                (this.mobileControls.isDpadUpJustDown ? this.mobileControls.isDpadUpJustDown() : false);

            const downJustDown =
                Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN)) ||
                Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)) ||
                (this.mobileControls.isDpadDownJustDown ? this.mobileControls.isDpadDownJustDown() : false);

            const confirmJustDown =
                Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)) ||
                Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)) ||
                this.mobileControls.isInteractJustDown();

            if (upJustDown) {
                this.selectedOptionIndex = isAssessment
                    ? (this.selectedOptionIndex + 1) % this.currentOptions.length
                    : (this.selectedOptionIndex - 1 + this.currentOptions.length) % this.currentOptions.length;
                this.highlightOption(this.selectedOptionIndex);
            }

            if (downJustDown) {
                this.selectedOptionIndex = isAssessment
                    ? (this.selectedOptionIndex - 1 + this.currentOptions.length) % this.currentOptions.length
                    : (this.selectedOptionIndex + 1) % this.currentOptions.length;
                this.highlightOption(this.selectedOptionIndex);
            }

            if (confirmJustDown || this.isLoadingQuestions) {
                const selected = this.currentOptions[this.selectedOptionIndex];
                if (selected) selected === "Retry" ? this.loadQuestions() : this.handleAnswer(selected);
            }
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