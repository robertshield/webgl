// Game related code.

// Utility functions
//----------------------------------------------------------------------------
var Game = Game || {

  // Constructs a random set of spheres in a box. In a lousy kinda way.
  // Will eventually terminate if the ranges are sufficiently large to hold
  // count objects of radius size ;)
  generateWorldPositions : function(count, radius, xMin, xMax, yMin, yMax) {
      var centers = [];
      var minDist = (radius * 2) + 10;
      var minDistSquared = Math.pow(minDist, 2);

      var xRange = xMax - xMin;
      var yRange = yMax - yMin;

      for (var i = 0; i < count; i++) {
        var x = Math.random() * xRange;
        var y = Math.random() * yRange;

        var collided = false;
        for (var w = centers.length - 1; w >= 0; w--) {
          // Fast detect non-colliders:
          if (Math.abs(x - centers[w].x) > minDist ||
              Math.abs(y - centers[w].y) > minDist)
            continue;

          var distSquared = Math.pow((x - centers[w].x), 2) +
                            Math.pow((y - centers[w].y), 2);
          if (distSquared < minDistSquared) {
            collided = true;
            break;
          }
        }

        if (collided) {
          i--;
          continue;
        } else {
          centers.push(new THREE.Vector3(x, y, 0));
        }
      }

      // Fix up the coordinates (to save the extra add in the loop above).
      var xRangeOverTwo = xRange / 2;
      var yRangeOverTwo = yRange / 2;
      for (var c = centers.length - 1; c >= 0; c--) {
        centers[c].x -= xRangeOverTwo;
        centers[c].y -= yRangeOverTwo;
      }

      return centers;
    },

  generateWorlds : function(radius, count) {
    var world_positions = Game.generateWorldPositions(radius, count, -400, 400,
                                                      -400, 400, 0, 0);
    var worlds = [];
    for (var i = world_positions.length - 1; i >= 0; i--) {
      var initial_count = Math.round(Math.random() * 45) + 5;
      worlds.push(new Game.World(world_positions[i], radius, initial_count));
    }
    return worlds;
  },

  randomColour : function() {
    return Math.random() * 0xFFFFFF;
  }
};

// Player
//----------------------------------------------------------------------------
Game.Player = function(colour) {
  this.colour = colour;
  this.attack_ratio = 0.5;
};


// World
//----------------------------------------------------------------------------
var world_id = 0;
Game.World = function(position, size, initial_count) {
  // Give each world a unique id so we can add these to 'set'.
  // TODO: Learn javascript.
  this.id = world_id++;
  this.pos = position;
  this.size = size;
  this.count = initial_count;

  // TODO: Encapsulate these (http://javascript.crockford.com/private.html)
  this.owner = null;
  this.is_selected = false;

  this.scene_object = null;

  // Refers to a dom element with an innerHTML property that gets updated
  // with the count value.
  this.label = null;
};

Game.World.prototype = {
  attachLabel : function(label) {
    this.label = label;
  },
  attachSceneObject : function(scene_object) {
    this.scene_object = scene_object;
    this.scene_object.world = this;
    this.updateSceneObject();
  },
  getColour : function() {
    if (this.is_selected) return SELECTED_COLOUR;
    else if (this.owner) return this.owner.colour;
    else return UNSELECTED_COLOUR;
  },
  setOwner : function(owner) {
    this.owner = owner;
    this.updateSceneObject();
  },
  setSelected : function(is_selected) {
    this.is_selected = is_selected;
    this.updateSceneObject();
  },
  incrementCount : function() {
    this.setCount(this.count + 1);
  },
  setCount : function(new_count) {
    this.count = new_count;
    if (this.label) {
      this.label.innerHTML = this.count;
    }
  },
  updateSceneObject : function() {
    if (this.scene_object) {
      this.scene_object.materials[0].color.setHex(this.getColour());
    }
  }
};


// ShipSwarm
//----------------------------------------------------------------------------
Game.ShipSwarm = function(owner, count, start_world, target_world) {
  this.owner = owner;
  this.count = count;
  this.start_world = start_world;
  this.target_world = target_world;

  this.pos = start_world.pos.clone();

  var travel_vector = target_world.pos.clone().subSelf(this.pos);
  this.distance_to_travel = travel_vector.length();
  this.movement_vector = travel_vector.divideScalar(this.distance_to_travel);

  this.distance_travelled = 0;
  this.has_arrived = false;

  this.velocity = SHIP_SWARM_VELOCITY;
  this.last_update = new Date().getTime();
}

