class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBackground() {
        this.ctx.strokeStyle = '#2c3138';
        this.ctx.lineWidth = 4;
        const collectorGap = 40;
        const funnelTopY = HEIGHT - 100;
        const funnelBottomY = HEIGHT - 10;
        const funnelWallX1 = WIDTH / 2 - collectorGap / 2;
        const funnelWallX2 = WIDTH / 2 + collectorGap / 2;

        this.ctx.beginPath();
        this.ctx.moveTo(0, funnelTopY);
        this.ctx.lineTo(funnelWallX1, funnelBottomY);
        this.ctx.lineTo(funnelWallX1, HEIGHT);
        this.ctx.moveTo(WIDTH, funnelTopY);
        this.ctx.lineTo(funnelWallX2, funnelBottomY);
        this.ctx.lineTo(funnelWallX2, HEIGHT);
        this.ctx.stroke();
    }

    drawPegSlots(slots, cost) {
        this.ctx.strokeStyle = 'rgba(0, 191, 255, 0.1)';
        this.ctx.lineWidth = 2;
        slots.forEach(slot => {
            if (!slot.peg) {
                this.ctx.beginPath();
                this.ctx.arc(slot.x, slot.y, PEG_SLOT_RADIUS, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.fillStyle = 'rgba(0, 191, 255, 0.4)';
                this.ctx.font = 'bold 10px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(`$${cost}`, slot.x, slot.y);
            }
        });
    }

    drawPeg(peg) {
        this.ctx.fillStyle = '#6c757d';
        this.ctx.beginPath();
        this.ctx.arc(peg.x, peg.y, PEG_RADIUS, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#00bfff';
        this.ctx.beginPath();
        this.ctx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawLaser(peg) {
        if (peg.targets && peg.targets.length > 0) {
            for (const target of peg.targets) {
                this.ctx.beginPath();
                this.ctx.moveTo(peg.x, peg.y);
                this.ctx.lineTo(target.x, target.y);
                this.ctx.strokeStyle = '#ff4d4d';
                this.ctx.lineWidth = 1.5;
                this.ctx.stroke();
            }
        }
    }

    drawBall(ball) {
        const healthPercent = Math.max(0, ball.health / ball.maxHealth);
        const r = Math.floor(255 * (1 - healthPercent));
        const g = Math.floor(255 * healthPercent);
        this.ctx.fillStyle = `rgb(255, ${g}, ${r})`;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(ball.health.toFixed(1), ball.x, ball.y);
    }
}