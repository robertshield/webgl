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
  this.attack_ratio = INITIAL_USER_ATTACK_RATIO;
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
    else return NEUTRAL_COLOUR;
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

  this.has_arrived = false;

  this.boids = [];
  for (var i = 0; i < count; i++) {
    this.boids.push(new TrackingBoid(this.pos, this.target_world.pos));
  }
}

Game.ShipSwarm.prototype = {
  update : function(new_time) {
    if (!this.has_arrived) {
      for (var i = 0; i < this.boids.length; i++) {
        var boid = this.boids[i];
        boid.run(this.boids);

        if (boid.hasArrived()) {
          if (boid.onArrived) {
            boid.onArrived(boid.scene, boid.ship);
          }
          if (this.owner != this.target_world.owner) {
            var new_world_count = this.target_world.count - 1;
            // Now that we've accumulated attackers, tally the score.
            if (new_world_count <= 0) {
              this.target_world.setCount(-1 * new_world_count);
              this.target_world.setOwner(this.owner);
            } else {
              this.target_world.setCount(new_world_count);
            }
          } else {
            this.target_world.incrementCount();
          }
          this.boids.splice(i, 1);
        }
      }

      // Figure out if we've arrived.
      if (this.boids.length == 0) {
        this.has_arrived = true;
      }
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
  this.last_ai_update = new Date().getTime();

  this.worlds = [];
  this.user = new Game.Player(USER_COLOUR);
  this.ai = new Game.Player(AI_COLOUR);

  this.selected_worlds = {};
  this.ship_swarms = [];

  this.renderer = null;
};

Game.State.prototype = {
  restart : function() {
    this.state = Game.StateEnum.STARTING;
    this.worlds = Game.generateWorlds(this.world_count, this.world_radius);
    this.worlds[0].setOwner(this.user);
    this.worlds[0].setCount(PLAYER_START_COUNT);
    this.worlds[1].setOwner(this.ai);
    this.worlds[1].setCount(PLAYER_START_COUNT);

    this.selected_worlds = {};
  },

  addWorld : function(world) {
    this.worlds.push(world);
  },

  setRenderer : function(renderer) {
    this.renderer = renderer;
  },

  // Call with a value from 0 to 100.
  setUserAttackRatio : function(attack_ratio) {
    this.user.attack_ratio = attack_ratio / 100;
  },

  updateWorldCounts : function() {
    for (var i = this.worlds.length - 1; i >= 0; i--) {
      if (this.worlds[i].owner) {
        this.worlds[i].incrementCount();
      }
    }
  },

  clearSelectedWorlds : function() {
    var world_keys = Object.keys(this.selected_worlds);
    for (var i = world_keys.length - 1; i >= 0; i--) {
      this.selected_worlds[world_keys[i]].setSelected(false);
    }
    this.selected_worlds = {};
  },

  updateShipSwarms : function(new_time) {
    for (var i = this.ship_swarms.length - 1; i >= 0; i--) {
      var swarm = this.ship_swarms[i];
      swarm.update(new_time);

      // Delete the swarm once it reaches its destination.
      if (swarm.has_arrived) {
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
        this.renderer.addShipSwarm(swarm);
      }
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
      this.clearSelectedWorlds();
    }
  },

  // Causes the AI to move. Returns true if the AI has won.
  makeAIMove : function() {
    // Find a target world.
    var min_count = Number.MAX_VALUE;
    var target_world = null;
    var ai_planet_count = 0, user_planet_count = 0;
    for (var i = this.worlds.length - 1; i >= 0; i--) {
      var world = this.worlds[i];
      if (world.count < min_count &&
          world.owner != this.ai) {
        target_world = world;
        min_count = target_world.count;
      }
      if (world.owner == this.ai) {
        ai_planet_count++;
      } else if (world.owner == this.user) {
        user_planet_count++;
      }
    }

    if (ai_planet_count == 0) {
      // The player is victorious!
      return PLAYER_WINS;
    } else if (user_planet_count == 0 || target_world == null) {
      // The AI is victorious!
      return AI_WINS;
    }

    // Otherwise, attack.
    // TODO: Refactor the common code here and in attack().
    for (var i = this.worlds.length - 1; i >= 0; i--) {
      var world = this.worlds[i];
      if (world.owner == this.ai && world.count > 20 && world.count < 100) {
        var attackers =
            Math.ceil(world.count * this.ai.attack_ratio);
        world.setCount(world.count - attackers);

        var swarm = new Game.ShipSwarm(this.ai,
                                       attackers,
                                       world,
                                       target_world);
        this.ship_swarms.push(swarm);
        this.renderer.addShipSwarm(swarm);
      }
    }

    return GAME_CONTINUES;
  },

  update : function() {
    var now = new Date().getTime();

    // Update the world counts.
    if (now - this.last_update > 500) {
      this.updateWorldCounts();
      this.last_update = now;
    }

    var result = GAME_CONTINUES;
    if (now - this.last_ai_update > AI_MOVE_INTERVAL_MS) {
      result = this.makeAIMove();
      this.last_ai_update = now;
    }

    this.updateShipSwarms(now);

    return result;
  }
};




