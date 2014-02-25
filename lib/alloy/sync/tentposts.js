module.exports.sync = function(method, model, options) {
	var error;
	var filename = Alloy.Globals.skywriter.uenc(options.account) + '_' + options.feedname + '.json';
	switch(method) {
		case 'read':
			if (options.refresh === true || options.reload === true) {
				fetchNew();
			} else {
				var file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, 'tentposts', filename);
				if (file.exists()) {
					var s = file.read().toString();
					var e = JSON.parse(s);
					_.defer(options.success, e.body.posts, JSON.stringify(e.body.posts), options);
				} else {
					fetchNew();
				}
			}
			break;
		default:
			error = 'Oops! sync method not recognized.';
			break;
	}
	function fetchNew() {
		Alloy.Globals.tent.sendRequest({
			account : options.account,
			method : 'GET',
			'endpointparams' : options.endpointparams,
			'followpages' : 2,
			'endpoint' : options.endpoint
		}, function(fetchnewcallback) {
			if (fetchnewcallback.success) {
				Ti.API.info('tentposts success!');
				Ti.API.info('fetchnewcallback: ' + JSON.stringify(fetchnewcallback));
				Ti.API.info('refs: ' + JSON.stringify(fetchnewcallback.body.refs));
				if (options.justrefs) {
					fetchnewcallback.body.posts = _.uniq(fetchnewcallback.body.refs, true);
				} else if ( typeof fetchnewcallback.body.refs === 'object') {
					_.each(fetchnewcallback.body.posts, function(a, b, c) {
						if (a.refs) {
							fetchnewcallback.body.posts[b].refposts = [];
							_.each(a.refs, function(e, f, g) {
								var rp = _.findWhere(fetchnewcallback.body.refs, {
									id : e.post
								});
								fetchnewcallback.body.posts[b].refposts.push(rp);
							});
						}
					});
				}
				if (fetchnewcallback.body.posts && fetchnewcallback.body.posts.length > 0) {
					if ( typeof fetchnewcallback.body.refs === 'object') {
					}
					var feedfile = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, 'tentposts', filename);
					feedfile.write(JSON.stringify(fetchnewcallback));
					if (options.setcursor) {
						var laststatus = _.findWhere(fetchnewcallback.body.posts, {
							type : 'https://tent.io/types/status/v0#'
						});
						var lastreply = _.findWhere(fetchnewcallback.body.posts, {
							type : 'https://tent.io/types/status/v0#reply'
						});
						if (laststatus && laststatus.received_at > lastreply.received_at) {
							postCursor({
								post : laststatus,
								fetchnew : fetchnewcallback
							});
						} else if (lastreply && laststatus.received_at < lastreply.received_at) {
							postCursor({
								post : lastreply,
								fetchnew : fetchnewcallback
							});
						}
						options.success(fetchnewcallback.body.posts, JSON.stringify(fetchnewcallback.body.posts), options);
					} else {
						options.success(fetchnewcallback.body.posts, JSON.stringify(fetchnewcallback.body.posts), options);
					}
				} else {
					options.error(fetchnewcallback, JSON.stringify(fetchnewcallback), options);
				}
			} else if (fetchnewcallback.error) {
				options.error(fetchnewcallback, JSON.stringify(fetchnewcallback), options);
			}
		});
	}

	function postCursor(cursorparams) {
		Alloy.Globals.tent.sendRequest({
			endpoint : 'new_post',
			account : options.account,
			postjson : {
				type : 'https://tent.io/types/cursor/v0#https://tent.io/types/status/v0',
				refs : [{
					entity : cursorparams.post.entity,
					post : cursorparams.post.id,
					type : cursorparams.post.type
				}],
				permissions : {
					public : false
				}
			}
		}, function(cursorcallback) {
			Ti.API.info('cursorcallback:' + JSON.stringify(cursorcallback));
			if (cursorcallback.success) {
				Alloy.Globals.cursor = cursorcallback.body.post;
			}
		});
	}

};
