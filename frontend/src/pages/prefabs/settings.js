const VOLUME_LEVELS = {
    HIGH: 1.0,
    MEDIUM: 0.5,
    LOW: 0.2,
    OFF: 0
};

const VOLUME_ORDER = ['OFF', 'LOW', 'MEDIUM', 'HIGH'];

export default class SettingsPanel extends Phaser.GameObjects.Container {
    constructor(scene) {
        const { width, height } = scene.scale;
        super(scene, width / 2, height / 2);

        const storedMobileMode = localStorage.getItem('mobileMode') === 'true';
        scene.isMobileMode = storedMobileMode;
        scene.hideName = localStorage.getItem('hideName') === 'true';

        const storedVolume = localStorage.getItem('volumeLevel') || 'HIGH';
        scene.sound.volume = VOLUME_LEVELS[storedVolume];
        scene.sound.mute = storedVolume === 'OFF';

        const nameContainer = scene.player?.nameContainer || scene.nameContainer;
        if (nameContainer) nameContainer.setVisible(!scene.hideName);

        this.scene = scene;
        this.setDepth(100);
        this.setVisible(false);
        this.setScrollFactor(0);

        const panelShadow = scene.add.rectangle(7, 9, 360, 390, 0x000000, 0.45);
        const panelBg = scene.add.rectangle(0, 0, 360, 390, 0x244b24);
        const titleAccent = scene.add.rectangle(0, -153, 54, 5, 0xa3b18a);
        this.add([panelShadow, panelBg, titleAccent]);

        const items = [
            { key: 'title', text: 'SETTINGS', y: -165, size: '20px', fill: '#ffffff' },
            {
                key: 'mobile',
                text: 'MOBILE MODE',
                value: scene.isMobileMode ? 'ON' : 'OFF',
                y: -85,
                size: '11px',
                fill: '#ffffff',
                interactive: true,
                isSwitch: true
            },
            {
                key: 'volume',
                text: 'SOUND',
                value: storedVolume,
                y: -45,
                size: '11px',
                fill: '#ffffff',
                interactive: true,
                isSwitch: true
            },
            {
                key: 'hideName',
                text: 'HIDE NAME',
                value: scene.hideName ? 'ON' : 'OFF',
                y: -5,
                size: '11px',
                fill: '#ffffff',
                interactive: true,
                isSwitch: true
            },
        ];

        if (scene.scene.key === 'Classroom') {
            items.push(
                { key: 'resume', text: 'RESUME', y: 65, size: '12px', fill: '#a3d9a5', interactive: true },
                { key: 'back', text: 'RETURN TO HALLWAY', y: 115, size: '10px', fill: '#e2d58b', interactive: true },
                { key: 'exit', text: 'EXIT TO TITLE', y: 165, size: '10px', fill: '#e89a8f', interactive: true }
            );
        } else{
            items.push(
                { key: 'resume', text: 'RESUME', y: 95, size: '12px', fill: '#a3d9a5', interactive: true },
                { key: 'exit', text: 'EXIT TO TITLE', y: 150, size: '10px', fill: '#e89a8f', interactive: true }
            );
        };
        
        this.menuTexts = {};
        this.switches = {};

        items.forEach(item => {
            const txt = scene.add.text(
                item.isSwitch ? -137 : 0,
                item.isSwitch ? item.y - 7 : item.y,
                item.text,
                {
                fontFamily: '"Press Start 2P"',
                fontSize: item.size,
                fill: item.fill,
                align: item.isSwitch ? "left" : "center"
            }).setScrollFactor(0).setOrigin(item.isSwitch ? 0 : 0.5);

            if (item.interactive) {
                if (item.isSwitch) {
                    const value = scene.add.text(-137, item.y + 9, item.value, {
                        fontFamily: '"Press Start 2P"',
                        fontSize: '8px',
                        fill: '#a3b18a'
                    }).setScrollFactor(0);
                    const track = scene.add.rectangle(118, item.y, 64, 24, 0x26382b);
                    const knob = scene.add.rectangle(
                        this.getSwitchKnobX(item.key, item.value),
                        item.y,
                        16,
                        16,
                        0xdad7cd
                    );
                    const hitArea = scene.add.rectangle(0, item.y, 320, 46, 0x000000, 0)
                        .setInteractive({ useHandCursor: true });

                    this.switches[item.key] = { track, knob, value };
                    this.menuTexts[item.key] = txt;
                    this.updateSwitch(item.key, item.value);
                    this.add([track, knob, txt, value, hitArea]);
                    this.setupItemEvents(item.key, hitArea, txt);
                    return;
                }

                txt.setInteractive({ useHandCursor: true });
                this.setupItemEvents(item.key, txt, txt);
            }

            this.menuTexts[item.key] = txt;
            this.add(txt);
        });

        const dividerY = scene.scene.key === 'Classroom' ? 35 : 65;
        const divider = scene.add.rectangle(0, dividerY, 250, 2, 0x588157, 0.8);
        this.add(divider);
        this.sendToBack(panelBg);
        this.sendToBack(panelShadow);
        scene.add.existing(this);
    }

