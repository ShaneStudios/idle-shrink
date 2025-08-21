const WIDTH = 300;
const HEIGHT = 600;
const GRAVITY = 98.1;
const BALL_SPAWN_RATE = 0.5;
const MAX_ACTIVE_BALLS = 50;
const BALL_START_HEALTH = 100;
const BALL_START_VALUE = 2;
const BALL_MAX_RADIUS = 56;
const BALL_MIN_RADIUS = 2;
const PEG_BASE_DAMAGE = 8;
const PEG_BASE_RANGE = 112;
const PEG_RADIUS = 15;
const PEG_SLOT_RADIUS = 17;
const INITIAL_MONEY = 50;
const INITIAL_PEG_COST = 1;
const PEG_SLOTS = [
{ x: 45, y: 380, peg: null }, { x: 115, y: 380, peg: null }, { x: 185, y: 380, peg: null }, { x: 255, y: 380, peg: null },
{ x: 60, y: 440, peg: null }, { x: 120, y: 440, peg: null }, { x: 180, y: 440, peg: null }, { x: 240, y: 440, peg: null },
{ x: 75, y: 500, peg: null }, { x: 125, y: 500, peg: null }, { x: 175, y: 500, peg: null }, { x: 225, y: 500, peg: null },
];
const PRESTIGE_SHOP_DATA = [
{ id: 'unlock_magic', name: '[Weapon] Magic', cost: 1, description: 'Area based weapon type with attacks that are random across the stage board.' },
{ id: 'ball_drop_rate_1', name: 'Ball Drop Rate', cost: 1, description: 'Multiply ball drop rate by 2.' },
{ id: 'unlock_beam', name: 'Shrink Ray - Beam', cost: 2, description: 'Add Beam module to Shrink Ray - Fires a vertical beam that hits everything in its path.' },
{ id: 'unlock_stage_2', name: 'New Stage', cost: 2, description: 'Unlocks a new stage.' },
{ id: 'unlock_lightning', name: 'Magic - Lightning', cost: 3, description: 'Add Lightning module to Magic - Shoots a shrinking bolt that chains to nearby targets.' },
{ id: 'starting_money', name: 'Starting Money', cost: 5, description: 'Start with $1000.' },
{ id: 'unlock_splitter', name: '[Weapon] Splitter', cost: 7, description: 'Unlock new weapon Splitter - Focused on shrinking by percents.' },
{ id: 'ball_drop_rate_2', name: 'Ball Drop Rate', cost: 7, description: 'Multiply ball drop rate by 2.' },
{ id: 'unlock_buzzsaw', name: 'Splitter - Buzzsaw', cost: 10, description: 'Add Buzzsaw module to Splitter - Chops up balls that touch it.' },
{ id: 'unlock_stage_3', name: 'New Stage', cost: 15, description: 'Unlocks a new stage.' },
{ id: 'free_pegs_5', name: '5 Free Pegs', cost: 20, description: 'First 5 pegs are free. Costs are scaled down accordingly.' },
{ id: 'double_damage', name: 'Double Damage', cost: 25, description: 'Multiply peg damage by 2 (multiplicative).' },
];
const MODULE_UPGRADE_PRICES = {
base: [5, 25, 80, 250, 1000],
secondary: [50, 175, 400, 2000, 10000]
};
const UPGRADE_DATA = {
shrink_ray: {
name: 'Shrink Ray',
modules: {
laser: {
name: 'Laser Module',
baseModule: true,
upgrades: [
{ id: 'damage', name: '2x Damage' },
{ id: 'range', name: '2x Range' },
{ id: 'first_hit', name: '2x First Hit Damage' },
{ id: 'multi_target', name: 'Target 2 Balls' },
{ id: 'ramping', name: 'Ramping Damage' },
]
},
beam: {
name: 'Beam Module',
unlockId: 'unlock_beam',
upgrades: [
{ id: 'damage', name: '2x Damage' },
{ id: 'width', name: '2x Width' },
{ id: 'fire_rate', name: '2x Fire Rate' },
{ id: 'concentrated', name: '4x Dmg vs 1 Target' },
{ id: 'shock', name: '2x Dmg vs Full HP' },
]
}
}
},
magic: {
name: 'Magic',
unlockId: 'unlock_magic',
modules: {
hex: {
name: 'Hex Module',
baseModule: true,
upgrades: [
{ id: 'damage', name: '2x Damage' },
{ id: 'size', name: '50% Larger Size' },
{ id: 'exploding', name: 'Exploding Balls' },
{ id: 'stacking', name: 'Stacking Hexes' },
{ id: 'duration', name: '50% Longer Duration' },
]
},
lightning: {
name: 'Lightning Module',
unlockId: 'unlock_lightning',
upgrades: [
{ id: 'chain_1', name: '+1 Chain Target' },
{ id: 'chain_2', name: '+1 Chain Target' },
{ id: 'surge', name: '+50% Chain Damage' },
{ id: 'fire_rate', name: '2x Fire Rate' },
{ id: 'charge', name: 'Charging Damage' },
]
}
}
},
splitter: {
name: 'Splitter',
unlockId: 'unlock_splitter',
modules: {
slicer: {
name: 'Slicer Module',
baseModule: true,
upgrades: [
{ id: 'extra_cut', name: 'Cut into 3' },
{ id: 'fire_rate_1', name: '2x Fire Rate' },
{ id: 'fire_rate_2', name: '2x Fire Rate' },
{ id: 'unsheath', name: 'Shrink Before Slice' },
{ id: 'jackpot', name: '5% Jackpot Chance' },
]
},
buzzsaw: {
name: 'Buzzsaw Module',
unlockId: 'unlock_buzzsaw',
upgrades: [
{ id: 'damage', name: '2x Damage' },
{ id: 'range', name: '50% Larger Range' },
{ id: 'multi_bonus', name: 'Multi-Object Bonus' },
{ id: 'small_bonus', name: 'Small Object Bonus' },
{ id: 'lingering', name: 'Lingering Damage' },
]
}
}
}
};
