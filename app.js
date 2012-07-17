/*! This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.github.com/cadecairos/PopcornDynamicBuildTool/blob/master/LICENSE */

var http = require( 'http' ),
    url = require( 'url' ),
    qs = require( 'querystring' ),
    fs = require( 'fs' ),
    path = require( 'path' ),
    conf = require( 'config' ),
    jsp = require( 'uglify-js' ).parser,
    pro = require( 'uglify-js' ).uglify,
    equal = require( 'deep-equal' ),
    exec = require( 'child_process' ).exec,
    types = conf.popcorn.types,
    popcornPath = __dirname + conf.popcorn.path,
    host = conf.server.bindIP,
    port = conf.server.bindPort,
    errorMsg = 'There was an error building your script, check your query\'s syntax.\n',
    popcornSHA;

function updateSHA( cb ) {
  exec( 'git show -s --pretty=format:%H', cb );
}

updateSHA(function( err, stdout, stderr ) {
  popcornSHA = stdout;
});

function endRequest( res, data ) {
  if ( data ) {
    res.writeHead( 200, {
      'Content-Type': 'text/javascript',
      'Content-Length': data.length,
      'Access-Control-Allow-Origin': "*",
      'Access-Control-Allow-Methods': "GET"
    });
    res.end( data, 'UTF-8' );
  } else {

    res.writeHead( 400, {
      'Content-Type': 'text/plain',
      'Content-Length': errorMsg.length
    });
    res.end( errorMsg );
  }
}

function parseUrl( aUrl ) {
    return parsed = url.parse( aUrl );
}

function parseQuery( query ){
  var parsed = qs.parse( query );

  types.forEach(function( type ) {

    if ( parsed[ type ] ) {

      parsed[ type ] = parsed[ type ].split( ',' );
    }
  })
  return parsed;
}

function uglifyIt( code ) {
  var ast = jsp.parse( code );
  ast = pro.ast_mangle( ast );
  asd = pro.ast_squeeze( ast );
  return pro.gen_code( ast );
}

function getResponse( elems ) {

  var js = fs.readFileSync( popcornPath +  'popcorn.js', 'UTF-8' );

  types.forEach(function( type ) {
    var oneType = elems[ type ],
        data,
        pathName,
        i;

    if ( oneType ) {
      for ( i = oneType.length - 1; i >= 0; i-- ) {

        pathName = popcornPath + type + '/' + oneType[i] + '/popcorn.' + oneType[i] + '.js';
        if ( path.existsSync( pathName ) ) {

          data = fs.readFileSync( pathName, 'UTF-8' );

          if ( data ) {

            js += data;
          }
        }
      };
    }
  });
  return js;
}

// cache related stuff
var requestCache = (function() {

  var cachedRequests = [];

  compareRequests = function( a, b ) {

    if ( a.sha !== popcornSHA ) {
      return false;
    }

    if( !equal( a.request, b ) ) {
      return false;
    }

    return true;
  };

  return {
    add: function( requestObj, code ) {

      newEntry = {
        'sha': popcornSHA,
        'request': requestObj,
        'code': code,
        'timestamp': Date.now()
      };

      cachedRequests.push( newEntry );
    },
    isCached: function( requestObj ) {
      var req;
      for ( var i = cachedRequests.length - 1; i >= 0; i-- ) {
        req  = cachedRequests [ i ];
        if ( compareRequests( req, requestObj ) ) {
          return req.code;
        };
      };
    },
    cleanUp: function() {
      console.log( 'cleaning up, updating popcorn SHA' );
      updateSHA(function ( err, stdout, stdin ) {
        popcornSHA = stdout;
        var now = Date.now();
        for ( var i = cachedRequests.length - 1; i >= 0; i-- ) {
          var req = cachedRequests[i];
          if ( ( ( now - req.timestamp ) > conf.server.cacheExpiry ) || req.sha !== popcornSHA ) {
            console.log( 'removing entry' );
            cachedRequests = cachedRequests.slice( i, i + 1 );
          };
        };
      });
    }
  };
})();

var server = http.createServer(function(req, res) {

  var requestUrl,
      parsedQuery,
      responseJS;

  // Parse the request URL
  requestUrl = parseUrl( req.url );

  // Parse the query string into an object
  parsedQuery = requestUrl && parseQuery( requestUrl.query );

  // Build the response Javascript
  if ( parsedQuery ) {

    // check if cached
    responseJS = requestCache.isCached( parsedQuery );

    if ( !responseJS ) {

      // was not cached
      responseJS = getResponse( parsedQuery );

      if ( responseJS ) {

        // app will minify code by default, but can also return unminified
        // if 'minified=0' is in the query string
        if ( !parsedQuery[ 'minified' ] || parsedQuery[ 'minified' ] !== "0" ) {

          responseJS = uglifyIt( responseJS );
        }

        // prepend the header
        responseJS = conf.responseHeader + responseJS;

        // add to cache
        requestCache.add( parsedQuery, responseJS );
      };
    };
  }

  // Send a response to the requestee
  endRequest( res, responseJS );

});

setInterval( requestCache.cleanUp, conf.server.cleanupInterval );

server.listen( port, host );

console.log( 'server running at ' + host + ':' + port );
console.log( 'cleanup is scheduled to run every ' + conf.server.cleanupInterval + ' milliseconds' );
console.log( 'cache entries expire after ' + conf.server.cacheExpiry + ' milliseconds' );
