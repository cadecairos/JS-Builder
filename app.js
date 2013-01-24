'use strict';

var express = require( 'express' ),
    CONFIG = require( './config.json' ),
    app = express();

app.use( express.logger() );
app.use( express.static( __dirname + '/public' ) );

require( './routes' )( app, CONFIG );

var port = process.env.PORT || 5000;
app.listen( port );
console.log( 'HTTP server started on ' + port );
