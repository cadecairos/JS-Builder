'use strict';

var uglify = require( 'uglify-js' );

module.exports = function uglifyjs() {
  return {
    jsp: uglify.parser,
    pro: uglify.uglify
  }
};