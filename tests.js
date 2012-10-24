test( "Class Template", function() {
  ok( Template != null, "Class template exists!" );
  var tmpl = new Template("");
  ok( tmpl.constructor == Template, "Class template objcts of that class" );
});
