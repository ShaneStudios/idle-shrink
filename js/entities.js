class Ball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.maxHealth = BALL_START_HEALTH;
        this.health = BALL_START_HEALTH;
        this.vx = (Math.random() - 0.5) * 20; 
        this.vy = 0;
        this.isDamaged = false;
    }

    get radius() {
        const healthPercent = Math.max(0, (this.health - 1) / (this.maxHealth - 1));
        return BALL_MIN_RADIUS + (BALL_MAX_RADIUS - BALL_MIN_RADIUS) * healthPercent;
    }

    getValue() {
        return BALL_START_VALUE;
    }

    update(deltaTime) {
        this.vy += GRAVITY * deltaTime;
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
    }
}

class Peg {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = PEG_RADIUS;
        this.type = 'ShrinkRay_Laser';
        this.targets = [];
    }

    getDamage() {
        let damage = PEG_BASE_DAMAGE;
        if (gameState.upgrades['damage_2x']) damage *= 2;
        return damage;
    }
    
    getRange() {
        let range = PEG_BASE_RANGE;
        if (gameState.upgrades['range_2x']) range *= 2;
        return range;
    }

    findTarget(balls) {
        const rangeSq = this.getRange() ** 2;
        const ballsInRange = [];

        for (const ball of balls) {
            const dx = this.x - ball.x;
            const dy = this.y - ball.y;
            const distanceSq = dx * dx + dy * dy;
            if (distanceSq < rangeSq) {
                ballsInRange.push({ ball, distanceSq });
            }
        }

        ballsInRange.sort((a, b) => a.distanceSq - b.distanceSq);
        const numTargets = gameState.upgrades['multi_target_2'] ? 2 : 1;
        this.targets = ballsInRange.slice(0, numTargets).map(item => item.ball);
    }

    update(deltaTime, balls) {
        this.findTarget(balls);
        
        if (this.targets.length > 0) {
            const damageToDealBase = this.getDamage() * deltaTime;
            for (const target of this.targets) {
                let damageToDeal = damageToDealBase;
                if (gameState.upgrades['first_hit_2x'] && !target.isDamaged) {
                    damageToDeal *= 2;
                }
                target.health = Math.max(1, target.health - damageToDeal);
                target.isDamaged = true;
            }
        }
    }
}