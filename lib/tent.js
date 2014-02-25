exports.authorize = function(params, callback) {
	exports.discover({
		"entity" : params.entity,
		'auth' : params.app
	}, callback);
};

var authRegistration = function(params, callback) {
	var account = Alloy.createModel('account', {
		"entity" : params.meta.content.entity,
		"encoded_uri" : Ti.Network.encodeURIComponent(params.meta.content.entity)
	});
	if (account.isValid) {
		account.save({
			entity : params.meta.content.entity
		});
		params.app.content.redirect_uri += 'auth.com/' + Ti.Network.encodeURIComponent(params.meta.content.entity);
		exports.sendRequest({
			"postjson" : params.app,
			"account" : params.meta.content.entity,
			"endpoint" : "new_post",
			"auth" : 'registration'
		}, callback);
	} else {
		Ti.API.info('account not valid.');
		account.destroy();
		callback({
			'error' : 'account.isValid failed.'
		});
	}
};
var authGetTempHawk = function(params, callback) {
	if (params.data.link.rel === 'https://tent.io/rels/credentials') {
		exports.sendRequest({
			'method' : 'GET',
			'app' : params.data.body.post.id,
			'account' : params.account,
			'target' : params.data.link.link,
			'auth' : 'temphawk'
		}, callback);
	} else {
		callback({
			'error' : 'registration failed.'
		});
	}
};
var authOauth = function(params, callback) {
	var state = setState(params.account).state;
	var account = Alloy.createModel('account');
	account.fetch({
		query : 'SELECT * FROM accounts WHERE entity="' + params.account + '"'
	});
	account.save({
		appid : params.app,
		tempid : params.data.body.post.id,
		tempkey : params.data.body.post.content.hawk_key,
		tempalgo : params.data.body.post.content.hawk_algorithm
	});
	Titanium.Platform.openURL(exports.getMeta({entity:params.account}).content.servers[0].urls.oauth_auth + '?client_id=' + params.app + '&state=' + state);
};
exports.authPostToken = function(params, callback) {
	var appstate = getState();
	var token = {
		"code" : params.parts.code,
		"token_type" : "https://tent.io/oauth/hawk-token"
	};
	exports.sendRequest({
		'auth' : 'posttoken',
		'postjson' : token,
		'endpoint' : 'oauth_token',
		'account' : appstate.entity,
		'contenttype' : 'application/json'
	}, callback);
};
var authFinish = function(params, callback) {
	setState(false);
	var account = Alloy.createModel('account');
	account.fetch({
		query : 'SELECT * FROM accounts WHERE entity="' + params.account + '"'
	});
	if (params.data.body.access_token) {
		account.save({
			hawkid : params.data.body.access_token,
			hawkkey : params.data.body.hawk_key,
			hawkalgo : params.data.body.hawk_algorithm,
			authorized : true
		});
		callback({
			"sucess" : true,
			"message" : params.account + " was authorized.",
			"authorized" : true,
			"error" : false,
			"account" : params.account
		});
	} else {
		account.destroy();
		callback({
			'error' : 'some error happened.'
		});
	}
};
exports.validateURI = function(params, callback) {
	var returndata = {
		'entity' : false,
		'error' : false
	};
	var start = params.entity.substr(0, 8).toLowerCase();
	if (start.substr(0, 7) === "http://") {
		returndata.entity = 'http://' + params.entity.substr(7);
	} else if (start.substr(0, 8) === 'https://') {
		returndata.entity = 'https://' + params.entity.substr(8);
	} else {
		returndata.error = 'URL didn\'t begin with "https://"';
	}
	return returndata;
};
exports.discover = function(params, callback) {
	var uri = exports.validateURI({
		'entity' : params.entity
	});
	if (uri.entity) {
		var discoverhead = Ti.Network.createHTTPClient({
			onload : function(e) {
				if (discoverhead.getResponseHeader('Link')) {
					var linkheader = parseLinkHeader(discoverhead.getResponseHeader('Link'));
					if (linkheader['rel'] == "https://tent.io/rels/meta-post") {
						var entitymeta = discoverhead.getResponseHeader('Link').match(/<(.*?)>/)[1];
						if (entitymeta.substr(0, 8) == 'https://' || entitymeta.substr(0, 7) == 'http://') {
							var dmtarget = entitymeta;
						} else {
							var dmtarget = uri.entity + entitymeta;
						}
						discovermeta.open('GET', dmtarget);
						discovermeta.send();
					} else {
						Ti.API.info('a valid Link header did not exist: ' + discoverhead.getResponseHeader('Link'));
					}
				} else {
					Ti.API.info('a Link header did not exist: ' + discoverhead.getResponseHeader('Link'));
				}

			},
			onerror : function(e) {
				Ti.API.info('discoverhead failed.');
			},
			timeout : 9000
		});
		var discovermeta = Ti.Network.createHTTPClient({
			onload : function(e) {
				if (JSON.parse(this.responseText)["post"]["type"] == "https://tent.io/types/meta/v0#") {//profile is valid
					Ti.API.info('discovermeta valid: ' + JSON.parse(this.responseText)["post"]["type"]);
					var meta = saveMeta({
						'meta' : JSON.parse(this.responseText)
					});
					if (params.auth) {
						authRegistration({
							'meta' : meta,
							'app' : params.auth
						}, callback);
					} else {
						callback(meta);
					}
				} else {
					Ti.API.info('discoverclient was successful, but the response was not a valid profile. as follows:');
					Ti.API.info(JSON.parse(this.responseText));
					callback(false);
				}
			},
			onerror : function(e) {
				Ti.API.info('discovermeta failed.');
				Ti.API.info(e.error);
				Ti.API.info(e.code);
				Ti.API.info(e.success);
				callback(false);
			},
			timeout : 9000
		});
		discoverhead.open('GET', uri.entity);
		discoverhead.send();
	} else {
		return uri.error;
	}
};
exports.discoverEndpoint = function(params, callback) {
	/**
	 *   /discover?entity={entity}
	 */
	exports.sendRequest({
		'method' : 'GET',
		'endpointtemplate' : {
			'entity' : params.discover
		},
		'account' : params.account,
		'endpoint' : 'discover'
	}, callback);
};
var prepareEndpoint = function(params) {
	var url = "";
	var endpoint = exports.getMeta({entity:params.account}).content.servers[0].urls[params.endpoint];
	if (endpoint.substr(0, 7) === "http://" || endpoint.substr(0, 8) === "https://") {
		url = endpoint;
	} else {
		url = params.account + endpoint;
	}
	if (params.template) {
		for (var field in params.template) {
			url = url.replace('{' + field + '}', params.template[field]);
		}
	}
	if (params.endpoint === "discover") {
		url += "?entity=" + params.template.entity;
	}
	if (params.params) {
		var paramctr = 0;
		if ( typeof params.params === 'object') {
			for (var key in params.params) {
				if (paramctr === 0) {
					url += '?';
				} else {
					url += '&';
				}
				url += key + '=' + params.params[key].toString();
				paramctr++;
			}
		} else if ( typeof params.params === 'string') {
			url += params.params;
		}
	}
	return url;
};

