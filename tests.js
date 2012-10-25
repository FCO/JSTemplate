test( "Class Template", function() {
  ok( Template != null, "Class template exists!" );
  var tmpl = new Template("");
  ok( tmpl != null, "Class template can create objects" );
  ok( tmpl.render({}) == "", "Template render empty templates" );
  var tmpl2 = new Template("bla");
  ok( tmpl2.render({}) == "bla", "Template render empty templates" );
  var tmpl3 = new Template("bla <% this.ble %>");
  ok( tmpl3.render({ble: "bli"}) == "bla ", "Template render empty templates" );
  var tmpl4 = new Template("bla <%= this.ble %>");
  ok( tmpl4.render({ble: "bli"}) == "bla bli", "Template render empty templates" );
  var tmpl5 = new Template("<% for(var i = 0; i < this.array.length; i++){ %><%= this.array[i] %> <%= this.ble + i %> <% } %>");
  ok( tmpl5.render({ble: "blo", array: ["one", "two"]}) == "one blo0 two blo1 ", "Template render empty templates" );
});
