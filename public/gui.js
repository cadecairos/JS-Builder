(function() {

  function requestHandler(e) {
      if (e.target.readyState === 4) {
          document.querySelector( "div#output textarea" ).innerHTML = e.target.responseText;
      }
  }

  document.addEventListener( "DOMContentLoaded", function() {
    var checkboxes = {
          plugins: document.querySelectorAll( "ul#plugin-list input[type=checkbox]" ),
          players: document.querySelectorAll( "ul#player-list input[type=checkbox]" ),
          modules: document.querySelectorAll( "ul#module-list input[type=checkbox]" ),
          parsers: document.querySelectorAll( "ul#parser-list input[type=checkbox]" ),
          effects: document.querySelectorAll( "ul#effect-list input[type=checkbox]" )
        },
        minified = document.querySelector( "ul li input[value='minified=0']" ),
        makeButton = document.querySelector( "input[type=button][value='get URL']" ),
        output = document.querySelector( "div#output input[type=textbox]" );

    makeButton.onclick = function generateURL() {
      var link = location.protocol + "//" + location.host + "/build?",
          type,
          oneType,
          linkpart = "",
          i;

      for( type in checkboxes ) {
        if ( checkboxes.hasOwnProperty( type ) ) {
          oneType = checkboxes[ type ];
          for ( i = oneType.length - 1; i >= 0; i--) {
            if ( oneType[ i ].checked ) {
              linkpart += oneType[ i ].value + ",";
            }
          }
          if ( linkpart ) {
            linkpart = linkpart.substring( 0, linkpart.length - 1 );
            link += type + "=" + linkpart + "&";
            linkpart = "";
          }
        }
      }

      if ( minified.checked ) {
        link += minified.value;
      };

      output.value = link;

      var req = new XMLHttpRequest();
      req.onreadystatechange = requestHandler;
      console.log( link );
      req.open("GET", link, true);
      req.setRequestHeader("Accept", "*/*");
      req.send();

    }

    var pluginsToggleAll = document.querySelector( "input#plugins-toggle-all" ),
        playersToggleAll = document.querySelector( "input#players-toggle-all" ),
        modulesToggleAll = document.querySelector( "input#modules-toggle-all" ),
        parsersToggleAll = document.querySelector( "input#parsers-toggle-all" ),
        toggler = function( e ) {

          var type = checkboxes[ e.target.value ],
              toggle = e.target.checked;

          for ( var i = type.length - 1; i >= 0; i-- ) {
            type[ i ].checked = toggle;
          };
        };

    pluginsToggleAll.onchange = playersToggleAll.onchange = modulesToggleAll.onchange = parsersToggleAll.onchange = toggler;
  });
}());
