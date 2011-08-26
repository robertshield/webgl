// TODO: Make this a range instead.
var WORLD_RADIUS = 20;
var WORLD_COUNT = 42;

var UNSELECTED_COLOUR = 0x777777;
var SELECTED_COLOUR = 0x00FF00;
var TRACE_OFFSET = WORLD_RADIUS + 3;
var OVERLAY_OFFSET = WORLD_RADIUS + 6;

var SHIP_SWARM_VELOCITY = 0.07;  // How many units ships move each update tick.
var SHIP_SWARM_UPDATE_PERIOD = 100;  // How many ms between each tick.
