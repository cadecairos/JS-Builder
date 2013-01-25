(function() {

  function requestHandler(e) {
      if (e.target.readyState === 4) {
          document.querySelector( "div#output textarea" ).innerHTML = e.target.responseText;
      }
  }

  document.addEventListener( "DOMContentLoaded", function() {
    var checkboxes = document.querySelectorAll( "li > label > input:not([value='minify'])" ),
        minified = document.querySelector( "input[value='minify']" ),
        makeButton = document.querySelector( "button.btn" ),
        output = document.querySelector( "input[type=text]" );

    makeButton.onclick = function generateURL() {
      var link = location.protocol + "//" + location.host + "/build?",
          oneType,
          i;

      for( i = 0, l = checkboxes.length; i < l; i++ ) {
        if ( checkboxes[ i ].checked ) {
          link += checkboxes[ i ].value + "&";
        }
      }

      if ( minified.checked ) {
        link += minified.value;
      } else {
        link = link.substring( 0, link.length - 1 );
      }

      output.value = link;

      var req = new XMLHttpRequest();
      req.onreadystatechange = requestHandler;
       req.open("GET", link, true);
      req.setRequestHeader("Accept", "*/*");
      req.send();

    }
  });
}());
