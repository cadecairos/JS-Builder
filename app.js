'use strict';

if ( process.env.NEW_RELIC_NO_CONFIG_FILE && process.env.NEW_RELIC_LICENSE_KEY ) {
  require( 'newrelic' );
}

var express = require( 'express' ),
    minify = require( 'uglify-js' ).minify,
    conf = require( process.env.CONFIG_FILE || './config.json' ),
    fs = require( 'fs' ),
    exec = require( 'child_process' ).exec,
    app = express(),
    fileArray = [],
    jsPath,
    coreJS,
    repoLicense;

require( 'jade' );

function getItem( loadedDeps, query, js ) {
  var depends = js.depends;

  if ( depends && !query[ depends ] && !loadedDeps[ depends ] ) {
    loadedDeps[ depends ] = '';
    return getItem( loadedDeps, query, conf.files[ depends ] ) + fs.readFileSync( jsPath + js.path, 'utf8' );
  }

  return fs.readFileSync( jsPath + js.path, 'utf8' );
}

function getResponse( query ) {
  var configItem,
      js = coreJS,
      loadedDeps = {},
      minifyCode = false;

  try {
    for( var item in query ) {
      configItem = conf.files[ item ];
      if ( configItem ) {
        if (  !loadedDeps[ item ] ) {
          if ( configItem.shim ) {
            js = getItem( loadedDeps, query, configItem ) + js;
          } else {
            js += getItem( loadedDeps, query, configItem );
          }
        }
      } else if ( item === 'minify' ) {
        minifyCode = true;
      }
    }

    if ( minifyCode ) {
      var p = minify( js, {fromString:true});
      return  repoLicense + minify( js, {
        fromString: true
      }).code;
    }

    return  repoLicense + js;
  } catch( e ) {
    return null;
  }
}

function ready() {

  app.get( '/', function( req, res ) {
    res.render( 'index.jade', {
      library: conf.name,
      files: fileArray
    });
  });

  app.get( '/build', function( req, res ) {

    var responseJS = getResponse( req.query );
    if ( !responseJS ) {
      res.status( 500 );
      res.set({
        'Content-Type': 'text/plain',
        'Content-Length': 5
      });
      res.send( "Error" );
    } else {
      res.status( 200 );
      res.set({
        'Content-Type': 'text/javascript',
        'Content-Length': responseJS.length,
        'Access-Control-Allow-Origin': "*",
        'Access-Control-Allow-Methods': "GET"
      });
      res.send( responseJS );
    }
  });

  app.use( express.logger() );
  app.use( express.static( __dirname + '/public' ) );

  var port = process.env.PORT || 5000;
  app.listen( port );
  console.log( 'HTTP server started on ' + port );
}

function cloneRepo() {
  console.log( 'Cloning ' + conf.repo + ' into ' + __dirname + '/repo' );
  exec( 'git clone -q --recursive ' + conf.repo + ' repo', function( err ) {
    if ( err ) {
      console.error( "failed to clone repository" );
      return;
    }
    setup();
  });
}

function setup() {

  // Get path path to repo
  jsPath = __dirname + '/repo/';
  coreJS = fs.readFileSync( jsPath + conf.files.core.path, 'utf8' );
  repoLicense = conf.licenseFile ? fs.readFileSync( jsPath + conf.licenseFile, 'utf8' ) : '';

  for ( var item in conf.files ) {
    if ( conf.files.hasOwnProperty( item ) ) {
      if ( item !== 'core' ) {
        fileArray.push( item );
      }
    }
  }

  // replace @VERSION flag
  exec( 'cd ./repo; git show -s --pretty=format:%h', function( err, stdout, stderr ) {
    var version;

    if ( err ) {
      repoLicense = repoLicense.replace( '@VERSION', Date.now() );
      coreJS = coreJS.replace( '@VERSION', Date.now() );
    } else {
      version = stdout.replace( '\W$', '' );
      repoLicense = repoLicense.replace( '@VERSION', version );
      coreJS = coreJS.replace( '@VERSION', version );
    }
    ready();
  });
}

fs.exists( './repo', function( exists ) {
  if ( exists ) {
   setup()
  } else {
    cloneRepo();
  }
})