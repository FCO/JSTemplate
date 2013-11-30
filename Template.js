function DataGetter(how2getData) {
	this.constructor = DataGetter;
	this.how2getData = how2getData;
	this.args = [];
}

DataGetter.preconf = {};

DataGetter.cache = {};

DataGetter.preconfigured = function(name, how2getData) {
	if(DataGetter.cache[name] == null)
		DataGetter.cache[name] = {};
	if(DataGetter.preconf[name] == null)
		DataGetter.preconf[name] = how2getData;
	var ret = new DataGetter(DataGetter.preconf[name])
	ret.type = name;
	return ret;
};

DataGetter.uniqueId = function(data) {
	var ret;
	if(data == null) return "null";
	switch(data.constructor) {
		case DataGetter:
			ret = "DataGetter(" + data.type + " => " + data.uniqueId() + ")";
		break;
		case Array:
			var tmp = [];
			for(var i = 0; i < data.length; i++)
				tmp.push(DataGetter.uniqueId(data[i]));
			ret = "[" + tmp.join(", ") + "]"
		break;
		case Object:
			var keys = [];
			var tmp = [];
			for(var key in data)
				keys.push(key);
			keys = keys.sort();
			for(var i = 0; i < keys.length; i++)
				tmp.push(keys[i] + ": " + DataGetter.uniqueId(data[key]));
			ret = "{" + tmp.join(", ") + "}"
		break;
		default:
			ret = '"' + data + '"';
	}
	return ret;
};

DataGetter.prototype = {
	cache:		0,
	defaults:	null,
	sets:		null,

	cached:		function(time) {
		this.cache = time != null ? time : -1;
		return this;
	},
	notCached:	function() {
		this.cache = 0;
		return this;
	},
	uniqueId:	function() {
		var ret = [];
		for(var i = 0; i < this.args.length; i++)
			ret.push(DataGetter.uniqueId(this.args[i]));
		return ret.join(", ");
	},
	setDefaults:	function(data) {
		this.defaults = BASIC(data);
		return this;
	},
	set:		function(data) {
		this.sets = BASIC(data);
		return this;
	},
	setArguments:	function() {
		this.args = arguments;
		return this;
	},
	recursiveGet:	function(data) {
		var ret;
		if(data == null) return;
		switch(data.constructor) {
			case DataGetter:
				ret = data.get();
			break;
			case Array:
				ret = [];
				for(var i = 0; i < data.length; i++)
					ret.push(this.recursiveGet(data[i]));
			break;
			case Object:
				ret = {};
				for(var key in data)
					ret[key] = this.recursiveGet(data[key]);
			break;
			default:
				ret = data;
			break;
		}
		return ret;
	},
	get:		function() {
		var ret;
		if(
			this.cache == 0
			|| DataGetter.cache[this.type][this.uniqueId()] == null
			|| (
				DataGetter.cache[this.type][this.uniqueId()]['expires'] != null
				&& DataGetter.cache[this.type][this.uniqueId()]['expires'] <= (new Date()).getTime()
			)
		) {
			ret = this.how2getData.apply(this, this.args);
			ret = this.recursiveGet(ret);
			DataGetter.cache[this.type][this.uniqueId()] = {
				answer:		ret,
				expires:	(this.cache > 0 ? (new Date()).getTime() + this.cache * 1000 : null)
			};
		} else {
			ret = DataGetter.cache[this.type][this.uniqueId()]['answer'];
		}
		if(this.defaults != null) {
			var defaults = this.defaults.get();
			for(var key in defaults) {
				if(ret[key] == null)
					ret[key] = defaults[key];
			}
		}
		if(this.sets != null) {
			var sets = this.sets.get();
			for(var key in sets) {
				ret[key] = sets[key];
			}
		}
		return ret;
	},
};

DataGetter.preconfigured("ALERT", function(data){
	alert("getting");
	return this.recursiveGet(data);
});

function ALERT(data) {
	var obj = DataGetter.preconfigured("ALERT");
	return obj.setArguments(data);
}

DataGetter.preconfigured("BASIC", function(data){
	return this.recursiveGet(data);
});

function BASIC(data) {
	var obj = DataGetter.preconfigured("BASIC");
	return obj.setArguments(data);
}

DataGetter.preconfigured("AJAX", function(method, url, data){
	var content = null;
	var AJAX = new XMLHttpRequest();
	if (AJAX) {
		AJAX.open(this.recursiveGet(method), this.recursiveGet(url), false);                             
		AJAX.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		AJAX.send(Template.transform2url(this.recursiveGet(data)));
		content = AJAX.responseText;                                         
	}
	return JSON.parse(content);
});

function GET(url, data) {
	return DataGetter.preconfigured("AJAX").setArguments("GET", url, data);
}
function POST(url, data) {
	return DataGetter.preconfigured("AJAX").setArguments("POST", url, data);
}
function PUT(url, data) {
	return DataGetter.preconfigured("AJAX").setArguments("PUT", url, data);
}
function DELETE(url, data) {
	return DataGetter.preconfigured("AJAX").setArguments("DELETE", url, data);
}

DataGetter.preconfigured("FORM", function(form){
	form = this.recursiveGet(form);
	if(form.constructor != HTMLFormElement)
		form = document.forms[form];
	var elements = form.elements;
	var ret = {};
	for(var i = 0; i < elements.length; i++) {
		var ele = elements[i];
		if(!ele.name) break;
		var do_break = false;
		switch(ele.type) {
			case 'radio':
				if(!ele.checked) do_break = true;
			break;
			case 'checkbox':
				if(ret[ele.name] == null) ret[ele.name] = [];
				ret[ele.name].push(ele.value);
				do_break = true;
			break;
		}
		if(do_break) break;
		ret[ele.name] = ele.value;
	}
	return ret;
});

function FORM(form) {
	return DataGetter.preconfigured("FORM").setArguments(form);
}

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
	if(data != null && data.constructor == Array) {
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
	if(elementObj == null) elementObj = document.querySelector(elementId);
	switch(what2do) {
		case "REPLACE":
			elementObj.innerHTML = container.innerHTML;
		break;
		case "APPEND":
			elementObj.appendChild(container);
		break;
		case "PREPEND":
			elementObj.prependChild(container);
		break;
	}
}
Template.renderTemplate	=	function(templateName, data, data2ajax) {
	var ret;
	if(templateName.constructor == Template) {
		ret = templateName.render(data, data2ajax);
	} else {
		ret = Template.loadTemplate(BASIC(templateName).get()).render(BASIC(data).get(), BASIC(data2ajax).get());
	}
	return ret;
};

Template.loadTemplate	=	function(url) {
	if(Template.__loaded__[url] == null) {
		var data;
		if(element = document.getElementById(url)) {
			data = element.innerHTML;
		} else if(element = document.querySelector(url)) {
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
	renderOn:		function(object, data, url_data) {
		return this.renderOn(data, url_data, object);
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

