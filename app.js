'use strict';

var express = require( 'express' ),
    morgan = require( 'morgan' ),
    serveStatic = require( 'serve-static' ),
    minify = require( 'uglify-js' ).minify,
    conf = require( './config.json' ),
    fs = require( 'fs' ),
    exec = require( 'child_process' ).exec,
    app = express(),
    rootJSPath = __dirname + '/' + conf.root + '/',
    coreJS = fs.readFileSync( rootJSPath + conf.js.core.path, 'utf8' ),
    repoLicense = conf.license ? fs.readFileSync( rootJSPath + conf.license, 'utf8' ) : '',
    fileArray = [];

require( 'pug' );

app.use( morgan( 'combined' ) );
app.use( serveStatic( __dirname + '/public' ) );

for ( var item in conf.js ) {
  if ( item !== 'core' ) {
    fileArray.push( item );
  }
}

exec( 'cd ' + conf.root + '; git show -s --pretty=format:%h', function( err, stdout, stderr ) {
  if ( err ) {
    repoLicense = repoLicense.replace( '@VERSION', Date.now() );
    return;
  }
  repoLicense = repoLicense.replace( '@VERSION', stdout.replace( "\W$", "" ) );
});

function getResponse( query ) {
  var configItem,
      js = coreJS,
      loadedDeps = {},
      minifyCode = false;

  function getItem( js ) {
    var depends = js.depends;

    if ( depends && !query[ depends ] && !loadedDeps[ depends ] ) {
      loadedDeps[ depends ] = '';
      return getItem( conf.js[ depends ] ) + fs.readFileSync( rootJSPath + js.path, 'utf8' );
    }

    return fs.readFileSync( rootJSPath + js.path, 'utf8' );
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

app.get( '/', function( req, res ) {
  res.render( 'index.pug', {
    library: conf.library,
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

var port = process.env.PORT || 5000;
app.listen( port );
console.log( 'HTTP server started on ' + port );
