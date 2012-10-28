test( "Class Template", function() {
	ok( Template != null, "Class template exists!" );
	var tmpl = new Template("");
	ok( tmpl != null, "Class template can create objects" );
	equal( tmpl.render({}), "", "Template render empty templates" );
});
test( "Template", function() {
	var tmpl1 = new Template("bla");
	equal( tmpl1.render({}), "bla", "Template render not empty templates" );
	var tmpl2 = new Template("bla <% data.ble %>");
	equal( tmpl2.render({ble: "bli"}), "bla ", "Template render not empty templates with code blocks" );
	var tmpl3 = new Template("bla <%= data.ble %>");
	equal( tmpl3.render({ble: "bli"}), "bla bli", "Template render not empty templates with code blocks with an '='" );
	var tmpl4 = new Template("<% for(var i = 0; i < data.array.length; i++){ %><%= data.array[i] %> <%= data.ble + i %> <% } %>");
	equal( tmpl4.render({ble: "blo", array: ["one", "two"]}), "one blo0 two blo1 ", "Template render not empty templates with code blocks with a complex js code" );
});
test( "Template Helper Engine", function() {
	var tmpl1 = new Template("<%= this.test() %>");
	tmpl1.addHelper("test", function(){ok(true, "Helper running inside the template"); return "my test"});
	equal( tmpl1.render({}), "my test", "Using the return of the worker" );
	var tmpl2 = new Template("str: <%= this.test('test string') %>");
	tmpl2.addHelper("test", function(str){equal(str, "test string", "Helper running inside the template and receiving parameters"); return str});
	equal( tmpl2.render({}), "str: test string", "Using the return of the worker" );
	throws(function(){tmpl2.addHelper("test", function(str){})}, "Helper or method exists.", "Throws a error if helper exists");
});
test( "loadTemplate() Helper", function() {
	var tmpl1 = new Template("[[<%= this.loadTemplate('./test.tmpl').render({var1: 'value1'}) %>]]");
	equal( tmpl1.render({}), "[[value1\n]]", "Using the return of the worker" );
});