function prepareAttachment(params) {
};

exports.sendRequest = function(params, callback) {
	var account = Alloy.createModel('account');
	account.fetch({
		query : 'SELECT * FROM accounts WHERE entity="' + params.account + '"'
	});
	var accountjson = account.toJSON();
	var sendrequestclient = Ti.Network.createHTTPClient({
		onload : function(e) {
			Ti.API.info('sendrequestclient succeeded.');
			Ti.API.info(JSON.stringify(e));
			if (params.endpointtemplate && params.endpointtemplate.digest) {
				var attachment = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, 'attachments', params.endpointtemplate.digest);
				attachment.write(this.responseData);
				callback({
					"file" : "attachments/" + params.endpointtemplate.digest,
					"digest" : params.endpointtemplate.digest,
					"success" : true,
					"error" : false
				});
			} else {
				var answer = {
					"body" : JSON.parse(this.responseText),
					"success" : true,
					"link" : parseLinkHeader(sendrequestclient.getResponseHeader('Link')),
					"error" : false
				};

				if (params.auth === 'registration') {
					authGetTempHawk({
						data : answer,
						account : params.account
					}, callback);
				} else if (params.auth === 'temphawk') {
					authOauth({
						data : answer,
						account : params.account,
						app : params.app
					}, callback);
				} else if (params.auth === 'posttoken') {
					authFinish({
						data : answer,
						account : params.account
					}, callback);
				} else if (params.followpages && params.followpages > 0) {
					params.followpages--;
					if (params.pagenext === 'answer.body.pages.next') {
						callback(answer);
					} else {
						params.pagenext = answer.body.pages.next;
						params.endpointparams = answer.body.pages.next;
						if (params.answer) {
							for (var key in answer.body) {
								if (key === 'pages') {
									params.answer.body.pages = answer.body[key];
								} else {
									params.answer.body[key] = _.union(params.answer.body[key], answer.body[key]);
								}
							}
						} else {
							params.answer = answer;
						}
						if (answer.body.pages.next) {
							exports.sendRequest(params, callback);
						} else {
							callback(params.answer);
						}
					}
				} else if (params.answer) {
					callback(params.answer);
				} else {
					callback(answer);
				}
			}
		},
		onerror : function(e) {
			Ti.API.info('sendrequestclient failed:');
			Ti.API.info(this.responseText);
			Ti.API.info(JSON.stringify(e, null, '  '));
			if (params.auth) {
				account.destroy();
			}
			callback({
				'error' : true,
				'body' : this.responseText,
				'success' : false
			});
		}
	});
	var method = 'POST';
	if (params.method) {
		method = params.method;
	}
	var target = "";
	if (params.endpoint) {
		target = prepareEndpoint({
			"account" : params.account,
			"endpoint" : params.endpoint,
			"template" : params.endpointtemplate,
			"params" : params.endpointparams
		});
	}
	if (params.target) {
		target = params.target;
	}
	Ti.API.info('target: ' + target);
	sendrequestclient.open(method, target);

	/**
	 * set Content-Type header
	 */
	var contenttype = '';
	if (method !== 'GET') {
		if (params.contenttype) {
			contenttype = params.contenttype;
		} else {
			contenttype = 'application/vnd.tent.post.v0+json; type="' + params.postjson['type'] + '"';
		}
		sendrequestclient.setRequestHeader('Content-Type', contenttype);
	}

	/**
	 * set Authorization header
	 */
	var auth = false;
	var hawk = {
		'key' : '',
		'id' : '',
		'app' : ''
	};
	if (accountjson.hawkid) {
		auth = true;
		hawk.id = accountjson.hawkid;
		hawk.key = accountjson.hawkkey;
		hawk.app = accountjson.appid;
	} else if (accountjson.tempid) {
		auth = true;
		hawk.id = accountjson.tempid;
		hawk.key = accountjson.tempkey;
		hawk.app = accountjson.appid;
	}
	if (auth) {
		var hawked = hawkHelper({
			'entity' : params.account,
			'postjson' : params.postjson,
			'method' : method,
			'type' : contenttype,
			'destination' : target,
			'contenttype' : contenttype,
			'keys' : hawk
		});
		sendrequestclient.setRequestHeader('Authorization', hawked.header);
	}
	Ti.API.info('auth: ' + auth);
	if (method === 'GET') {
		sendrequestclient.send();
	} else {
		sendrequestclient.send(JSON.stringify(params.postjson));
	}
};

