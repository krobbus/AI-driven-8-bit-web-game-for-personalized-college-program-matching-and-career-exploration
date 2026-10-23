export default class DialogueBubble {
    constructor(scene, npc, lines = [], options = {}) {
        this.scene = scene;
        this.npc = npc;
        this.lines = Array.isArray(lines) ? lines : [lines];

        this.fontSize = options.fontSize ?? "12px";
        this.fontFamily = options.fontFamily ?? '"Press Start 2P"';
        this.maxWidth = options.maxWidth ?? 220;
        this.padX = options.padX ?? 14;
        this.padY = options.padY ?? 12;
        this.offsetX = options.offsetX ?? 20;
        this.offsetY = options.offsetY ?? -90;
        this.typeDelay = options.typeDelay ?? 45;
        this.linePause = options.linePause ?? 2000;
        this.depth = options.depth ?? 200;
        this.loop = options.loop ?? true;
        this.bgColor = options.bgColor ?? 0x125729;
        this.bgAlpha = options.bgAlpha ?? 0.95;
        this.borderColor = options.borderColor ?? 0xffffff;
        this.tailSize = 8;

        this.onComplete = options.onComplete || null;
        this.lineIndex = 0;
        this.timer = null;
        this.destroyed = false;

        this.build();
    }

    build() {
        this.container = this.scene.add.container(0, 0).setDepth(this.depth);

        this.bg = this.scene.add.graphics();
        this.container.add(this.bg);

        this.textObj = this.scene.add.text(this.padX, this.padY, "•••", {
            fontFamily: this.fontFamily,
            fontSize: this.fontSize,
            fill: "#ffffff",
            align: "justify",
            lineSpacing: 6,
            resolution: 2,
            wordWrap: { width: this.maxWidth - this.padX * 2, useAdvancedWrap: true }
        });
        this.container.add(this.textObj);

        this.redrawBg(this.textObj.width, this.textObj.height);
        this.reposition();
    }

    play() {
        if (this.destroyed || this.isPlaying) return;
        this.isPlaying = true;
        this.lineIndex = 0;
        this.typeCurrentLine();
    }

    typeCurrentLine() {
        if (this.destroyed) return;

        const fullText = this.lines[this.lineIndex] ?? "";
        this.textObj.setText("");
        let charIndex = 0;

        this.timer = this.scene.time.addEvent({
            delay: this.typeDelay,
            repeat: fullText.length - 1,
            callback: () => {
                if (this.destroyed) return;
                charIndex++;
                this.textObj.setText(fullText.slice(0, charIndex));
                this.redrawBg(this.textObj.width, this.textObj.height);
                this.reposition();
            }
        });

        this.scene.time.delayedCall(
            this.typeDelay * fullText.length + this.linePause,
            () => {
                if (this.destroyed) return;
                this.advance();
            }
        );
    }

    update() {
        if (this.destroyed) return;
        this.reposition();
    }

    reposition() {
        if (this.destroyed || !this.npc) return;

        const boxH = Math.max(24, this.textObj.height + this.padY * 2);

        this.container.setPosition(
            this.npc.x + this.offsetX,
            this.npc.y + this.offsetY - boxH
        );
    }

    redrawBg(textW, textH) {
        const boxW = Math.max(40, textW + this.padX * 2);
        const boxH = Math.max(24, textH + this.padY * 2);
        const r = 8;
        const t = this.tailSize;

        this.bg.clear();
        this.bg.fillStyle(0x000000, 0.18);
        this.bg.fillRoundedRect(2, 2, boxW, boxH, r);

        this.bg.fillStyle(this.bgColor, this.bgAlpha);
        this.bg.lineStyle(2, this.borderColor, 1);
        this.bg.fillRoundedRect(0, 0, boxW, boxH, r);
        this.bg.strokeRoundedRect(0, 0, boxW, boxH, r);

        const tailX = 18;
        this.bg.fillStyle(this.bgColor, this.bgAlpha);
        this.bg.fillTriangle(tailX, boxH, tailX + t, boxH, tailX + t / 2, boxH + t);

        this.bg.lineStyle(2, this.borderColor, 1);
        this.bg.strokeTriangle(tailX, boxH, tailX + t, boxH, tailX + t / 2, boxH + t);

        this.bg.lineStyle(3, this.bgColor, 1);
        this.bg.lineBetween(tailX + 1, boxH, tailX + t - 1, boxH);
    }

    advance() {
        if (this.destroyed) return;
        const next = this.lineIndex + 1;

        if (next < this.lines.length) {
            this.lineIndex = next;
            this.typeCurrentLine();
        } else if (this.loop) {
            this.lineIndex = 0;
            this.typeCurrentLine();
        } else {
            if (this.onComplete) this.onComplete();
        }
    }

    resetToIdle() {
        if (this.destroyed) return;
        if (this.timer) this.timer.remove(false);
        this.isPlaying = false;
        
        this.textObj.setText("•••");
        this.redrawBg(this.textObj.width, this.textObj.height);
    }

    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
        if (this.timer) this.timer.remove(false);
        this.container.destroy();
    }
}