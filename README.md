#JS Builder#

JS Builder is a Node.js app that returns custom builds of JavaScript projects via HTTP GET Requests. It uses [Uglify-js](https://github.com/mishoo/UglifyJS2) to compress and minify code.

##Set Up##

1. `git clone --recursive https://github.com/cadecairos/JS-Builder.git`
2. `cd JS-Builder`
3. `npm install`

##Customization##

Clone the project you want to serve via JS-Builder into the root of the JS-Builder directory.
Edit the `config.json` file to tell JS-Builder about your project and the files you wish to serve.

Here's a few examples ( note: JSON can not have comments, these are here for info only ):

    {
      // Name/Title of your library
      "library": "Awesome-js",

      // Root folder of the library
      "root": "Awesome-js",

      // You can link to your licence header. It won't be minified and will be added to every build
      // JS-Builder will replace @VERSION with the git commit SHA for the repo you're using.
      "license": "path/to/LICENSE",

      // List your js files under this
      "js": {

        // refer to the main("care") part of your library as core
        "core": {
          "path": "awesome.js"
        },

        // give your other files appropriate names
        "awesomeModule": {
          "path": "foo/bar/awesomeModule.js"
        },

        // You can specify a dependency for a file, ensuring that it's dependency is included
        // before it. Dependencies are only added once, so we don't end up with duplicate includes.
        "awesomePlugin": {
          "depends": "awesomeModule",
          "path": "foo/bar/plugins/awesomePlugin.js"
        },

        // Have a file that needs to come before "core"? Give it a "shim" attribute
        "garbageBrowserShim": {
          "shim": true,
          "path": "foo/shim.js"
        }
      }
    }

##Running##
run `node app.js` from a terminal

By default JS-Builder binds to localhost and port 5000. The port can be changed by setting the PORT environment variable.
It can also be deployed to [Heroku](http://www.heroku.com) with ease (just make sure to edit the `.slugignore` file to suit your needs)

##Use##

JS-Builder listens for requests at `//localhost:5000/build`. When a request is received, the query string will be parsed and used to generate a custom build of your library, which is optionally minified using uglify.js. The "core" file will always be included in a build.

The exact makeup of the query will vary depending on the title you give to each file in your project using `config.json`. Taking the example above, you could get:

`//localhost:5000/build?awesomModule&garbageBrowserShim`

To minify the result, you could simply add a `minify` to the query:

`//localhost:5000/build?awesomModule&garbageBrowserShim&minify`

##JS-Builder UI##

**under development**

Going to the root of the application (`//localhost:5000/`) will serve the sample UI included with JS-Builder. It automatically builds the UI based on `config.json`. The UI allows you to test out your builds.