var hawkHelper = function(params) {
	var destination = splitURL(params.destination);
	var ts = exports.makeTimestamp();
	var returnhelper = {};
	if (params.keys) {
		var key = params.keys.key;
		var id = params.keys.id;
		var app = params.keys.app;
	}
	var nonce = makeNonce();
	var hash = '';

	var ext = '';
	var dlg = '';
	var hashheader = '';
	if (params.type) {
		if (params.type.split(';')[0] !== 'multipart/form-data') {
			var payload = JSON.stringify(params.postjson);
			var todigest = 'hawk.1.payload' + '\n' + params.type.split(';')[0] + '\n' + payload + '\n';
			var payloadhash = CryptoJS.SHA256(todigest);
			var digest = payloadhash.toString(CryptoJS.enc.Base64);
			var hash = digest;
			hashheader = 'hash="' + hash + '", ';
			returnhelper['payload'] = hash;
		}//if(!multipart) no hash for attachments
		else {
			Ti.API.info('is multipart, not setting hash');
		}
	}
	var normalizedstring = 'hawk.1.header' + '\n' + ts + '\n' + nonce + '\n' + params.method + '\n' + destination.route + '\n' + destination.host + '\n' + destination.port + '\n' + hash + '\n' + ext + '\n' + app + '\n' + dlg + '\n';
	var mac = CryptoJS.HmacSHA256(normalizedstring, key).toString(CryptoJS.enc.Base64);
	var header = 'Hawk id="' + id + '", ' + 'mac="' + mac + '", ' + 'ts="' + ts + '", ' + 'nonce="' + nonce + '", ' + hashheader + 'app="' + app + '"';

	returnhelper['header'] = header;
	return returnhelper;
};

