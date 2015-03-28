// Implementation of flocking boids, borrowed and modified from 
// https://github.com/mrdoob/three.js/blob/master/examples/canvas_geometry_birds.html
//
// TrackingBoids differ from regular boids in that their separation vector
// decreases as they near their goal. The effect is something like a swarm of
// angry bees converging on a hapless target.

var TrackingBoid = function(start_position, goal_position) {
  var vector = new THREE.Vector3(), 
     _acceleration,
     _width = 500,
     _height = 500,
     _depth = 200,
     _goal,
     _neighborhoodRadius = 100,
     _maxSpeed = 2,
     _maxSteerForce = 0.1,
     _max_separation_factor = 800,
     _avoidWalls = false,
     _arrival_threshold = 20;

  var _starting_dist_to_goal;
  var _shortest_dist_to_goal = Number.MAX_VALUE;

  this.position = start_position.clone();
  this.velocity = new THREE.Vector3();
  _acceleration = new THREE.Vector3();
  _goal = goal_position.clone();
  _starting_dist_to_goal = _goal.clone().subSelf(this.position).length();

  this.hasArrived = function() {
    if(_goal &&
       _goal.clone().subSelf(this.position).length() < _arrival_threshold) {
      return true;
    }
    return false;
  }

  this.setAvoidWalls = function(value) {
    _avoidWalls = value;
  }

  this.setWorldSize = function(width, height, depth) {
    _width = width;
    _height = height;
    _depth = depth;
  }

  this.run = function(boids) {
    if(_avoidWalls) {
      vector.set(-_width, this.position.y, this.position.z);
      vector = this.avoid(vector);
      vector.multiplyScalar(5);
      _acceleration.addSelf(vector);
      vector.set(_width, this.position.y, this.position.z);
      vector = this.avoid(vector);
      vector.multiplyScalar(5);
      _acceleration.addSelf(vector);
      vector.set(this.position.x, -_height, this.position.z);
      vector = this.avoid(vector);
      vector.multiplyScalar(5);
      _acceleration.addSelf(vector);
      vector.set(this.position.x, _height, this.position.z);
      vector = this.avoid(vector);
      vector.multiplyScalar(5);
      _acceleration.addSelf(vector);
      vector.set(this.position.x, this.position.y, -_depth);
      vector = this.avoid(vector);
      vector.multiplyScalar(5);
      _acceleration.addSelf(vector);
      vector.set(this.position.x, this.position.y, _depth);
      vector = this.avoid(vector);
      vector.multiplyScalar(5);
      _acceleration.addSelf(vector);
    }

    if(Math.random() > 0.5) {
      this.flock(boids);
    }
    this.move();
  }

  this.flock = function(boids) {
    if(_goal) {
      var dist_to_goal = _goal.clone().subSelf(this.position).length();
      _shortest_dist_to_goal = Math.min(dist_to_goal, _shortest_dist_to_goal);
      _acceleration.addSelf(this.reach(_goal, 0.5));
    }
    _acceleration.addSelf(this.alignment(boids));
    _acceleration.addSelf(this.cohesion(boids));

    var separation_factor =
        (_shortest_dist_to_goal / _starting_dist_to_goal) *
        _max_separation_factor;
    _acceleration.addSelf(
        this.separation(boids).multiplyScalar(separation_factor));
  }

  this.move = function() {
    this.velocity.addSelf(_acceleration);
    var l = this.velocity.length();
    if(l > _maxSpeed) {
      this.velocity.divideScalar(l / _maxSpeed);
    }
    this.position.addSelf(this.velocity);
    _acceleration.set(0, 0, 0);
  }

  this.avoid = function(target) {
    var steer = new THREE.Vector3();
    steer.copy(this.position);
    steer.subSelf(target);
    steer.multiplyScalar(1 / this.position.distanceToSquared(target));
    return steer;
  }

  this.repulse = function(target) {
    var distance = this.position.distanceTo(target);
    if(distance < 150) {
      var steer = new THREE.Vector3();
      steer.sub(this.position, target);
      steer.multiplyScalar(0.5 / distance);
      _acceleration.addSelf(steer);
    }
  }

  this.reach = function(target, amount) {
    var steer = new THREE.Vector3();
    steer.sub(target, this.position);
    steer.multiplyScalar(amount);
    return steer;
  }

  this.alignment = function(boids) {
    var boid, velSum = new THREE.Vector3(), count = 0;
    for(var i = 0, il = boids.length; i < il; i++) {
      if(Math.random() > 0.6)
        continue;
      boid = boids[i];
      var distance = boid.position.distanceTo(this.position);
      if(distance > 0 && distance <= _neighborhoodRadius) {
        velSum.addSelf(boid.velocity);
        count++;
      }
    }
    if(count > 0) {
      velSum.divideScalar(count);
      var l = velSum.length();
      if(l > _maxSteerForce) {
        velSum.divideScalar(l / _maxSteerForce);
      }
    }
    return velSum;
  }

  this.cohesion = function(boids) {
    var boid, distance, posSum = new THREE.Vector3(),
        steer = new THREE.Vector3(), count = 0;
    for(var i = 0, il = boids.length; i < il; i++) {
      if(Math.random() > 0.6)
        continue;
      boid = boids[i];
      distance = boid.position.distanceTo(this.position);
      if(distance > 0 && distance <= _neighborhoodRadius) {
        posSum.addSelf(boid.position);
        count++;
      }
    }
    if(count > 0) {
      posSum.divideScalar(count);
    }
    steer.sub(posSum, this.position);
    var l = steer.length();
    if(l > _maxSteerForce) {
      steer.divideScalar(l / _maxSteerForce);
    }
    return steer;
  }

  this.separation = function(boids) {
    var boid, distance, posSum = new THREE.Vector3(),
        repulse = new THREE.Vector3();
    for(var i = 0, il = boids.length; i < il; i++) {
      if(Math.random() > 0.6)
        continue;
      boid = boids[i];
      distance = boid.position.distanceTo(this.position);
      if(distance > 0 && distance <= _neighborhoodRadius) {
        repulse.sub(this.position, boid.position);
        repulse.normalize();
        repulse.divideScalar(distance);
        posSum.addSelf(repulse);
      }
    }
    return posSum;
  }
};

