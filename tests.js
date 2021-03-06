test( "Class Template", function() {
	ok( Template != null, "Class template exists!" );
	var tmpl = new Template("");
	ok( tmpl != null, "Class template can create objects" );
	equal( tmpl.render({}), "", "Template render empty templates" );
});
test( "Template", function() {
	var tmpl1 = new Template("bla");
	equal( tmpl1.render({}), "bla", "Template render not empty templates" );
	var tmpl2 = new Template("bla <% ble; %>");
	equal( tmpl2.render({ble: "bli"}), "bla ", "Template render not empty templates with code blocks" );
	var tmpl3 = new Template("bla <%= ble %>");
	equal( tmpl3.render({ble: "bli"}), "bla bli", "Template render not empty templates with code blocks with an '='" );
	var tmpl4 = new Template("<% for(var i = 0; i < array.length; i++){ %><%= array[i] %> <%= ble + i %> <% } %>");
	equal( tmpl4.render({ble: "blo", array: ["one", "two"]}), "one blo0 two blo1 ", "Template render not empty templates with code blocks with a complex js code" );
	if(navigator.vendor != "Google Inc.") {
		var tmpl1 = new Template("<%= var1 %> - <%= var2 %>");
		equal( tmpl1.render("GET test.json"), "value1 - value2", "Using URL as data" );
		var tmpl2 = new Template("<%= var1 %> - <%= var2 %>");
		equal( tmpl2.render("test.json"), "value1 - value2", "Using URL as data" );
	} else ok(true, "Skiping, its chrome!");
	var tmpl5 = Template.loadTemplate("test_script");
	equal(tmpl5.render({var1: 'value1', var2: 'value2'}), "value1 - value2", "Using 'on html' template");
	equal(Template.renderTemplate("test_script", {var1: 'value1', var2: 'value2'}), "value1 - value2", "Using 'on html' template with renderTemplate()");
	Template.stash.var1 = "value1 from stash";
	Template.stash.var2 = "value2 from stash";
	equal(Template.renderTemplate("<%= this.stash.var1 %> - <%= this.stash.var2 %>", {}), "value1 from stash - value2 from stash", "Testing stash, acessing stash from template");
	equal(Template.renderTemplate("<%= var1 %> - <%= var2 %>", {}), "value1 from stash - value2 from stash", "Testing stash, acessing stash as data from template");
	equal(Template.renderTemplate("<%= var1 %> - <%= var2 %>", {var1: "value1 from data"}), "value1 from data - value2 from stash", "Testing stash, acessing stash as data from template, and overwriting a value with data");
	Template.renderOn("<%= var1 %> - <%= var2 %>", {var1: 'value1', var2: 'value2'}, "render_on");
	equal(document.getElementById("render_on").innerHTML, "value1 - value2", "Using renderOn().");
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
test( "Tag types", function() {
	var tmpl1 = new Template("<%= var_with_spaces  =%>");
	equal( tmpl1.render({var_with_spaces: "      lots of spaces    "}), "lots of spaces", "Using the trimable tag" );
});
test( "loadTemplate() Helper", function() {
	if(navigator.vendor != "Google Inc.") {
		var tmpl1 = new Template("[[<%= this.loadTemplate('./test.tmpl').render({var1: 'value1'}) %>]]");
		equal( tmpl1.render({}), "[[value1\n]]", "Using the return of the helper" );
	} else ok(true, "Skiping, its chrome!");
});
test( "browser() Helper", function() {
	var tmpl1 = new Template("<% if(this.browser.msie || this.browser.webkit || this.browser.gecko || this.browser.opera) { %>detected<% } else { %>I dont know who you are<% } %>");
	if(tmpl1.is_browser_detect_load) {
		equal( tmpl1.render({}), "detected", "Browser detected the browser" );
	} else {
		equal( tmpl1.render({}), "I dont know who you are", "Browser detected the browser" );
	}
});
asyncTest( "browser() Helper - asyncTest", function() {
	var script = document.createElement("script");
	script.src = "bowser/bowser.min.js";
	script.onload = function(){
		var tmpl1 = new Template("<% if(this.browser.msie || this.browser.webkit || this.browser.gecko || this.browser.opera) { %>detected<% } else { %>I dont know who you are<% } %>");
		equal( tmpl1.render({}), "detected", "Browser detected the browser" );
		start();
	};
	document.body.appendChild(script);
});
test( "dataGetter Class", function() {
	var dg1 = DataGetter.preconfigured("TEST01", function(){return "lalala"});
	equal(dg1.constructor, DataGetter, "preconfigured returns a DataGetter object.")
	var dg2 = DataGetter.preconfigured("TEST01");
	deepEqual(dg1, dg2, "Objs are equivalents");
});
test( "dataGetter Cache", function() {
	var counter = 0;
	var dg1 = DataGetter.preconfigured("TEST02", function(){counter++; return {stat: "ok"}});
	deepEqual(dg1.get(), {stat: "ok"});
	equal(counter, 1, "Objs are equivalents");
	dg1.cached().get();
	equal(counter, 1, "Objs are equivalents");
	dg1.notCached().get();
	equal(counter, 2, "Objs are equivalents");
	dg1.cached().get();
	equal(counter, 2, "Objs are equivalents");
});
