#Popcorn.js Dynamic Build Tool (pdbt)#

Automagically create custom builds of Popcorn.js

##Set Up##

1. `git clone --recursive https://github.com/cadecairos/PopcornDynamicBuildTool.git`
2. `cd PopcornDynamicBuildTool`
3. `npm install`

##Running##
1. `node make server`

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
