/*! This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.github.com/cadecairos/PopcornDynamicBuildTool/blob/master/LICENSE */

var http = require( 'http' ),
    mongoose = require( 'mongoose' ),
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
    Schema = mongoose.Schema,
    canCacheRequests = true,
    popcornSHA,

    db = mongoose.connect( conf.db.host + conf.db.databaseName, function( error ) { 
      if ( error ) {
        console.error( 'MongoDB: ' + error + '\n Request caching will not work' );
        canCacheRequests = false;
      }
    }),

    CachedRequest = new Schema({
      'sha': String,
      'minified': String,
      'plugins': [String],
      'players': [String],
      'parsers': [String],
      'modules': [String],
      'effects': [String],
      'code': String,
      'timestamp': Number
    }),

    CachedRequestModel = mongoose.model( 'CachedRequest', CachedRequest );

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

  // app will minify code by default, but can also return unminified
  // if 'minified=0' is in the query string
  if ( !elems[ 'minified' ] || elems[ 'minified' ] !== "0" ) {

    js = uglifyIt( js );
  }

  // prepend the header
  js = conf.responseHeader + js;

  return js;
}

function cleanUp() {
  console.log( 'cleaning up, updating popcorn SHA' );
  updateSHA(function ( err, stdout, stdin ) {
    popcornSHA = stdout;
    if ( canCacheRequests ) {
      CachedRequestModel.where( 'timestamp' ).lt( Date.now() - conf.db.cacheExpiry ).find().remove(function( err, num ) {
        if ( err ) {
          console.error( 'There was an error deleteing cached requests: ' + err );
        }
        console.log( "Cleaned up " + num + "expired entries" );
      });
    }
  });
}

var server = http.createServer(function(req, res) {

  var requestUrl,
      parsedQuery,
      responseJS,
      mongoQuery;

  // Parse the request URL
  requestUrl = parseUrl( req.url );

  // Parse the query string into an object
  parsedQuery = requestUrl && parseQuery( requestUrl.query );

  // Build the response Javascript
  if ( !parsedQuery ) {
    return
  }

  mongoQuery = {
    'minified': parsedQuery.minified || '',
    'plugins': parsedQuery.plugins || [],
    'parsers': parsedQuery.parsers || [],
    'players': parsedQuery.players || [],
    'modules': parsedQuery.modules || [],
    'effects': parsedQuery.effects || []
  };

  if ( canCacheRequests ) {;
    // check if cached
    CachedRequestModel.findOne( mongoQuery, function( err, doc ) {
      if ( err === null && doc === null ) {
        // was not cached
        responseJS = getResponse( parsedQuery );

        mongoQuery.sha = popcornSHA;
        mongoQuery.code = responseJS;
        mongoQuery.timestamp = Date.now();

        doc = new CachedRequestModel( mongoQuery );

        doc.save( function( err ) {

          if ( err ) {
            console.error( err );
          }
        });

        endRequest( res, responseJS );
        return;
      }

      if ( err ) {
        console.log( err );
        return;
      };

      // Send a response to the requestee
      endRequest( res, doc.code );

    });
  } else {

    responseJS = getResponse( parsedQuery );
    endRequest( res, responseJS );
  }
});

setInterval( cleanUp, conf.server.cleanupInterval );

server.listen( port, host );

console.log( 'server running at ' + host + ':' + port );
console.log( 'cleanup is scheduled to run every ' + conf.server.cleanupInterval + ' milliseconds' );
console.log( 'cache entries expire after ' + conf.db.cacheExpiry + ' milliseconds' );
