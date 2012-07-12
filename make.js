require( 'shelljs/make' );

target.update = function() {
  echo( '### Updating submodules' )
  exec( 'git submodule update --init --recursive' );
};

target.server = function() {

  target.update();
  echo( '### Starting Server' );
  exec( 'node app.js' );
};
