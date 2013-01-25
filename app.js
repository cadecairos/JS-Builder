'use strict';

var express = require( 'express' ),
    minify = require( 'uglify-js' ).minify,
    conf = require( './config.json' ),
    fs = require( 'fs' ),
    app = express(),
    rootJSPath = __dirname + '/' + conf.root + '/',
    coreJS = fs.readFileSync( rootJSPath + conf.js.core.path ),
    licenceString = fs.readFileSync( './buildLicense' );

app.use( express.logger() );
app.use( express.static( __dirname + '/public' ) );


function getResponse( query ) {
  var configItem,
      js = coreJS,
      loadedDeps = {},
      minifyCode = false;

  function getItem( js ) {
    var depends = js.depends;

    if ( depends && !query[ depends ] && !loadedDeps[ depends ] ) {
      loadedDeps[ depends ] = '';
      return getItem( conf.js[ depends ] ) + fs.readFileSync( rootJSPath + js.path );
    }

    return fs.readFileSync( rootJSPath + js.path );
  }

  try {

    for( var item in query ) {
      configItem = conf.js[ item ];
      if ( configItem ) {
        if (  !loadedDeps[ item ] ) {
          if ( configItem.shim ) {
            js = getItem( configItem ) + js;
          } else {
            js += getItem( configItem );
          }
        }
      } else if ( item === 'minify' ) {
        minifyCode = true;
      }
    }

    if ( minifyCode ) {
      return licenceString + minify( js, {
        fromString: true
      }).code;
    }

    return licenceString + js;
  } catch( e ) {
    return null;
  }
}

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

var port = process.env.PORT || 5000;
app.listen( port );
console.log( 'HTTP server started on ' + port );