var parseLinkHeader = function(header) {
	if (header) {
		if (header.substr(0, 1) == '<') {
			link = header.match(/<(.*?)>;/)[1];
			link.replace('<', '');
			link.replace('>;', '');
			rel = header.match(/rel="(.*?)"/)[1];
			rel.replace('rel="', '');
			rel.replace('"', '');
			retrnlink = {
				"link" : link,
				"rel" : rel
			};
			return retrnlink;
		} else {
			Ti.API.info('parseLinkHeader failed.');
			Ti.App.fireEvent('tent_auth_failure');
			return false;
		}
	} else {
		return false;
	}
};
exports.parseURI = function(url) {
	var argsblock = url.split('?');
	var args2 = argsblock[1].split('&');
	var args3 = argsblock[0].split('auth.com/');
	var args = {};
	for (var i = 0; i < args2.length; i++) {
		if (args2[i].substr(0, 5) == 'code=') {
			args['code'] = args2[i].replace('code=', '');
		}
		if (args2[i].substr(0, 6) == 'state=') {
			args['state'] = args2[i].replace('state=', '');
		}
	}
	if (args3[1].substr(0, 4) === 'http') {
		args['encoded_uri'] = args3[1];
	}
	return args;
};
var splitURL = function(url) {
	var parts = {};
	var ustring = '';
	if (url.substr(0, 8) == 'https://') {
		parts['port'] = '443';
		ustring = url.slice(8, url.length);
	} else if (url.substr(0, 7) == 'http://') {
		parts['port'] = '80';
		ustring = url.slice(7, url.length);
	}
	parts['host'] = ustring.split('/',1)[0];
	parts['route'] = ustring.slice(parts['host'].length, ustring.length);
	return parts;
};
var makeNonce = function() {
	return Math.floor(Math.random() * 100000000000);
};
var setState = function(entity) {
	var state = makeNonce();
	Ti.App.Properties.setObject('tentstate', {
		'state' : state,
		'entity' : entity
	});
	return {
		'state' : state,
		'entity' : entity
	};
};
var getState = function() {
	return Ti.App.Properties.getObject('tentstate');
};
exports.markdown = function(params) {
	var string = {
		text : params.text,
		attributes : []
	};
	var remaining = params.text;
	try {
		var link = /((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/;
		var mdlink = /\[(.*?)\]\(((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))\)/g;
		var bold = /\*(.*?)\*/g;
		var mctr = 0;
		var mention = /\^\[(.*?)\]\(([0-9])\)/g;
		if (params.mentions) {
			string.text = string.text.replace(mention, function(match, name, index, offset, fullstring) {
				var nick = '^' + name;
				string.attributes.push({
					type : Ti.UI.iOS.ATTRIBUTE_LINK,
					value : 'meta: ' + params.mentions[index].entity,
					range : [offset - mctr * 5, nick.length]
				});
				mctr++;
				//no idea why, but each offset is of by a multiple of 5.
				return nick;
			});
		}
		mctr = 0;
		string.text = string.text.replace(mdlink, function(match, title, linkurl, a, b, c, d, offset, fullstring) {
			string.attributes.push({
				type : Ti.UI.iOS.ATTRIBUTE_LINK,
				value : linkurl,
				range : [offset - mctr * 5, title.length]
			});
			mctr++;
			return title;
		});
		mctr = 0;
		string.text = string.text.replace(link, function(match, linkurl, a, b, c, d, offset, fullstring) {
			string.attributes.push({
				type : Ti.UI.iOS.ATTRIBUTE_LINK,
				value : linkurl,
				range : [offset - mctr * 5, linkurl.length]
			});
			mctr++;
			return linkurl;
		});
		mctr = 0;
		string.text = string.text.replace(bold, function(match, bolded, offset, fullstring) {
			string.attributes.push({
				type : Ti.UI.iOS.ATTRIBUTE_TEXT_EFFECT,
				range : [offset - mctr * 5, bolded.length],
				value : Ti.UI.iOS.ATTRIBUTE_LETTERPRESS_STYLE
			});
			mctr++;
			return bolded;
		});
		return string;
	} catch(error) {
		Ti.API.info('markdown error: ' + JSON.stringify(params) + ' error: ' + JSON.stringify(error));
		return {
			text : params.text,
			attributes : []
		};
	}
};

var saveMeta = function(params, callback) {
	var meta = {};
	if (params.meta.post.content) {
		meta = params.meta.post;
	} else if (params.meta.content) {
		meta = params.meta;
	}
	Ti.App.Properties.setObject(meta.content.entity, meta);
	return meta;
};
exports.getMeta = function(params, callback) {
	return Ti.App.Properties.getObject(params.entity);
};
exports.makeTimestamp = function() {
	return Math.round(+new Date() / 1000);
};
exports.persistRelationships = function(params, callback) {
};
//persistRelationships
exports.persistPosts = function(params, callback) {
};
//persistPosts
exports.persistPhotos = function(params, callback) {
};
//persistPhotos
exports.persistGroups = function(params, callback) {
};
//persistGroups

