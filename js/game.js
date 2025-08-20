function getDefaultGameState() {
    return {
        money: INITIAL_MONEY,
        pegs: [],
        balls: [],
        nextPegCost: INITIAL_PEG_COST,
        upgrades: {
            'damage_2x': false, 'range_2x': false, 'first_hit_2x': false,
            'multi_target_2': false, 'ramping_damage': false,
        },
        upgradesPurchasedCount: 0,
    };
}

let gameState = getDefaultGameState();

function buyPeg(x, y) {
    if (gameState.money >= gameState.nextPegCost) {
        gameState.money -= gameState.nextPegCost;
        const newPeg = new Peg(x, y);
        gameState.pegs.push(newPeg);
        const slot = PEG_SLOTS.find(s => s.x === x && s.y === y);
        if (slot) slot.peg = newPeg;
        gameState.nextPegCost *= 2;
        updateUI();
        return true;
    }
    return false;
}

function buyUpgrade(upgradeId) {
    const currentCost = UPGRADE_PRICE_TIERS[gameState.upgradesPurchasedCount];
    if (currentCost === undefined) return;

    if (gameState.money >= currentCost && !gameState.upgrades[upgradeId]) {
        gameState.money -= currentCost;
        gameState.upgrades[upgradeId] = true;
        gameState.upgradesPurchasedCount++;
        updateUI();
    }
}

function updateUI() {
    document.getElementById('moneyDisplay').textContent = `$${Math.floor(gameState.money).toLocaleString()}`;
    document.getElementById('pegCostDisplay').textContent = `$${gameState.nextPegCost.toLocaleString()}`;
    document.getElementById('ballCountDisplay').textContent = gameState.balls.length;
    const nextUpgradeCost = UPGRADE_PRICE_TIERS[gameState.upgradesPurchasedCount];

    document.querySelectorAll('.upgrade-button').forEach(button => {
        const id = button.id.replace('upgrade_', '');
        if (!button.dataset.text) {
             button.dataset.text = button.innerHTML.split('<br>')[0].trim();
        }
        const originalText = button.dataset.text;

        if (gameState.upgrades[id]) {
            button.classList.add('purchased');
            button.disabled = true;
            button.innerHTML = 'Purchased';
        } else {
            button.classList.remove('purchased');
            if (nextUpgradeCost === undefined) {
                 button.disabled = true;
                 button.innerHTML = 'All Done';
            } else {
                button.innerHTML = `${originalText}<span>$${nextUpgradeCost.toLocaleString()}</span>`;
                button.disabled = gameState.money < nextUpgradeCost;
            }
        }
    });
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
    gameState.money = loadedData.money || INITIAL_MONEY;
    gameState.nextPegCost = loadedData.nextPegCost || INITIAL_PEG_COST;
    gameState.upgrades = loadedData.upgrades || getDefaultGameState().upgrades;
    gameState.upgradesPurchasedCount = loadedData.upgradesPurchasedCount || 0;
    gameState.pegs = (loadedData.pegs || []).map(p => new Peg(p.x, p.y));
    PEG_SLOTS.forEach(slot => slot.peg = null);
    gameState.pegs.forEach(peg => {
        const slot = PEG_SLOTS.find(s => s.x === peg.x && s.y === peg.y);
        if (slot) slot.peg = peg;
    });
    updateUI();
}

function resetGame() {
    if (confirm("Are you sure you want to reset your game? All progress will be lost.")) {
        PEG_SLOTS.forEach(slot => slot.peg = null);
        gameState = getDefaultGameState();
        updateUI();
    }
}