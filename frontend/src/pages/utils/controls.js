export function createMobileControls(scene) {
    if (!scene) return;

    const state = { forceX: 0, forceY: 0, interactPressed: false, isRunning: false };
    let lastUpState = false;
    let lastDownState = false;

    const idleAlpha = 0.5;
    const activeAlpha = 1.0;

    const screenHeight = scene.scale.height;
    const screenWidth = scene.scale.width;

    const dpadContainer = scene.add.container(0, 0)                                                     // d-pad
        .setSize(300, 300)
        .setInteractive()
        .setScrollFactor(0)
        .setDepth(1000)
        .setAlpha(idleAlpha)
        .setVisible(false)

    const dpadVisual = scene.add.sprite(0, 0, 'dpadunclicked').setScale(4.5);
    dpadContainer.add(dpadVisual);

    const createZone = (x, y, width, height, direction) => {
        let zone = scene.add.rectangle(x, y, width, height, 0x000000, 0)
            .setInteractive();
        
        zone.on('pointerdown', () => {
            if (direction === 'up') { state.forceY = -1; dpadVisual.setTexture('dpadup').setAlpha(activeAlpha); }
            if (direction === 'down') { state.forceY = 1; dpadVisual.setTexture('dpaddown').setAlpha(activeAlpha); }
            if (direction === 'left') { state.forceX = -1; dpadVisual.setTexture('dpadleft').setAlpha(activeAlpha); }
            if (direction === 'right') { state.forceX = 1; dpadVisual.setTexture('dpadright').setAlpha(activeAlpha); }
        });

        return zone;
    };
    const upZone = createZone(0, -60, 80, 70, 'up').setScrollFactor(0);
    const downZone = createZone(0, 60, 80, 70, 'down').setScrollFactor(0);
    const leftZone = createZone(-60, 0, 70, 80, 'left').setScrollFactor(0);
    const rightZone = createZone(60, 0, 70, 80, 'right').setScrollFactor(0);
    dpadContainer.add([upZone, downZone, leftZone, rightZone]);

    scene.input.on('pointerup', () => {
        state.forceX = 0;
        state.forceY = 0;
        dpadVisual.setTexture('dpadunclicked');
    });

    const interactBtn = scene.add.sprite(0, 0, 'interactunselected')                                // interact
        .setInteractive()
        .setScrollFactor(0)
        .setDepth(1000)
        .setScale(2)
        .setAlpha(idleAlpha)
        .setVisible(false);

    interactBtn.on('pointerdown', () => {
        interactBtn.setTexture('interactselected').setAlpha(activeAlpha);
        state.interactPressed = true;
    });

    interactBtn.on('pointerup', () => {
        interactBtn.setTexture('interactunselected').setAlpha(idleAlpha);
        state.interactPressed = false;
    });

    const runBtn = scene.add.sprite(0, 0, 'rununclicked')                                             // run
        .setInteractive()
        .setScrollFactor(0)
        .setDepth(1000)
        .setScale(2)
        .setAlpha(idleAlpha)
        .setVisible(false);

    runBtn.on('pointerdown', () => {
        runBtn.setTexture('runclicked').setAlpha(activeAlpha);
        state.isRunning = true;
    });

    runBtn.on('pointerup', () => {
        runBtn.setTexture('rununclicked').setAlpha(idleAlpha);
        state.isRunning = false;
    });

    const reposition = () => {
        const viewWidth = scene.cameras.main.width;
        const viewHeight = scene.cameras.main.height;

        dpadContainer.setPosition(180, viewHeight - 200);
        runBtn.setPosition(viewWidth - 130, viewHeight - 280);
        interactBtn.setPosition(viewWidth - 150, viewHeight - 160);
    };
    reposition();

    return {
        reposition: (customWidth, customHeight) => {
            const viewWidth = customWidth || scene.cameras.main.width;
            const viewHeight = customHeight || scene.cameras.main.height;

            dpadContainer.setPosition(130, viewHeight - 200);
            runBtn.setPosition(viewWidth - 80, viewHeight - 280);
            interactBtn.setPosition(viewWidth - 100, viewHeight - 160);
        },
        setVisible: (bool) => {
            dpadContainer.setVisible(bool);
            runBtn.setVisible(bool);
            interactBtn.setVisible(bool);
        },
        getForce: () => {
            return { x: state.forceX, y: state.forceY, isRunning: state.isRunning};
        },
        isDpadUpJustDown: () => {
            const isPressed = state.forceY === -1;
            const justPressed = isPressed && !lastUpState;
            lastUpState = isPressed;
            return justPressed;
        },
        isDpadDownJustDown: () => {
            const isPressed = state.forceY === 1;
            const justPressed = isPressed && !lastDownState;
            lastDownState = isPressed;
            return justPressed;
        },
        isInteractJustDown: () => {
            const val = state.interactPressed;
            state.interactPressed = false; 
            return val;
        }
    };
}