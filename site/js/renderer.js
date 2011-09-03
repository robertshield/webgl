
// The renderer handles all Three.
Game.Renderer = function(game_state) {
  this.game_state = game_state;

  this.camera = null;
  this.scene = new THREE.Scene();

  this.skybox_camera = null;
  this.skybox_scene = new THREE.Scene();

  this.ships_scene = new THREE.Scene();

  this.projector = new THREE.Projector();
  this.renderer = null;

  this.mouse = { x: 0, y: 0 };

  this.intersecting_world;

  this.ship_swarms = [];
}

Game.Renderer.prototype.initScene = function() {

  // Set up up the cameras
  this.camera = new THREE.Camera(50,
                                 window.innerWidth / window.innerHeight,
                                 1,
                                 10000 );
  //this.camera.projectionMatrix = THREE.Matrix4.makeOrtho( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, - 2000, 1000 );
  this.camera.target.position.x = 0;
  this.camera.target.position.y = 0;
  this.camera.target.position.z = 0;
  this.camera.position.x = 0;
  this.camera.position.y = 0;
  this.camera.position.z = 900;
  this.camera.update();

  this.skybox_camera = new THREE.Camera(60,
                                        window.innerWidth / window.innerHeight,
                                        1,
                                        100000 );

  // Set up the lighting
  var light = new THREE.DirectionalLight( 0xffffff, 2 );
  light.position.x = 1;
  light.position.y = 1;
  light.position.z = 1;
  light.position.normalize();
  this.scene.addLight(light);

  var light = new THREE.DirectionalLight( 0xffffff );
  light.position.x = - 1;
  light.position.y = - 1;
  light.position.z = - 1;
  light.position.normalize();
  this.scene.addLight( light );


  // Set up the skybox
  var path = "img/skybox/";
  var format = '.jpg';
  var urls = [
    path + 'px' + format, path + 'nx' + format,
    path + 'py' + format, path + 'ny' + format,
    path + 'pz' + format, path + 'nz' + format
  ];

  var texture_cube = THREE.ImageUtils.loadTextureCube(urls);
  var material = new THREE.MeshBasicMaterial( { color: 0xffffff,
                                                envMap: texture_cube } );
  var shader = THREE.ShaderUtils.lib["cube"];
  shader.uniforms["tCube"].texture = texture_cube;

  var material = new THREE.MeshShaderMaterial({
    fragmentShader: shader.fragmentShader,
    vertexShader: shader.vertexShader,
    uniforms: shader.uniforms
  });

  var skybox = new THREE.Mesh(new THREE.CubeGeometry(100000, 100000, 100000,
                                                     1, 1, 1, null, true),
                              material);
  skybox.name = 'skybox';
  this.skybox_scene.addObject(skybox);

  // Set up the sprites
  this.sprite_texture = THREE.ImageUtils.loadTexture("img/sprites/circle.png");

  // Create the THREE.js renderer:
  this.renderer = new THREE.WebGLRenderer();
  this.renderer.sortObjects = false;
  this.renderer.autoClear = false;
  this.renderer.domElement.style.zIndex = -1;
  this.renderer.setSize( window.innerWidth, window.innerHeight );
};

Game.Renderer.prototype.addWorlds = function(worlds, radius) {
  var geometry = new THREE.SphereGeometry(radius, 20, 20);

  for (var i = worlds.length - 1; i >= 0; i--) {
    var globe = new THREE.Mesh(
        geometry,
        new THREE.MeshLambertMaterial( { color: 0x777777 } ));
    globe.position.x = worlds[i].pos.x;
    globe.position.y = worlds[i].pos.y;
    globe.position.z = worlds[i].pos.z;
    worlds[i].attachSceneObject(globe);
    this.scene.addObject(globe);
  }
};

Game.Renderer.prototype.updateMouse = function(x, y) {
  this.mouse.x = x;
  this.mouse.y = y;
}

Game.Renderer.prototype.calcScreenCoordinates = function(worlds) {
  // The thinking here is this:
  // for every world coordinate
  //   1) project it into view space using projector.projectVector. This
  //      assumes that the camera's projection matrix is up to date (meaning
  //      that camera.update() has been called).
  //   2) transform the view space ([-1,1]) to screen space ([0,width|height])
  //      for the x,y coordinates by using the mapping
  //      Sx = Vx * width / 2 + width / 2
  //      Sy = Vy * -1 * height / 2 + height / 2
  //      Sz = 0
  var viewport_to_screen_mult = new THREE.Vector3(window.innerWidth / 2,
                                                  -1 * (window.innerHeight / 2),
                                                  0);
  var viewport_to_screen_add = new THREE.Vector3(window.innerWidth / 2,
                                                 window.innerHeight / 2,
                                                 0);
  var screen_coordinates = [];
  for (var i = worlds.length - 1; i >= 0; i--) {
    var viewport_coord = this.projector.projectVector(
        worlds[i].pos.clone(), this.camera);
    viewport_coord.multiplySelf(viewport_to_screen_mult);
    var screen_coord = viewport_coord.addSelf(viewport_to_screen_add);
    screen_coordinates.unshift(screen_coord);
  }
  return screen_coordinates;
};

