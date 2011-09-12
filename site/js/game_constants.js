// TODO: Make this a range instead.
var WORLD_RADIUS = 32;
var WORLD_COUNT = 25;
var PLAYER_START_COUNT = 50;

var NEUTRAL_COLOUR = 0x777777;
var HOVER_COLOUR = 0x005500;
var SELECTED_COLOUR = 0x00FF00;

var USER_COLOUR = 0x0000FF;
var AI_COLOUR = 0xFF0000;

var INITIAL_USER_ATTACK_RATIO = 0.5;

var TRACE_OFFSET = WORLD_RADIUS + 3;
var OVERLAY_OFFSET = WORLD_RADIUS + 6;

var AI_MOVE_INTERVAL_MS = 2000; // How often the AI makes a move.

var SHIP_SWARM_VELOCITY = 0.07;  // How many units ships move each update tick.
var SHIP_SWARM_UPDATE_PERIOD = 100;  // How many ms between each tick.

var PLAYER_WINS = -1;
var AI_WINS = -2;
var GAME_CONTINUES = -3;
var GAME_PAUSED = -4;

var GAME_MODE_NORMAL = 1;
var GAME_MODE_DEMO = 2;