Game.ShipSwarm.prototype = {
  update : function(new_time) {
    if (!this.has_arrived) {
      var position_delta = this.velocity * (new_time - this.last_update);

      // Update our position and distance travelled.
      this.pos.addSelf(
          this.movement_vector.clone().multiplyScalar(position_delta));
      this.distance_travelled += position_delta;

      // Figure out if we've arrived.
      if (this.distance_travelled >= this.distance_to_travel) {
        this.has_arrived = true;
      }

      // Update the timestamp.
      this.last_update = new_time;
    }
  }
}


// State
//----------------------------------------------------------------------------
// TODO: Move to constants.
Game.StateEnum = {
  STARTING : 1,
  PLAYING : 2,
  PAUSED : 3,
  OVER : 4
};

Game.State = function(world_count, world_radius) {
  this.world_count = world_count;
  this.world_radius = world_radius;

  this.state = Game.StateEnum.STARTING;
  this.last_update = new Date().getTime();

  this.worlds = [];
  this.user = new Game.Player(Game.randomColour());
  this.selected_worlds = {};

  this.ship_swarms = [];
};

Game.State.prototype = {
  restart : function() {
    this.state = Game.StateEnum.STARTING;
    this.worlds = Game.generateWorlds(this.world_count, this.world_radius);
    this.worlds[0].setOwner(this.user);

    this.selected_worlds = {};
  },

  addWorld : function(world) {
    this.worlds.push(world);
  },

  updateWorldCounts : function() {
    for (var i = this.worlds.length - 1; i >= 0; i--) {
      if (this.worlds[i].owner) {
        this.worlds[i].incrementCount();
      }
    }
  },

  updateShipSwarms : function(new_time) {
    for (var i = this.ship_swarms.length - 1; i >= 0; i--) {
      var swarm = this.ship_swarms[i];
      swarm.update(new_time);
      if (swarm.has_arrived) {
        var new_world_count = swarm.target_world.count - swarm.count;
        // Now that we've accumulated attackers, tally the score.
        if (new_world_count <= 0) {
          swarm.target_world.setCount(-1 * new_world_count);
          swarm.target_world.setOwner(this.user);
        } else {
          swarm.target_world.setCount(new_world_count);
        }

        this.ship_swarms.splice(i, 1);
      }
    }
  },

  attack : function(target_world) {
    // So apparently, doing for (x in y) on simple objects the in operator
    // can be waylaid by stuff mucking with Object.prototype or something
    // like that. hasOwnProperty() or Object.keys() which requires a shim for
    // IE is the cure to this. Ugh.
    var world_keys = Object.keys(this.selected_worlds);
    if (world_keys.length > 0) {
      // Compute the number of attackers, decrementing the count of each
      // selected world as we go.
      // Un-select the selected world.
      // Decrement the target count, if negative, update owner, multiply by -1
  
      var total_attackers = 0;
      for (var i = world_keys.length - 1; i >= 0; i--) {
        var selected_world = this.selected_worlds[world_keys[i]];
        var attackers =
            Math.ceil(selected_world.count * this.user.attack_ratio);
        selected_world.setCount(selected_world.count - attackers);
        selected_world.setSelected(false);

        var swarm = new Game.ShipSwarm(this.user,
                                       attackers,
                                       selected_world,
                                       target_world);
        this.ship_swarms.push(swarm);

        // Temporary:
        total_attackers += attackers;
      }
      this.selected_worlds = {};
    }
  },

  onWorldSelected : function(world) {
    if (world.owner == this.user) {
      if (world.is_selected) {
        world.setSelected(false);
        if (world.id in this.selected_worlds) {
          delete this.selected_worlds[world.id];
        }
      } else {
        world.setSelected(true);
        this.selected_worlds[world.id] = world;
      }
    } else {
      this.attack(world);
    }
  },

  update : function() {
    var now = new Date().getTime();

    // Update the world counts.
    if (now - this.last_update > 500) {
      this.updateWorldCounts();
      this.last_update = now;
    }

    this.updateShipSwarms(now);
  }
};




