'use strict';

var express = require( 'express' ),
    CONFIG = require( 'config' ),
    app = express();

require( './routes' )( app, CONFIG );

var port = process.env.PORT || 5000;
app.listen( port );
console.log( 'HTTP server started on ' + addy.port );
