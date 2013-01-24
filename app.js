'use strict';

var express = require( 'express' ),
    fs = require( 'fs' ),
    CONFIG = require( 'config' ),
    rc = require( './lib/cache' ),
    uglify = require( './lib/uglify' )(),
    app = express();

require( './routes' )( app, rc, uglify, CONFIG );

var port = process.env.PORT || CONFIG.server.bindPort;

var server = app.listen( port, function() {
  var addy = server.address();
  console.log( 'HTTP server started on http://' + CONFIG.server.bindIP + ':' + addy.port );
});