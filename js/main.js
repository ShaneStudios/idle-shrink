window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d');
    const renderer = new Renderer(canvas, ctx);
    let lastTime = 0;
    let timeToNextBall = 0;

    const collectorGap = 40;
    const funnelTopY = HEIGHT - 100;
    const funnelBottomY = HEIGHT - 10;
    const funnelWallX1 = WIDTH / 2 - collectorGap / 2;
    const funnelWallX2 = WIDTH / 2 + collectorGap / 2;
    const leftSlope = { x1: 0, y1: funnelTopY, x2: funnelWallX1, y2: funnelBottomY };
    const rightSlope = { x1: WIDTH, y1: funnelTopY, x2: funnelWallX2, y2: funnelBottomY };

    function gameLoop(timestamp) {
        if (!lastTime) {
            lastTime = timestamp;
        }
        let rawDeltaTime = (timestamp - lastTime) / 1000;
        lastTime = timestamp;

        const deltaTime = Math.min(rawDeltaTime, 0.05);

        update(deltaTime);
        draw();
        requestAnimationFrame(gameLoop);
    }

    function update(deltaTime) {
        timeToNextBall -= deltaTime;
        if (timeToNextBall <= 0) {
            timeToNextBall = 1 / BALL_SPAWN_RATE;
            const spawnX = Math.random() * (WIDTH - BALL_MAX_RADIUS * 2) + BALL_MAX_RADIUS;
            const newBall = new Ball(spawnX, -60);
            gameState.balls.push(newBall);
        }
        
        gameState.pegs.forEach(peg => peg.update(deltaTime, gameState.balls));

        const subSteps = 6;
        const subDeltaTime = deltaTime / subSteps;
        for (let i = 0; i < subSteps; i++) {
            gameState.balls.forEach(ball => {
                ball.update(subDeltaTime);
            });
            handleBallToBallCollisions();
            gameState.balls.forEach(ball => {
                handleStaticCollisions(ball);
            });
        }
        
        gameState.balls = gameState.balls.filter(ball => {
            if (ball.y > funnelBottomY && ball.x > funnelWallX1 && ball.x < funnelWallX2) {
                 gameState.money += ball.getValue();
                 return false;
            }
            if(ball.y > HEIGHT + 50) return false;
            return true;
        });
        updateUI();
    }
    
    function handleStaticCollisions(ball) {
        if (ball.x - ball.radius < 0) {
            ball.vx = Math.abs(ball.vx) * 0.8;
            ball.x = ball.radius;
        } else if (ball.x + ball.radius > WIDTH) {
            ball.vx = -Math.abs(ball.vx) * 0.8;
            ball.x = WIDTH - ball.radius;
        }

        for (const slot of PEG_SLOTS) {
            const dx = ball.x - slot.x;
            const dy = ball.y - slot.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < ball.radius + PEG_RADIUS) { 
                const overlap = ball.radius + PEG_RADIUS - distance;
                const normalX = dx / distance;
                const normalY = dy / distance;

                ball.x += normalX * overlap;
                ball.y += normalY * overlap;

                const dotProduct = ball.vx * normalX + ball.vy * normalY;
                ball.vx = (ball.vx - 2 * dotProduct * normalX) * 0.8;
                ball.vy = (ball.vy - 2 * dotProduct * normalY) * 0.8;
            }
        }
        collideBallWithLineSegment(ball, leftSlope);
        collideBallWithLineSegment(ball, rightSlope);
    }
    
    function handleBallToBallCollisions() {
        for (let i = 0; i < gameState.balls.length; i++) {
            for (let j = i + 1; j < gameState.balls.length; j++) {
                const ballA = gameState.balls[i];
                const ballB = gameState.balls[j];
                const dx = ballB.x - ballA.x;
                const dy = ballB.y - ballA.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const sumRadii = ballA.radius + ballB.radius;
                if (distance < sumRadii) {
                    const overlap = sumRadii - distance;
                    const normalX = dx / distance;
                    const normalY = dy / distance;
                    ballA.x -= overlap * 0.5 * normalX;
                    ballA.y -= overlap * 0.5 * normalY;
                    ballB.x += overlap * 0.5 * normalX;
                    ballB.y += overlap * 0.5 * normalY;
                    const tangentX = -normalY;
                    const tangentY = normalX;
                    const tanVelA = ballA.vx * tangentX + ballA.vy * tangentY;
                    const tanVelB = ballB.vx * tangentX + ballB.vy * tangentY;
                    const normVelA = ballA.vx * normalX + ballA.vy * normalY;
                    const normVelB = ballB.vx * normalX + ballB.vy * normalY;
                    const m1 = normVelA;
                    const m2 = normVelB;
                    ballA.vx = tangentX * tanVelA + normalX * m2;
                    ballA.vy = tangentY * tanVelA + normalY * m2;
                    ballB.vx = tangentX * tanVelB + normalX * m1;
                    ballB.vy = tangentY * tanVelB + normalY * m1;
                }
            }
        }
    }

    function collideBallWithLineSegment(ball, line) {
        const dx = line.x2 - line.x1;
        const dy = line.y2 - line.y1;
        const lineLengthSq = dx * dx + dy * dy;
        let t = ((ball.x - line.x1) * dx + (ball.y - line.y1) * dy) / lineLengthSq;
        t = Math.max(0, Math.min(1, t));
        const closestX = line.x1 + t * dx;
        const closestY = line.y1 + t * dy;
        const dist_x = ball.x - closestX;
        const dist_y = ball.y - closestY;
        const distanceSq = dist_x * dist_x + dist_y * dist_y;

        if (distanceSq < ball.radius * ball.radius) {
            const distance = Math.sqrt(distanceSq);
            const overlap = ball.radius - distance;
            ball.x += (dist_x / distance) * overlap;
            ball.y += (dist_y / distance) * overlap;
            const normalX = -dy;
            const normalY = dx;
            const normalLen = Math.sqrt(normalX * normalX + normalY * normalY);
            const normalizedNormalX = normalX / normalLen;
            const normalizedNormalY = normalY / normalLen;
            const dotProduct = ball.vx * normalizedNormalX + ball.vy * normalizedNormalY;
            ball.vx -= 2 * dotProduct * normalizedNormalX * 0.8;
            ball.vy -= 2 * dotProduct * normalizedNormalY * 0.8;
        }
    }

    function draw() {
        renderer.clear();
        renderer.drawBackground();
        renderer.drawPegSlots(PEG_SLOTS, gameState.nextPegCost);
        gameState.pegs.forEach(peg => renderer.drawPeg(peg));
        gameState.pegs.forEach(peg => renderer.drawLaser(peg)); 
        gameState.balls.forEach(ball => renderer.drawBall(ball));
    }

    const menuToggle = document.getElementById('menu-toggle');
    const uiPanel = document.getElementById('ui-panel');
    menuToggle.addEventListener('click', () => {
        uiPanel.classList.toggle('is-open');
        menuToggle.classList.toggle('is-open');
    });

    canvas.addEventListener('click', (event) => {
        if(uiPanel.classList.contains('is-open')) {
            uiPanel.classList.remove('is-open');
            menuToggle.classList.remove('is-open');
        }
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (event.clientX - rect.left) * scaleX;
        const mouseY = (event.clientY - rect.top) * scaleY;

        for (const slot of PEG_SLOTS) {
            if (!slot.peg) {
                const dx = slot.x - mouseX;
                const dy = slot.y - mouseY;
                if (Math.sqrt(dx * dx + dy * dy) < PEG_SLOT_RADIUS) {
                    buyPeg(slot.x, slot.y);
                    break;
                }
            }
        }
    });

    document.querySelectorAll('.upgrade-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const upgradeId = e.currentTarget.id.replace('upgrade_', '');
            buyUpgrade(upgradeId);
        });
    });

    const fileInput = document.getElementById('fileInput');
    document.getElementById('saveButton').addEventListener('click', saveGame);
    document.getElementById('loadButton').addEventListener('click', () => fileInput.click());
    document.getElementById('resetButton').addEventListener('click', resetGame);

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const decodedState = atob(e.target.result);
                const loadedData = JSON.parse(decodedState);
                loadGame(loadedData);
            } catch (error) {
                alert("Invalid or corrupted save file!");
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    });
    
    updateUI();
    requestAnimationFrame(gameLoop);
});