Game.Renderer.prototype.buildLineObject = function(start, end) {
  var geometry = new THREE.Geometry();
  var start_vertex = new THREE.Vertex(start.clone());
  start_vertex.position.z = TRACE_OFFSET;
  geometry.vertices.push(start_vertex);
  geometry.colors.push(new THREE.Color(SELECTED_COLOUR));

  var end_vertex = new THREE.Vertex(end.clone());
  end_vertex.position.z = TRACE_OFFSET;
  geometry.vertices.push(end_vertex);
  geometry.colors.push(new THREE.Color(NEUTRAL_COLOUR));

  var material = new THREE.LineBasicMaterial( { color: 0xffffff,
                                                opacity: 1,
                                                linewidth: 3,
                                                vertexColors: true } );
  var line = new THREE.Line(geometry, material);
  return line;
};

Game.Renderer.prototype.addShipSwarm = function(ship_swarm) {
  var ships = [];
  var scene = this.ships_scene;

  // Ships are rotated around the z-axis to point at their target.
  var z_rot = Math.atan2(
      ship_swarm.target_world.pos.y - ship_swarm.start_world.pos.y,
      ship_swarm.target_world.pos.x - ship_swarm.start_world.pos.x);
  var ship_rotation = new THREE.Vector3(0, 0, z_rot);

  for (var i = 0, il = ship_swarm.boids.length; i < il; i++) {
    var ship = ships[i] = new THREE.Mesh(
        new Ship(),
        new THREE.MeshBasicMaterial( { color: ship_swarm.owner.colour } ) );
    ship.position = ship_swarm.boids[i].position;
    ship.rotation = ship_rotation;
    ship.doubleSided = true;
    ship.scale = new THREE.Vector3(3, 3, 3);

    // Nasty hack used to update the rotation during rendering.
    // TODO: Feed the ship rotation directly from the boid somehow.
    ship.target_pos = ship_swarm.target_world.pos.clone();

    scene.addObject(ship);

    // TODO: Understand closures. Should be able to pass scene and ship
    // inside a closure I reckon.
    function deleteShip(scene, ship) {
      scene.removeObject(ship);
    }
    ship_swarm.boids[i].scene = scene;
    ship_swarm.boids[i].ship = ship;
    ship_swarm.boids[i].onArrived = deleteShip;
  }

  this.ship_swarms.push(ships);
};

Game.Renderer.prototype.render = function() {
  // Compute the projected mouse cursor location
  var vector = new THREE.Vector3( this.mouse.x, this.mouse.y, 0.5 );
  this.projector.unprojectVector(vector, this.camera);

  // Look for an intersecting planet, highlight it.
  var ray = new THREE.Ray(this.camera.position,
                          vector.subSelf(this.camera.position).normalize());
  var intersects = ray.intersectScene(this.scene);
  if (intersects.length > 0) {
    if (this.intersecting_world != intersects[0].object) {
      var world = intersects[0].object.world;
      if (world.owner == this.game_state.user ||
          Object.keys(this.game_state.selected_worlds).length > 0) {
        this.intersecting_world = intersects[0].object;
        this.intersecting_world.materials[0].color.setHex( HOVER_COLOUR );
      }
    }
  } else {
    if (this.intersecting_world) {
      this.intersecting_world.materials[ 0 ].color.setHex(
          this.intersecting_world.world.getColour());
    }
    this.intersecting_world = null;
  }

  // Scene for all the dynamically generated stuff (does not participate in
  // hit testing).
  var generated_scene = new THREE.Scene();

  // If we have an active selection, render tracking lines from it to other
  // planets.
  if (this.intersecting_world &&
      this.intersecting_world.world.owner != this.game_state.user) {
    var selected_worlds = this.game_state.selected_worlds;
    var keys = Object.keys(selected_worlds);
    for (var i = keys.length - 1; i >= 0; i--) {
      // Draw line between here and this.intersecting_world.
      var line = this.buildLineObject(selected_worlds[keys[i]].pos,
                                      this.intersecting_world.world.pos);
      generated_scene.addObject(line);
    }
  }

  // Update ship rotations.
  for (var i = this.ship_swarms.length - 1; i >= 0; i--) {
    for (var j = this.ship_swarms[i].length - 1; j >= 0; j--) {
      var ship = this.ship_swarms[i][j];
      var z_rot = Math.atan2(ship.target_pos.y - ship.position.y,
                             ship.target_pos.x - ship.position.x);
      ship.rotation = new THREE.Vector3(0, 0, z_rot);
    }
  }

  this.renderer.clear();
  this.renderer.render(this.skybox_scene, this.skybox_camera);
  this.renderer.render(this.scene, this.camera);
  this.renderer.render(generated_scene, this.camera);

  // Draw the boids during an attack.
  this.renderer.render(this.ships_scene, this.camera);
}