    getSwitchKnobX(key, value) {
        if (key === 'mobile' || key === 'hideName') {
            return value === 'ON' ? 137 : 99;
        }

        const index = VOLUME_ORDER.indexOf(value);
        return 99 + (index / (VOLUME_ORDER.length - 1)) * 38;
    }

    updateSwitch(key, value) {
        const control = this.switches[key];
        control.value.setText(value);
        control.knob.setX(this.getSwitchKnobX(key, value));
        control.track.setFillStyle(value === 'OFF' ? 0x26382b : 0x588157);
    }

    setupItemEvents(key, hitArea, textObj) {
        const restingFill = key === 'resume'
            ? '#a3d9a5'
            : key === 'back'
                ? '#e2d58b'
                : key === 'exit'
                    ? '#e89a8f'
                    : '#ffffff';

        hitArea.on('pointerover', () => {
            if (this.switches[key]) this.switches[key].track.setFillStyle(0x77a96d);
            textObj.setScale(1.04);
            this.scene.tweens.add({
                targets: hitArea,
                alpha: 0.82,
                duration: 100
            });
        });

        hitArea.on('pointerout', () => {
            if (this.switches[key]) {
                this.updateSwitch(key, this.switches[key].value.text);
            }
            textObj.setScale(1);
            this.scene.tweens.add({
                targets: hitArea,
                alpha: 1,
                duration: 100
            });
        });

        hitArea.on('pointerdown', async () => {
            if (!this.switches[key]) textObj.setFill(restingFill);
            const interactAudio = this.scene.sound.add('interactaudio');
            interactAudio.once('complete', () => interactAudio.destroy());
            interactAudio.play();
            
            switch (key) {
                case 'mobile':
                    this.scene.isMobileMode = !this.scene.isMobileMode;
                    localStorage.setItem('mobileMode', this.scene.isMobileMode);
                    this.scene.updateMobileUI(); 
                    this.updateSwitch(key, this.scene.isMobileMode ? 'ON' : 'OFF');
                    break;

                case 'volume':
                    const currentLevel = localStorage.getItem('volumeLevel') || 'HIGH';
                    const currentIndex = VOLUME_ORDER.indexOf(currentLevel);
                    const nextLevel = VOLUME_ORDER[(currentIndex + 1) % VOLUME_ORDER.length];

                    localStorage.setItem('volumeLevel', nextLevel);
                    this.scene.sound.volume = VOLUME_LEVELS[nextLevel];
                    this.scene.sound.mute = nextLevel === 'OFF';

                    this.updateSwitch(key, nextLevel);
                    break;

                case 'hideName':
                    this.scene.hideName = !this.scene.hideName;
                    localStorage.setItem('hideName', this.scene.hideName);
                    const nameContainer = this.scene.player?.nameContainer || this.scene.nameContainer;
                    if (nameContainer) nameContainer.setVisible(!this.scene.hideName);
                    this.updateSwitch(key, this.scene.hideName ? 'ON' : 'OFF');
                    break;
                
                case 'back':
                    this.handleBackToHallway();
                    break;

                case 'resume':
                    this.toggle();
                    break;

                case 'exit':
                    await this.handleExit();
                    break;
            }
        });
    }

    handleBackToHallway() {
        window.dispatchEvent(new CustomEvent('updateGameTitle', { 
            detail: { text: "Hallway - An AI-Driven 8-bit Web Game For Personalized College Program Matching and Career Exploration" } 
        }));

        this.toggle();
        this.scene.scene.start('Hallway');
    }

    async handleExit() {
        const playerID = localStorage.getItem("playerID");
        const snapshot = await db.ref("webGame/" + playerID).once("value");
        const data = snapshot.val();

        if (data) {
            if (data.temporary) {
                await db.ref("webGame/" + playerID).remove();
            } else {
                await updatePlayerData({lastActive: Date.now()});
            }
        }
        localStorage.removeItem("playerID");
        window.location.href = "./index.html";
    }

    toggle() {
        this.isOpened = !this.isOpened;
        this.scene.tweens.killTweensOf(this);

        if (this.isOpened) {
            this.setVisible(true).setAlpha(0).setScale(0.94);
            this.scene.tweens.add({
                targets: this,
                alpha: 1,
                scale: 1,
                duration: 180,
                ease: 'Back.Out'
            });
            return;
        }

        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scale: 0.97,
            duration: 120,
            ease: 'Quad.In',
            onComplete: () => this.setVisible(false).setScale(1).setAlpha(1)
        });
    }
}