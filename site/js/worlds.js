// Game data structures.

var Game = Game || {};

Game.Player = function(colour) {
  this.colour = colour;
};

Game.World = function(position, size, initial_count, sceneObject, overlayObject) {
  this.pos = position;
  this.size = size;
  this.count = initial_count;
  this.owner = null;
  
  this.sceneObject = sceneObject;
  this.overlayObject = overlayObject;

  this.sceneObject.world = this;
};

Game.World.prototype = {
  getColour : function() {
    if (this.owner) {
      return this.owner.colour;
    } else {
      return '0x777777';
    }
  },

  updateOwner : function(owner) {
    this.owner = owner;
  },

  setSelected : function(is_selected) {
    this.is_selected = is_selected;
  },
};

Game.StateEnum = {
  STARTING : 1,
  PLAYING : 2,
  PAUSED : 3,
  OVER : 4
};

Game.State = function() {
  this.state = Game.StateEnum.STARTING;
  this.worlds = [];
};

Game.State.prototype = {

  restart : function() {
    this.state = StateEnum.STARTING;
    this.worlds = [];
  },

  addWorld : function(world) {
    this.worlds.push(world);
  },

  // Constructs a random set of spheres in a box. In a lousy kinda way.
  // Will eventually terminate if the ranges are sufficiently large to hold
  // count objects of radius size ;)
  generateWorldPositions : function(radius, count, xMin, xMax, yMin, yMax) {
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
    }
  
};




