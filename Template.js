function Template(code) {
	this._templates = {};
	if(code != null){
		this.setTemplate(code);
		this.compileTemplate();
	}
	this.helpers = {};
}

Template.__loaded__ = {};

Template.loadTemplate		=	function(url) {
	if(Template.__loaded__[url] == null) {
		var data = Template.__download_template__(url);
		Template.__loaded__[url] = new Template(data);
	}
	return Template.__loaded__[url];
};
Template.__download_template__	=	function(url) {
	var content = null;
	var AJAX = new XMLHttpRequest();
	if (AJAX) {
		AJAX.open("GET", url, false);                             
		AJAX.send(null);
		content = AJAX.responseText;                                         
	}
	return content;
};

Template.prototype = {
	_templates: 		null,
	addHelper:		function(name, func) {
		var _this = this;
		if(this[name] != null)
			throw "Helper or method exists.";
		this[name] = function(){return func.apply(_this, arguments)};
	},
	render:			function(data) {
		return this.__function__.call(this, data);
	},
	setTemplate:		function(template) {
		this.code = template;
	},
	compileTemplate:	function() {
		this.code = this.code.replace(/\n/g, "\\n");
		this.code = this.code.replace(/^\s+|\s+$/g, "");
		var splitted = this.code.split(/<%\s*|\s*%>/);
		var template_hashes = [];
		while(splitted.length > 0) {
			var data = splitted.shift();
			var code = splitted.shift();
			template_hashes.push({code: code, data: data});
		}
		var func;
		var compiled_template = "var ret = '';\n";
		for(var i = 0; i < template_hashes.length; i++) {
			if(template_hashes[i].data != null)
				compiled_template += "ret += '" + template_hashes[i].data + "';\n";
			if(/^\s*=\s*/.test(template_hashes[i].code)) {
				compiled_template += "ret += ";
				template_hashes[i].code = template_hashes[i].code.replace(/^\s*=\s*/, "");
			}
			compiled_template += template_hashes[i].code + ";\n";
		}
		compiled_template += "return ret;\n";
		this.__function__ =  new Function("data", compiled_template);
	},
	loadTemplate: function(url){
		return Template.loadTemplate(url);
	},
};
