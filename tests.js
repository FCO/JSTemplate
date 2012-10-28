test( "Class Template", function() {
	ok( Template != null, "Class template exists!" );
	var tmpl = new Template("");
	ok( tmpl != null, "Class template can create objects" );
	equal( tmpl.render({}), "", "Template render empty templates" );
});
test( "Template", function() {
	var tmpl2 = new Template("bla");
	equal( tmpl2.render({}), "bla", "Template render not empty templates" );
	var tmpl3 = new Template("bla <% data.ble %>");
	equal( tmpl3.render({ble: "bli"}), "bla ", "Template render not empty templates with code blocks" );
	var tmpl4 = new Template("bla <%= data.ble %>");
	equal( tmpl4.render({ble: "bli"}), "bla bli", "Template render not empty templates with code blocks with an '='" );
	var tmpl5 = new Template("<% for(var i = 0; i < data.array.length; i++){ %><%= data.array[i] %> <%= data.ble + i %> <% } %>");
	equal( tmpl5.render({ble: "blo", array: ["one", "two"]}), "one blo0 two blo1 ", "Template render not empty templates with code blocks with a complex js code" );
});
test( "Template Helpers", function() {
	var tmpl6 = new Template("<%= this.helpers.test() %>");
	tmpl6.addHelper("test", function(){ok(true, "Helper running inside the template"); return "my test"});
	equal( tmpl6.render({}), "my test", "Using the return of the worker" );
	var tmpl7 = new Template("str: <%= this.helpers.test('test string') %>");
	tmpl7.addHelper("test", function(str){equal(str, "test string", "Helper running inside the template and receiving parameters"); return str});
	equal( tmpl7.render({}), "str: test string", "Using the return of the worker" );
});
