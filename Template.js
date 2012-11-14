function Template(code) {
	this._templates = {};
	if(code != null){
		this.setTemplate(code);
		this.compileTemplate();
	}
	this.helpers = {};
	if(window.bowser != null) {
		this.browser = bowser;
		this.is_browser_detect_load = true;
	}
}

Template.__loaded__ = {};
Template.stash = {};

Template.extract_form	=	function(form) {
	var elements = form.elements;
	var query = [];
	for(var i = 0; i < elements.length; i++) {
		if(!elements[i].name) break;
		if((elements[i].type == 'radio' || elements[i].type == 'checkbox') && !elements[i].checked) break;
		query.push(elements[i].name + "=" + elements[i].value);
	}
	return query.join("&");
};

Template.renderOn	=	function(template, data, elementId) {
	var data2ajax;
	if(data.constructor == Array) {
		data2ajax = data.pop();
		data = data.pop();
	}
	var what2do = "REPLACE";
	var match;
	if(match = elementId.match(/^(?:(APPEND|PREPEND|REPLACE)\s+)(.+)$/)) {
		if(match[1] != null) {
			what2do = match[1];
			elementId = match[2];
		}
	}
	
	var answer = Template.renderTemplate(template, data, data2ajax);
	var container = document.createElement("div");
	container.innerHTML = answer;
	var elementObj = document.getElementById(elementId);
	switch(what2do) {
		case "REPLACE":
			elementObj.innerHTML = container.innerHTML;
		break;
		case "APPEND":
			var childs = container.childNodes;
			for(var i = 0; i < childs.length; i++)
				elementObj.appendChild(childs[i]);
		break;
		case "PREPEND":
			var childs = container.childNodes;
			for(var i = childs.length - 1; i >= 0; i--)
				elementObj.prependChild(childs[i]);
		break;
	}
}
Template.renderTemplate	=	function(templateName, data, data2ajax) {
	return Template.loadTemplate(templateName).render(data, data2ajax);
};

Template.loadTemplate	=	function(url) {
	if(Template.__loaded__[url] == null) {
		var data;
		if(element = document.getElementById(url)) {
			data = element.innerHTML;
		} else if(/^((GET|POST|PUT|DELETE)\s+)?[\w+_.-]+$/.test(url)) {
			data = Template.__download__(url);
		} else {
			data = url;
		}
		Template.__loaded__[url] = new Template(data);
	}
	return Template.__loaded__[url];
};
Template.__download__	=	function(url, meth, data) {
	if(meth == null) meth = "GET";
	var content = null;
	var AJAX = new XMLHttpRequest();
	if (AJAX) {
		AJAX.open(meth, url, false);                             
		AJAX.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		AJAX.send(Template.transform2url(data));
		content = AJAX.responseText;                                         
	}
	return content;
};

Template.transform2url	=	function(data) {
	if(data == null) {
	} else if(data.constructor == Object) {
		var pairs = [];
		for(var key in data) {
			if(data[key].constructor == Array) {
				for(var i = 0; i < data[key].length; i++) {
					pairs.push(escape(key) + "=" + escape(data[key][i]));
				}
			} else {
				pairs.push(escape(key) + "=" + escape(data[key]));
			}
		}
		if(pairs.length > 0)
			return pairs.join("&");
		else
			return null;
	} else if(data.constructor == HTMLFormElement) {
		return Template.extract_form(data);
	}
};

Template.prototype = {
	stash:			Template.stash,
	_templates: 		null,
	addHelper:		function(name, func) {
		var _this = this;
		if(this[name] != null)
			throw "Helper or method exists.";
		this[name] = function(){return func.apply(_this, arguments)};
	},
	__translate_data__:	function(url, data) {
		if(url.constructor != String) 
			return url;
		var part;
		if(part = url.match(/^\s*(?:(GET|POST|PUT|DELETE)\s+)?(.+)$/)) {
			var meth = part[1] ? part[1] : "GET";
			url = part[2];
			var retData = Template.__download__(url, meth, data);
			return JSON.parse(retData);
		}
		return null;
	},
	render:			function(data, url_data) {
		data = this.__translate_data__(data, url_data);
		for(var key in this.stash) {
			if(data[key] == null)
				data[key] = this.stash[key];
		}
		var variables = "";
		for(var key in data) {
			variables += "var " + key + " = " + JSON.stringify(data[key]) + "\n";
		}
		return this.__function__.call(this, variables);
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
		var compiled_template = "eval(variables);\n";
		compiled_template += "var ret = '';\n";
		for(var i = 0; i < template_hashes.length; i++) {
			if(template_hashes[i].data != null)
				compiled_template += "ret += '" + template_hashes[i].data.replace(/'/g, "\\'") + "';\n";
			compiled_template += this.__compile_code__(template_hashes[i].code);
		}
		compiled_template += "return ret;\n";
		this.__function__ =  new Function("variables", compiled_template);
	},
	__compile_code__:	function(code) {
		var ret = code;
		if(!code)
			ret = "";
		if(/^\s*=\s*/.test(code)) {
			var new_code = code.replace(/^\s*=\s*/, "");
			ret = "ret += " + this.__compile_code__(new_code) + ";\n";
		} else if(/\s*=\s*$/.test(code)) {
			var new_code = code.replace(/\s*=\s*$/, "");
			ret = "( " + this.__compile_code__(new_code) + " ).replace(/^\\s+|\\s+$/g, '')";
		}
		return ret;
	},
	loadTemplate:		function(url){
		return Template.loadTemplate(url);
	},
	is_browser_detect_load: false,
	browser:	{
		get msie(){		console.log("bowser lib not loaded."); return false;},
		get safari(){	console.log("bowser lib not loaded."); return false;},
		get chrome(){	console.log("bowser lib not loaded."); return false;},
		get webkit(){	console.log("bowser lib not loaded."); return false;},
		get firefox(){	console.log("bowser lib not loaded."); return false;},
		get gecko(){	console.log("bowser lib not loaded."); return false;},
		get opera(){	console.log("bowser lib not loaded."); return false;},
	},
};

