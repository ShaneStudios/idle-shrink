class Ball {
constructor(x, y) {
this.x = x;
this.y = y;
this.maxHealth = BALL_START_HEALTH;
this.health = BALL_START_HEALTH;
this.vx = (Math.random() - 0.5) * 20;
this.vy = 0;
this.isDamaged = false;
this.lingeringDamage = {};
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
for (const pegId in this.lingeringDamage) {
const linger = this.lingeringDamage[pegId];
if (linger.duration > 0) {
const damageToDeal = linger.dps * deltaTime;
const healthBefore = this.health;
this.health = Math.max(1, this.health - damageToDeal);
const actualDamage = healthBefore - this.health;
if (actualDamage > 0) awardPrestigeProgress(actualDamage);
linger.duration -= deltaTime;
} else {
delete this.lingeringDamage[pegId];
}
}
}
}
class Peg {
constructor(x, y, weaponType) {
this.id = Math.random();
this.x = x;
this.y = y;
this.radius = PEG_RADIUS;
this.weaponType = weaponType || 'shrink_ray';
this.targets = [];
this.beamActiveTimer = 0;
this.beamCooldown = 0;
this.hexCircle = null;
this.hexCooldown = 0;
this.lightningCooldown = 20;
this.lightningActiveTimer = 0;
this.lightningBolts = [];
this.lightningCharge = 1;
this.slicerTarget = null;
this.slicerTouchTimer = 0;
this.slicerGraceTimer = 0;
this.buzzsawAngle = 0;
}
getUpgrades(moduleId) {
return gameState.upgrades[this.weaponType]?.[moduleId];
}
update(deltaTime, balls, ballsToAdd, ballsToRemove) {
switch(this.weaponType) {
case 'shrink_ray':
this.updateLaser(deltaTime, balls);
this.updateBeam(deltaTime, balls);
break;
case 'magic':
this.updateHex(deltaTime, balls);
this.updateLightning(deltaTime, balls);
break;
case 'splitter':
this.updateSlicer(deltaTime, balls, ballsToAdd, ballsToRemove);
this.updateBuzzsaw(deltaTime, balls);
break;
}
}
updateLaser(deltaTime, balls) {
const upgrades = this.getUpgrades('laser');
let range = PEG_BASE_RANGE;
if (upgrades?.range) range *= 2;
const rangeSq = range ** 2;
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
const numTargets = upgrades?.multi_target ? 2 : 1;
this.targets = ballsInRange.slice(0, numTargets).map(item => item.ball);
if (this.targets.length > 0) {
let damage = PEG_BASE_DAMAGE;
if (upgrades?.damage) damage *= 2;
damage *= gameState.globalDamageMultiplier;
const damageToDealBase = damage * deltaTime;
for (const target of this.targets) {
let damageToDeal = damageToDealBase;
if (upgrades?.first_hit && !target.isDamaged) {
damageToDeal *= 2;
}
const healthBefore = target.health;
target.health = Math.max(1, target.health - damageToDeal);
target.isDamaged = true;
const actualDamage = healthBefore - target.health;
if (actualDamage > 0) awardPrestigeProgress(actualDamage);
}
}
}
updateBeam(deltaTime, balls) {
const isUnlocked = gameState.prestigeShopItems.find(i => i.id === 'unlock_beam')?.purchased;
if (!isUnlocked) return;
const upgrades = this.getUpgrades('beam');
this.beamCooldown -= deltaTime;
if (this.beamCooldown <= 0 && this.beamActiveTimer <= 0) {
this.beamActiveTimer = 5;
let cooldown = 15;
if (upgrades?.fire_rate) cooldown /= 2;
this.beamCooldown = cooldown;
}
if (this.beamActiveTimer > 0) {
this.beamActiveTimer -= deltaTime;
let damage = PEG_BASE_DAMAGE * 1.5;
if (upgrades?.damage) damage *= 2;
damage *= gameState.globalDamageMultiplier;
let width = PEG_RADIUS / 3;
if (upgrades?.width) width *= 2;
const ballsHit = balls.filter(b => Math.abs(b.x - this.x) < b.radius + width);
if (upgrades?.concentrated && ballsHit.length === 1) damage *= 4;
ballsHit.forEach(ball => {
let damageToDeal = damage * deltaTime;
if (upgrades?.shock && ball.health >= ball.maxHealth) {
damageToDeal *= 2;
}
const healthBefore = ball.health;
ball.health = Math.max(1, ball.health - damageToDeal);
ball.isDamaged = true;
const actualDamage = healthBefore - ball.health;
if (actualDamage > 0) awardPrestigeProgress(actualDamage);
});
}
}
updateHex(deltaTime, balls) {
const upgrades = this.getUpgrades('hex');
this.hexCooldown -= deltaTime;
if (this.hexCooldown <= 0) {
let duration = 5;
if (upgrades?.duration) duration *= 1.5;
let radius = 60;
if (upgrades?.size) radius *= 1.5;
this.hexCircle = {
x: Math.random() * WIDTH,
y: Math.random() * (HEIGHT - 200) + 100,
radius: radius,
lifetime: duration,
};
this.hexCooldown = 5;
}
if (this.hexCircle) {
this.hexCircle.lifetime -= deltaTime;
let damage = (PEG_BASE_DAMAGE * 2/3);
if (upgrades?.damage) damage *= 2;
damage *= gameState.globalDamageMultiplier;
const damageToDeal = damage * deltaTime;
const ballsInHex = balls.filter(b => {
const dx = b.x - this.hexCircle.x;
const dy = b.y - this.hexCircle.y;
return (dx * dx + dy * dy) < (this.hexCircle.radius + b.radius) ** 2;
});
ballsInHex.forEach(ball => {
const healthBefore = ball.health;
ball.health = Math.max(1, ball.health - damageToDeal);
ball.isDamaged = true;
const actualDamage = healthBefore - ball.health;
if (actualDamage > 0) awardPrestigeProgress(actualDamage);
});
if (this.hexCircle.lifetime <= 0) this.hexCircle = null;
}
}
updateLightning(deltaTime, balls) {
const isUnlocked = gameState.prestigeShopItems.find(i => i.id === 'unlock_lightning')?.purchased;
if (!isUnlocked) return;
if (this.lightningActiveTimer > 0) {
this.lightningActiveTimer -= deltaTime;
if(this.lightningActiveTimer <= 0) this.lightningBolts = [];
}
this.lightningCooldown -= deltaTime;
if (this.lightningCooldown <= 0) {
const ballsInRange = balls.filter(b => {
const dx = this.x - b.x; const dy = this.y - b.y;
return (dx * dx + dy * dy) < PEG_BASE_RANGE ** 2;
}).sort((a,b) => (a.x-this.x)**2+(a.y-this.y)**2 - (b.x-this.x)**2+(b.y-this.y)**2);
if (ballsInRange.length > 0) {
this.lightningBolts = [];
this.lightningActiveTimer = 2.5;
const upgrades = this.getUpgrades('lightning');
let damage = PEG_BASE_DAMAGE * 2;
damage *= gameState.globalDamageMultiplier;
const mainTarget = ballsInRange[0];
let damageToDeal = damage * this.lightningCharge;
const healthBefore = mainTarget.health;
mainTarget.health = Math.max(1, mainTarget.health - damageToDeal);
mainTarget.isDamaged = true;
awardPrestigeProgress(healthBefore - mainTarget.health);
this.lightningBolts.push({ from: {x: this.x, y: this.y}, to: {x: mainTarget.x, y: mainTarget.y }});
let chainTargets = 2;
if (upgrades?.chain_1) chainTargets++;
if (upgrades?.chain_2) chainTargets++;
const nearbyBalls = balls.filter(b => b !== mainTarget).sort((a,b) => (a.x-mainTarget.x)**2+(a.y-mainTarget.y)**2 - (b.x-mainTarget.x)**2+(b.y-mainTarget.y)**2).slice(0, chainTargets);
nearbyBalls.forEach(target => {
let chainDamage = PEG_BASE_DAMAGE * 1.25;
if (upgrades?.surge) chainDamage *= 1.5;
chainDamage *= gameState.globalDamageMultiplier;
let chainDamageToDeal = chainDamage * this.lightningCharge;
const hBefore = target.health;
target.health = Math.max(1, target.health - chainDamageToDeal);
target.isDamaged = true;
awardPrestigeProgress(hBefore - target.health);
this.lightningBolts.push({ from: {x: mainTarget.x, y: mainTarget.y}, to: {x: target.x, y: target.y}});
});
let cooldown = 20;
if (upgrades?.fire_rate) cooldown /= 2;
this.lightningCooldown = cooldown;
this.lightningCharge = 1;
}
} else {
const upgrades = this.getUpgrades('lightning');
if (upgrades?.charge) {
this.lightningCharge = Math.min(5, this.lightningCharge + (deltaTime / 2));
}
}
}
updateSlicer(deltaTime, balls, ballsToAdd, ballsToRemove) {
const upgrades = this.getUpgrades('slicer');
if (this.slicerGraceTimer > 0) {
this.slicerGraceTimer -= deltaTime;
if (this.slicerGraceTimer <= 0) {
this.slicerTarget = null;
}
}
if (this.slicerTarget && (this.slicerTarget.health <= 1 || ballsToRemove.has(this.slicerTarget))) {
this.slicerTarget = null;
}
const touchingBalls = balls.filter(b => {
if (b.health <= 1) return false;
const dx = b.x - this.x;
const dy = b.y - this.y;
return (dx*dx + dy*dy) < (b.radius + this.radius)**2;
});
if (!this.slicerTarget && touchingBalls.length > 0) {
this.slicerTarget = touchingBalls[0];
let touchTime = 5;
if (upgrades?.fire_rate_1) touchTime /= 2;
if (upgrades?.fire_rate_2) touchTime /= 2;
this.slicerTouchTimer = touchTime;
}
if (this.slicerTarget) {
const isTouching = touchingBalls.includes(this.slicerTarget);
if (isTouching) {
this.slicerGraceTimer = 0;
this.slicerTouchTimer -= deltaTime;
if (this.slicerTouchTimer <= 0) {
if (upgrades?.unsheath) {
const healthBefore = this.slicerTarget.health;
this.slicerTarget.health = Math.max(1, this.slicerTarget.health * 0.8);
awardPrestigeProgress(healthBefore - this.slicerTarget.health);
}
let pieces = 2;
if (upgrades?.extra_cut) pieces = 3;
if (upgrades?.jackpot && Math.random() < 0.05) pieces = 10;
const oldHealth = this.slicerTarget.health;
const newHealth = Math.max(1, oldHealth / pieces);
for (let i = 0; i < pieces; i++) {
const newBall = new Ball(this.slicerTarget.x + (Math.random()-0.5)*10, this.slicerTarget.y);
newBall.health = newHealth;
ballsToAdd.push(newBall);
}
ballsToRemove.add(this.slicerTarget);
this.slicerTarget = null;
}
} else {
if (this.slicerGraceTimer <= 0) {
this.slicerGraceTimer = 0.1;
}
}
}
}
updateBuzzsaw(deltaTime, balls) {
const isUnlocked = gameState.prestigeShopItems.find(i => i.id === 'unlock_buzzsaw')?.purchased;
if (!isUnlocked) return;
this.buzzsawAngle += 2 * Math.PI * deltaTime;
const upgrades = this.getUpgrades('buzzsaw');
let damage = PEG_BASE_DAMAGE / 3;
if (upgrades?.damage) damage *= 2;
damage *= gameState.globalDamageMultiplier;
let range = this.radius + 15;
if (upgrades?.range) range *= 1.5;
const ballsHit = balls.filter(b => {
const dx = b.x - this.x; const dy = b.y - this.y;
return (dx * dx + dy * dy) < (range + b.radius) ** 2;
});
if (upgrades?.multi_bonus && ballsHit.length > 0) {
damage *= 1 + (0.5 * ballsHit.length);
}
ballsHit.forEach(ball => {
let finalDamage = damage;
if (upgrades?.small_bonus && ball.health < ball.maxHealth / 2) {
finalDamage *= 2;
}
const healthBefore = ball.health;
ball.health = Math.max(1, ball.health - finalDamage * deltaTime);
ball.isDamaged = true;
awardPrestigeProgress(healthBefore - ball.health);
if (upgrades?.lingering) {
ball.lingeringDamage[this.id] = {dps: finalDamage, duration: 2};
}
});
}
}
