// Game data structures.

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

Game.Player = function(colour) {
  this.colour = colour;
};

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
  this.lastUpdate = new Date().getTime();

  this.worlds = [];
  this.user = new Game.Player(Game.randomColour());
  this.selected_worlds = {};

  this.attack_ratio = 0.5;
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
      // So apparently, doing for (x in y) on simple objects the in operator
      // can be waylaid by stuff mucking with Object.prototype or something
      // like that. hasOwnProperty() or Object.keys() which requires a shim for
      // IE is the cure to this. Ugh.
      var world_keys = Object.keys(this.selected_worlds);
      if (world_keys.length > 0) {
        // Attack
        // Compute the number of attackers, decrementing the count of each
        // selected world as we go.
        // Un-select the selected world.
        // Decrement the target count, if negative, update owner, multiply by -1

        var total_attackers = 0;
        for (var i = world_keys.length - 1; i >= 0; i--) {
          var selected_world = this.selected_worlds[world_keys[i]];
          var attackers = Math.ceil(selected_world.count * this.attack_ratio);
          total_attackers += attackers;
          selected_world.setCount(selected_world.count - attackers);

          selected_world.setSelected(false);
        }
        this.selected_worlds = {};

        // Now that we've accumulated attackers, tally the score.
        var new_world_count = world.count - total_attackers;
        if (new_world_count <= 0) {
          world.setCount(-1 * new_world_count);
          world.owner = this.user;
        } else {
          world.setCount(new_world_count);
        }
      }
    }
  },

  update : function() {
    var now = new Date().getTime();
    if (now - this.lastUpdate > 500) {
      this.updateWorldCounts();
      this.lastUpdate = now;
    }
  }
};




