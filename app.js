var http = require( 'http' ),
    url = require( 'url' ),
    qs = require( 'querystring' ),
    fs = require( 'fs' ),
    path = require( 'path' ),
    jsp = require( 'uglify-js' ).parser,
    pro = require( 'uglify-js' ).uglify,
    types = [ 'plugins', 'parsers', 'players', 'modules', 'effects' ],
    port = 9001;

function endRequest( res, data ) {
  res.writeHead( 200, { 'Content-Type': 'text/javascript' } );
  res.end( data );
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

  var js = fs.readFileSync( __dirname + '/popcorn-js/popcorn.js', 'UTF-8' );

  types.forEach(function( type ) {
    var oneType = elems[ type ],
        data,
        pathName,
        i;

    if ( oneType ) {
      for ( i = oneType.length - 1; i >= 0; i-- ) {
        
        pathName = __dirname + '/popcorn-js/' + type + '/' + oneType[i] + '/popcorn.' + oneType[i] + '.js';
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

var server = http.createServer(function(req, res) {

  var requestUrl = parseUrl( req.url ),
      parsedQuery = parseQuery( requestUrl.query );
      responseJS = getResponse( parsedQuery );

  endRequest( res, uglifyIt( responseJS ) );

});

server.listen( port );

console.log( 'server running at http://localhost:9001/' );