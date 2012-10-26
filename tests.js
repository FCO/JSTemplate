test( "Class Template", function() {
  ok( Template != null, "Class template exists!" );
  var tmpl = new Template("");
  ok( tmpl != null, "Class template can create objects" );
  equal( tmpl.render({}), "", "Template render empty templates" );
  var tmpl2 = new Template("bla");
  equal( tmpl2.render({}), "bla", "Template render not empty templates" );
  var tmpl3 = new Template("bla <% this.ble %>");
  equal( tmpl3.render({ble: "bli"}), "bla ", "Template render not empty templates with code blocks" );
  var tmpl4 = new Template("bla <%= this.ble %>");
  equal( tmpl4.render({ble: "bli"}), "bla bli", "Template render not empty templates with code blocks with an '='" );
  var tmpl5 = new Template("<% for(var i = 0; i < this.array.length; i++){ %><%= this.array[i] %> <%= this.ble + i %> <% } %>");
  equal( tmpl5.render({ble: "blo", array: ["one", "two"]}), "one blo0 two blo1 ", "Template render not empty templates with code blocks with a complex js code" );
});
