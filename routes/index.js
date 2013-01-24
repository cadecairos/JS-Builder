'use strict'

var fs = require( 'fs' ),
    minify = require( 'uglify-js' ).minify;

module.exports = function routes( app, CONFIG ) {

  var jsPath = CONFIG.javascript.path,
      core = CONFIG.javascript.core,
      dirs = CONFIG.javascript.dirs,
      prefix = CONFIG.javascript.prefix,
      ast,
      err;

  function parseQuery( query ){

    dirs.forEach(function( dir ) {

      if ( query[ dir ] ) {

        query[ dir ] = query[ dir ].split( ',' );
      }
    })
    return query;
  }

  function getResponse( query ) {

    var js;

    try {
      js = fs.readFileSync( jsPath + core, 'UTF-8' );

      dirs.forEach(function( dir ) {
        var currentDir = query[ dir ],
            data,
            pathName,
            i;

        if ( currentDir ) {
          for ( i = currentDir.length - 1; i >= 0; i-- ) {

            pathName = jsPath + dir + '/' + currentDir[ i ] + '/';
            if ( prefix ) {
              pathName += prefix + '.';
            }
            pathName += currentDir[ i ] + '.js';
            if ( fs.existsSync( pathName ) ) {

              data = fs.readFileSync( pathName, 'UTF-8' );

              if ( data ) {

                js += data;
              }
            }
          };
        }
      });

      // app will minify code by default, but can also return unminified
      // if 'minified=0' is in the query string
      if ( !query[ 'minified' ] || query[ 'minified' ] !== "0" ) {
        js = minify( js, {
          fromString: true
        }).code;
      }

      // prepend the header
      js = CONFIG.responseHeader + js;
      return js;
    } catch( e ) {
      err = e.toString();
      return null;
    }
  }

  app.get( '/build', function( req, res ) {
    var parsedQuery = parseQuery( req.query ),
        responseJS = getResponse( parsedQuery );

    if ( !responseJS ) {
      res.status( 500 );
      res.set({
        'Content-Type': 'text/plain',
        'Content-Length': err.length
      });
      res.send( err );
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
};
