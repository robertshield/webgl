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
      var initial_count = Math.round(Math.random()) * 45 + 5;
      worlds.push(new Game.World(world_positions[i], radius, initial_count));
    }
    return worlds;
  }
  
  
};

Game.Player = function(colour) {
  this.colour = colour;
};

Game.World = function(position, size, initial_count) {
  this.pos = position;
  this.size = size;
  this.count = initial_count;
  this.owner = null;
  this.is_selected = false;
  
  this.sceneObject = null;
};

Game.World.prototype = {
  attachSceneObject : function (scene_object) {
    this.scene_object = scene_object;
    this.scene_object.world = this;
  },
  getColour : function() {
    if (this.owner) {
      return this.owner.colour;
    } else {
      if (this.is_selected) return 0x00FF00;
      else return 0x777777;
    }
  },

  updateOwner : function(owner) {
    this.owner = owner;
  },

  setSelected : function(is_selected) {
    this.is_selected = is_selected;
  },
  isSelected : function() {
    return this.is_selected;
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
  this.worlds = Game.generateWorlds(world_count, world_radius);
};

Game.State.prototype = {
  restart : function() {
    this.state = StateEnum.STARTING;
    this.worlds = Game.generateWorlds(this.world_count, this.world_radius);
  },

  addWorld : function(world) {
    this.worlds.push(world);
  },

  getSelectedWorlds : function() {
    var selected_worlds = [];
    for (var i = this.worlds.length - 1; i >= 0; i--) {
      if (this.worlds[i].isSelected()) {
        selected_worlds.push(this.worlds[i]);
      }
    }
    return selected_worlds;
  }
};




