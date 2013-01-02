#Popcorn.js Dynamic Build Tool (pdbt)#

Automagically returns custom builds of Popcorn.js from HTTP GET Requests.

Caching of requests is now available. This feature uses mongodb to store cached requests.

##Set Up##

1. `git clone --recursive https://github.com/cadecairos/PopcornDynamicBuildTool.git`
2. `cd PopcornDynamicBuildTool`
3. `npm install`
4. [install mongodb](http://www.mongodb.org/display/DOCS/Quickstart)

##Preferences##

Edit the `config/default.json` file to customize the following settings:

####server.bindIP
* IP address to start the server on
* Defaults to `127.0.0.1`

####server.bindPort
* Port number that the server will listen on
* Defaults to `9001`

###server.cleanupInterval
* Time in Milliseconds at which to check the database for expired requests
* Defaults to `86400000` (about 1 day)

###db.host
* Host name or IP where mongodb is running
* Defaults to `mongodb://localhost`

###db.name
* Name of the Database to store the cached requests
* Defaults to `pdbt`

###db.cacheExpiry
* age in Milliseconds that requests expire
* Defaults to `432000000` (about 5 days)

###popcorn.types
* Array of types of Popcorn add ons available to the build tool
* Defaults to `[ "modules", "players", "effects", "parsers", "plugins" ]`

###popcorn.path
* Relative path to the popcorn repository ( provided as a submodule already)
    * *Expects a trailing slash*
* Defaults to `/popcorn-js/`

###responseHeader
* A snippet of code returned on every request
* default is:

    /*! This code was generated automatically using the Popcorn Dynamic Build Tool
     *Get it at www.github.com/cadecairos/PopcornDynamicBuildTool
     *This Source Code Form is subject to the terms of the MIT license
     *If a copy of the MIT license was not distributed with this file, you can
     *obtain one at https://github.com/mozilla/popcorn-js/blob/master/LICENSE */

##Running##
1. `sudo mongod`
2. switch to new teminal
3. `node make server`

##Use##

The build tool listens for requests on a port (this early release listens on port# 9001) for requests. When a request is recieved, the query string will be parsed and used to generate a custom build of popcorn, which is then minified using uglify.js.

Possible query string parameters:

* plugins
* players
* parsers
* modules
* effects
* minified ( if set to anything other than 0, the code will be minified )

> Multiple values for parameters should be separated by commas i.e. `foo=bar,baz`

Requests should be structured like the following:

* `http://localhost:9001/?plugins=footnote,subtitle,twitter`
* `http://localhost:9001/?plugins=footnote,subtitle,twitter&players=youtube`
* `http://localhost:9001/?parsers=parserSSA&plugins=wordriver&effects=applyclass`

Or just about any combination you want.

##Why is this useful?##

Soon, Popcorn users will be able to use the Build tool to generate a script URL like in the examples above. They can then drop that link in their HTML pages and the correct script will be returned every time!

    <html>
      <head>
        <script type="text/javascript" src="http://someurl.org/popcorn-js/?plugins=footnote,subtitle,twitter&players=youtube" ></script>
      </head>
      <!-- rest of html -->
