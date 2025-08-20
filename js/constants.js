const WIDTH = 300;
const HEIGHT = 600;

const GRAVITY = 98.1;
const BALL_SPAWN_RATE = 0.5;

const BALL_START_HEALTH = 100;
const BALL_START_VALUE = 2;
const BALL_MAX_RADIUS = 56;
const BALL_MIN_RADIUS = 2;

const PEG_BASE_DAMAGE = 5;
const PEG_BASE_RANGE = 112;
const PEG_RADIUS = 15;
const PEG_SLOT_RADIUS = 17;

const INITIAL_MONEY = 50;
const INITIAL_PEG_COST = 1;

const UPGRADE_PRICE_TIERS = [5, 25, 150, 500, 1000];

const PEG_SLOTS = [
    { x: 45, y: 380, peg: null }, { x: 115, y: 380, peg: null }, { x: 185, y: 380, peg: null }, { x: 255, y: 380, peg: null },
    { x: 60, y: 440, peg: null }, { x: 120, y: 440, peg: null }, { x: 180, y: 440, peg: null }, { x: 240, y: 440, peg: null },
    { x: 75, y: 500, peg: null }, { x: 125, y: 500, peg: null }, { x: 175, y: 500, peg: null }, { x: 225, y: 500, peg: null },
];