const prestigeCostTiers = [1000, 2000, 3250, 4500];
function calculateNextPrestigeCost(points) {
if (points < 4) return prestigeCostTiers[points];
let cost = prestigeCostTiers[3];
let pointsLeft = points - 3;
function addCost(count, amount) {
const num = Math.min(pointsLeft, count);
cost += num * amount;
pointsLeft -= num;
}
addCost(3, 1500);
if(pointsLeft > 0) addCost(2, 2000);
if(pointsLeft > 0) addCost(2, 5000);
if(pointsLeft > 0) addCost(4, 15000);
if(pointsLeft > 0) addCost(6, 60000);
if (pointsLeft > 0) {
let increment = 120000;
while (pointsLeft > 0) {
const num = Math.min(pointsLeft, 10);
cost += num * increment;
pointsLeft -= num;
increment *= 2;
}
}
return cost;
}
function generateInitialUpgradesState() {
const upgrades = {};
for (const weaponId in UPGRADE_DATA) {
upgrades[weaponId] = {};
for (const moduleId in UPGRADE_DATA[weaponId].modules) {
upgrades[weaponId][moduleId] = {};
for (const upgrade of UPGRADE_DATA[weaponId].modules[moduleId].upgrades) {
upgrades[weaponId][moduleId][upgrade.id] = false;
}
}
}
return upgrades;
}
function generateInitialPurchaseCounts() {
const counts = {};
for (const weaponId in UPGRADE_DATA) {
counts[weaponId] = {};
for (const moduleId in UPGRADE_DATA[weaponId].modules) {
counts[weaponId][moduleId] = 0;
}
}
return counts;
}
function getDefaultGameState() {
return {
money: INITIAL_MONEY,
lifetimeDamage: 0,
pegs: [],
balls: [],
nextPegCost: INITIAL_PEG_COST,
upgrades: generateInitialUpgradesState(),
upgradesPurchasedCount: generateInitialPurchaseCounts(),
prestigePointsEarnedThisRun: 0,
totalPrestigePoints: 0,
prestigeResets: 0,
nextPrestigeCost: calculateNextPrestigeCost(0),
prestigeShopItems: PRESTIGE_SHOP_DATA.map(item => ({ ...item, purchased: false })),
ballDropRateMultiplier: 1,
globalDamageMultiplier: 1,
freePegsRemaining: 0,
activeWeaponType: null,
};
}
let gameState = getDefaultGameState();
let selectedShopItemId = null;
function performRunReset() {
const oldState = getDefaultGameState();
gameState.money = gameState.prestigeShopItems.find(i => i.id === 'starting_money')?.purchased ? 1000 : oldState.money;
gameState.freePegsRemaining = gameState.prestigeShopItems.find(i => i.id === 'free_pegs_5')?.purchased ? 5 : 0;
gameState.lifetimeDamage = 0;
gameState.pegs = [];
gameState.balls = [];
gameState.nextPegCost = oldState.nextPegCost;
gameState.upgrades = oldState.upgrades;
gameState.upgradesPurchasedCount = oldState.upgradesPurchasedCount;
gameState.prestigePointsEarnedThisRun = 0;
gameState.nextPrestigeCost = calculateNextPrestigeCost(0);
gameState.activeWeaponType = null;
PEG_SLOTS.forEach(slot => slot.peg = null);
updateUI();
}
function prestigeReset() {
if (gameState.prestigePointsEarnedThisRun <= 0) {
alert("You have no Prestige Points ready to collect. Earn more lifetime damage!");
return;
}
if (confirm(`Are you sure you want to Prestige? You will collect ${gameState.prestigePointsEarnedThisRun} Prestige Point(s) and reset your current run.`)) {
gameState.totalPrestigePoints += gameState.prestigePointsEarnedThisRun;
gameState.prestigeResets++;
performRunReset();
}
}
function buyPeg(x, y) {
const cost = gameState.freePegsRemaining > 0 ? 0 : gameState.nextPegCost;
if (gameState.money >= cost) {
gameState.money -= cost;
if (gameState.freePegsRemaining > 0) {
gameState.freePegsRemaining--;
} else {
gameState.nextPegCost *= 2;
}
const newPeg = new Peg(x, y, gameState.activeWeaponType);
gameState.pegs.push(newPeg);
const slot = PEG_SLOTS.find(s => s.x === x && s.y === y);
if (slot) slot.peg = newPeg;
updateUI();
return true;
}
return false;
}
function buyUpgrade(weaponId, moduleId, upgradeId) {
const moduleData = UPGRADE_DATA[weaponId]?.modules[moduleId];
if (!moduleData) return;
const priceTiers = moduleData.baseModule ? MODULE_UPGRADE_PRICES.base : MODULE_UPGRADE_PRICES.secondary;
const purchaseCount = gameState.upgradesPurchasedCount[weaponId][moduleId];
const cost = priceTiers[purchaseCount];
if (cost === undefined) return;
if (gameState.money >= cost && !gameState.upgrades[weaponId][moduleId][upgradeId]) {
gameState.money -= cost;
gameState.upgrades[weaponId][moduleId][upgradeId] = true;
gameState.upgradesPurchasedCount[weaponId][moduleId]++;
renderActiveWeaponUpgrades();
}
}
function updatePrestige() {
while (gameState.lifetimeDamage >= gameState.nextPrestigeCost) {
gameState.prestigePointsEarnedThisRun++;
gameState.nextPrestigeCost = calculateNextPrestigeCost(gameState.prestigePointsEarnedThisRun);
}
}
function awardPrestigeProgress(damageAmount) {
gameState.lifetimeDamage += damageAmount;
updatePrestige();
}
function updateUI() {
document.getElementById('moneyDisplay').textContent = `$${Math.floor(gameState.money).toLocaleString()}`;
document.getElementById('ballCountDisplay').textContent = gameState.balls.length;
const pegCost = gameState.freePegsRemaining > 0 ? 0 : gameState.nextPegCost;
document.getElementById('pegCostDisplay').textContent = `$${pegCost.toLocaleString()}`;
document.getElementById('lifetimeDamageDisplay').textContent = `${Math.floor(gameState.lifetimeDamage).toLocaleString()}`;
document.getElementById('nextPrestigeCostDisplay').textContent = `${gameState.nextPrestigeCost.toLocaleString()}`;
const remaining = Math.max(0, gameState.nextPrestigeCost - gameState.lifetimeDamage);
document.getElementById('prestigeRemainingDisplay').textContent = `${Math.ceil(remaining).toLocaleString()}`;
document.getElementById('prestigeReadyDisplay').textContent = gameState.prestigePointsEarnedThisRun.toLocaleString();
document.getElementById('prestigeResetButton').disabled = gameState.prestigePointsEarnedThisRun <= 0;
document.getElementById('prestigePointsDisplay').textContent = gameState.totalPrestigePoints.toLocaleString();
renderActiveWeaponUpgrades();
}
function renderActiveWeaponUpgrades() {
const container = document.getElementById('upgrades-section');
container.innerHTML = '';
const weaponId = gameState.activeWeaponType;
if (!weaponId) return;
const weaponData = UPGRADE_DATA[weaponId];
const mainHeader = document.createElement('h3');
mainHeader.textContent = `${weaponData.name} Upgrades`;
container.appendChild(mainHeader);
for (const moduleId in weaponData.modules) {
const moduleData = weaponData.modules[moduleId];
const isUnlocked = moduleData.baseModule || gameState.prestigeShopItems.find(i => i.id === moduleData.unlockId)?.purchased;
if (isUnlocked) {
const moduleHeader = document.createElement('h4');
moduleHeader.className = 'module-header';
moduleHeader.textContent = moduleData.name;
container.appendChild(moduleHeader);
const grid = document.createElement('div');
grid.className = 'upgrade-grid';
const purchaseCount = gameState.upgradesPurchasedCount[weaponId][moduleId];
const priceTiers = moduleData.baseModule ? MODULE_UPGRADE_PRICES.base : MODULE_UPGRADE_PRICES.secondary;
const currentCost = priceTiers[purchaseCount];
moduleData.upgrades.forEach(upgrade => {
const button = document.createElement('button');
button.className = 'upgrade-button hexagon';
const isPurchased = gameState.upgrades[weaponId][moduleId][upgrade.id];
if (isPurchased) {
button.classList.add('purchased');
button.disabled = true;
button.innerHTML = 'Purchased';
} else {
if (currentCost !== undefined) {
button.innerHTML = `${upgrade.name}<span>$${currentCost.toLocaleString()}</span>`;
button.disabled = gameState.money < currentCost;
} else {
button.innerHTML = upgrade.name;
button.disabled = true;
}
button.addEventListener('click', () => buyUpgrade(weaponId, moduleId, upgrade.id));
}
grid.appendChild(button);
});
container.appendChild(grid);
}
}
}
function renderPrestigeShop() {
const shopGrid = document.getElementById('shop-grid');
shopGrid.innerHTML = '';
gameState.prestigeShopItems.forEach(item => {
const button = document.createElement('button');
button.className = 'shop-item hexagon';
button.dataset.id = item.id;
if (item.purchased) {
button.classList.add('purchased');
}
button.innerHTML = `<div class="item-name">${item.name}</div><div class="item-cost">${item.cost} PP</div>`;
shopGrid.appendChild(button);
});
}
function selectShopItem(itemId) {
selectedShopItemId = itemId;
const allItems = document.querySelectorAll('.shop-item');
allItems.forEach(item => item.classList.remove('selected'));
if (itemId) {
const selectedButton = document.querySelector(`.shop-item[data-id="${itemId}"]`);
selectedButton.classList.add('selected');
}
updateShopInfoPane();
}
function updateShopInfoPane() {
const infoPane = document.getElementById('shop-info-pane');
const purchaseButton = document.getElementById('purchase-item-button');
const item = gameState.prestigeShopItems.find(i => i.id === selectedShopItemId);
if (!item) {
infoPane.innerHTML = `<p class="placeholder">Select an item to view its details.</p>`;
purchaseButton.disabled = true;
return;
}
infoPane.innerHTML = `<div class="info-name">${item.name}</div><div class="info-desc">${item.description}</div>`;
purchaseButton.disabled = item.purchased || gameState.totalPrestigePoints < item.cost;
}
function purchaseShopItem() {
if (!selectedShopItemId) return;
const item = gameState.prestigeShopItems.find(i => i.id === selectedShopItemId);
if (item && item.id.includes('unlock_stage')) {
alert("This is update v0.02 - New stages will be added in v0.03");
return;
}
if (!item || item.purchased || gameState.totalPrestigePoints < item.cost) {
return;
}
gameState.totalPrestigePoints -= item.cost;
item.purchased = true;
applyPrestigeUpgradeEffect(item.id);
renderPrestigeShop();
selectShopItem(item.id);
updateUI();
}
function applyPrestigeUpgradeEffect(itemId) {
if (itemId === 'ball_drop_rate_1' || itemId === 'ball_drop_rate_2') {
gameState.ballDropRateMultiplier *= 2;
}
if (itemId === 'double_damage') {
gameState.globalDamageMultiplier *= 2;
}
}
function saveGame() {
const stateToSave = { ...gameState, balls: [] };
const stateString = JSON.stringify(stateToSave);
const encodedState = btoa(stateString);
const blob = new Blob([encodedState], { type: 'text/plain' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'idle-shrink-save.txt';
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
URL.revokeObjectURL(url);
}
function loadGame(loadedData) {
const defaultState = getDefaultGameState();
gameState.money = loadedData.money || defaultState.money;
gameState.lifetimeDamage = loadedData.lifetimeDamage || 0;
gameState.nextPegCost = loadedData.nextPegCost || defaultState.nextPegCost;
gameState.upgrades = loadedData.upgrades || defaultState.upgrades;
gameState.upgradesPurchasedCount = loadedData.upgradesPurchasedCount || defaultState.upgradesPurchasedCount;
gameState.prestigePointsEarnedThisRun = loadedData.prestigePointsEarnedThisRun || 0;
gameState.totalPrestigePoints = loadedData.totalPrestigePoints || 0;
gameState.prestigeResets = loadedData.prestigeResets || 0;
gameState.nextPrestigeCost = loadedData.nextPrestigeCost || calculateNextPrestigeCost(0);
gameState.prestigeShopItems = loadedData.prestigeShopItems || defaultState.prestigeShopItems;
gameState.ballDropRateMultiplier = loadedData.ballDropRateMultiplier || 1;
gameState.globalDamageMultiplier = loadedData.globalDamageMultiplier || 1;
gameState.freePegsRemaining = loadedData.freePegsRemaining || 0;
gameState.activeWeaponType = loadedData.activeWeaponType || null;
gameState.pegs = (loadedData.pegs || []).map(p => new Peg(p.x, p.y, p.weaponType || 'shrink_ray'));
PEG_SLOTS.forEach(slot => slot.peg = null);
gameState.pegs.forEach(peg => {
const slot = PEG_SLOTS.find(s => s.x === peg.x && s.y === peg.y);
if (slot) slot.peg = peg;
});
updateUI();
}
function resetGame() {
if (confirm("Are you sure you want to reset your current run? You will keep your Prestige Points and Shop items, but your money and pegs will be reset.")) {
performRunReset();
}
}
