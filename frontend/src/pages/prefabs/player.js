export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, gender, playerName = "Player") {
        const playerGender = (gender && typeof gender === 'string') ? gender.toLowerCase() : 'male';
        const standAnim = `stand${playerGender}`;
        
        super(scene, x, y, standAnim);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.gender = playerGender;
        this.setCollideWorldBounds(true);
        this.body.setSize(10, 2).setOffset(20, 22);

        this.nameText = scene.add.text(0, 0, playerName, {
            fontFamily: '"Press Start 2P"',
            fontSize: "10px",
            fill: "#ffffff",
            align: "center",
            resolution: 4
        }).setOrigin(0.5);

        const padding = 8;
        const bgW = this.nameText.width + padding * 2;
        const bgH = this.nameText.height + padding;
        
        this.nameBg = scene.add.graphics()
            .fillStyle(0x125729, 1)
            .fillRoundedRect(-bgW / 2, -bgH / 2, bgW, bgH, 5)
            .strokeRoundedRect(-bgW / 2, -bgH / 2, bgW, bgH, 5);

        this.nameContainer = scene.add.container(x, y - 40);
        this.nameContainer.add([this.nameBg, this.nameText]);
        this.nameContainer.setDepth(100);

        this.cursors = scene.input.keyboard.createCursorKeys();
        this.keys = scene.input.keyboard.addKeys('W,A,S,D,SHIFT');
    }

    update(isMobile, joystickX, joystickY, isRunning) {
        this.setVelocity(0);
        let speed = isRunning ? 300 : 200;
        if (!isMobile && this.keys.SHIFT.isDown) { speed = 300; }
        if (isMobile) {
            this.body.setVelocityX(joystickX * speed);
            this.body.setVelocityY(joystickY * speed);
        }

        if (this.nameContainer) {
            const dynamicOffset = this.scale * 32; 
            this.nameContainer.setPosition(this.x, this.y - dynamicOffset).setScale(1.2);
        }

        const genderKey = this.gender;
        if (!isMobile) {
            if (this.cursors.left.isDown || this.keys.A.isDown) {
                this.setVelocityX(-speed);
                this.setFlipX(false);
                this.play(`side${genderKey}`, true);
            } else if (this.cursors.right.isDown || this.keys.D.isDown) {
                this.setVelocityX(speed);
                this.setFlipX(true);
                this.play(`side${genderKey}`, true);
            } else if (this.cursors.up.isDown || this.keys.W.isDown) {
                this.setVelocityY(-speed);
                this.play(`back${genderKey}`, true);
            } else if (this.cursors.down.isDown || this.keys.S.isDown) {
                this.setVelocityY(speed);
                this.play(`front${genderKey}`, true);
            } else {
                this.play(`stand${genderKey}`, true);
            }
        } else {
            if (joystickX !== 0 || joystickY !== 0) {
                this.setVelocity(joystickX * speed, joystickY * speed);

                if (Math.abs(joystickX) > Math.abs(joystickY)) {
                    this.play(`side${genderKey}`, true);
                    this.setFlipX(joystickX > 0);
                } else {
                    this.play(joystickY > 0 ? `front${genderKey}` : `back${genderKey}`, true);
                }
            } else {
                this.play(`stand${genderKey}`, true);
            }
        }
    }
}