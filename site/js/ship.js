var Ship = function () {

  var scope = this;

  THREE.Geometry.call( this );

  v(   0,   0,   0 );
  v( - 5, - 3,   0 );
  v(   8,   0,   0 );
  v( - 5,   3,   0 );
  
  f3( 0, 1, 2 );
  f3( 0, 3, 2 );
  
  this.computeCentroids();
  this.computeFaceNormals();

  function v( x, y, z ) {
    scope.vertices.push( new THREE.Vertex( new THREE.Vector3( x, y, z ) ) );
  }

  function f3( a, b, c ) {
    scope.faces.push( new THREE.Face3( a, b, c ) );
  }

}

Ship.prototype = new THREE.Geometry();
Ship.prototype.constructor = Ship;