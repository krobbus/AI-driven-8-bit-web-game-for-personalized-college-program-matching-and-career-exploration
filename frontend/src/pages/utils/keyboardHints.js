export function createKeyboardHints(scene, mode = 'world') {
    const lines = mode === 'classroom'
        ? [
            'SELECT: W / A / S / D OR ARROWS',
            'ANSWER: [ENTER] / [SPACE]'
        ]
        : [
            'MOVE: [W][A][S][D] / ARROWS',
            'RUN: [SHIFT]',
            'MENU: [UP]/[DOWN], [W]/[S]',
            'ACT: [ENTER] / [SPACE]'
        ];
    const text = scene.add.text(10, 9, `KEY GUIDE\n${lines.join('\n')}`, {
        fontFamily: '"Press Start 2P"',
        fontSize: '10px',
        lineSpacing: 8,
        color: '#ffffff',
        resolution: 2
    });
    const width = text.width + 20;
    const height = text.height + 18;
    const background = scene.add.graphics()
        .fillStyle(0x123b24, 0.95)
        .fillRect(0, 0, width, height)
        .lineStyle(3, 0xdad7cd, 1)
        .strokeRect(1.5, 1.5, width - 3, height - 3);

    return scene.add.container(16, 16, [background, text])
        .setScrollFactor(0)
        .setDepth(4000)
        .setVisible(!scene.isMobileMode && !scene.hideKeys);
}
