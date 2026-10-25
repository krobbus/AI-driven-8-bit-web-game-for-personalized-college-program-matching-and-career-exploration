export function positionTopRightIcons(scene, firstIcon, secondIcon, camera = scene.cameras.main) {
    const top = Math.max(12, camera.height * 0.020);
    const right = Math.max(12, camera.width * 0.025);
    const gap = Math.max(8, camera.width * 0.01);

    secondIcon
        .setOrigin(1, 0)
        .setPosition(camera.width - right, top)
        .setScrollFactor(0);
    firstIcon
        .setOrigin(1, 0)
        .setPosition(secondIcon.x - secondIcon.displayWidth - gap, top)
        .setScrollFactor(0);
}
