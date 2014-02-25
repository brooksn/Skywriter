exports.background = function(e) {
	setTimeout(function() {
		Ti.App.iOS.endBackgroundHandler(e.handlerId);
	}, 2000);
};
exports.discover = function(params, callback) {
	var entity = Alloy.createModel('entity');
	entity.fetch({
		query : 'SELECT * FROM entities WHERE entity="' + params.discover + '" LIMIT 1'
	});
	var relationships = Alloy.createCollection('relationship');
	relationships.fetch({
		query : 'SELECT * FROM relationships WHERE entity="' + params.discover + '"'
	});

	Alloy.Globals.tent.discoverEndpoint({
		account : params.account,
		discover : params.discover,
	}, function(discovercallback) {
		entity.save({
			entity : params.discover,
			name : discovercallback.body.post.content.profile.name,
			bio : discovercallback.body.post.content.profile.bio,
			website : discovercallback.body.post.content.profile.website,
			location : discovercallback.body.post.content.profile.location,
			//avatar: discovercallback.body.post.attachments[0].digest,
			retrieved : +Alloy.Globals.moment()
		});
		for (var i = 0; i < relationships.length; i++) {
			if (discovercallback.body.post.content.profile.name) {
				relationships.at(i).save({
					display_name : discovercallback.body.post.content.profile.name
				});
			} else {
				relationships.at(i).save({
					display_name : params.discover
				});
			}
		}
		if (discovercallback.body.post.attachments) {
			var atts = discovercallback.body.post.attachments;
			var digest = '';
			for (var i = 0; i < atts.length; i++) {
				//if(atts[i].category && atts[i].category==='avatar' && atts[i].content_type.substr(0,5)==='image' && atts[i].size<1000000){
				//I accidentially Tjreo's avatar. Sorry.
				if (atts[i].content_type.substr(0, 5) === 'image' && atts[i].size < 1000000) {
					digest = atts[i].digest;
					entity.save({
						avatar : digest
					});
					i = atts.length + 1;
				}
			}
			if (digest && digest.length > 1) {
				Alloy.Globals.tent.sendRequest({
					'method' : 'GET',
					'account' : params.account,
					'endpoint' : 'attachment',
					'endpointtemplate' : {
						'entity' : params.discover,
						'digest' : digest
					}
				}, function(avatarcallback) {
					if (avatarcallback.file) {
						Ti.API.info('nice. there was a file in avatarcallback.');
						for (var i = 0; i < relationships.length; i++) {
							relationships.at(i).save({
								local_avatar : avatarcallback.file
							});
						}
						entity.save({
							local_avatar : avatarcallback.file
						});
					} else {
						Ti.API.info('there was no file in avatarcallback');
					}
					Ti.API.info('quitting with avatarcallback.');
					callback(avatarcallback);
				});
			} else {
				Ti.API.info('quitting because no avatar was found in attachments list');
				callback(discovercallback);
			}
		} else {
			Ti.API.info('quitting because no attachments list');
			callback(discovercallback);
		}
	});
};
exports.parseSubscriptions = function(params) {
	var rels = {};
	_.each(params.posts, function(post) {
		if (post.entity === params.account) {
			if (!rels[post.mentions[0].entity]) {
				rels[post.mentions[0].entity] = {
					iget : false,
					isend : false
				};
			}
			rels[post.mentions[0].entity].iget = true;
		} else {
			if (!rels[post.entity]) {
				rels[post.entity] = {
					iget : false,
					isend : false
				};
			}
			rels[post.entity].isend = true;
		}
	});
	if (rels[params.account]) {
		rels[params.account] = null;
	}
	return rels;
};

exports.discoverRels = function(account) {
	var rels = Alloy.Collections.instance('relationship');
	rels.fetch();
	for (var i = 0; i < rels.length; i++) {
		var oldrel = rels.at(i).toJSON();
		oldrel.iget = false;
		oldrel.isend = false;
		rels.at(i).save(oldrel);
	}
	Alloy.Globals.tent.sendRequest({
		'method' : 'GET',
		'account' : account,
		'endpointparams' : {
			'types' : [
			//'https://tent.io/types/subscription/v0#' + Ti.Network.encodeURIComponent('https://tent.io/types/status/v0')
			Ti.Network.encodeURIComponent('https://tent.io/types/subscription/v0#https://tent.io/types/status/v0')]
		},
		'followpages' : 20,
		'endpoint' : 'posts_feed'
	}, function(e) {
		//$.navwin.open();
		//acctr--;
		Ti.API.info('discovered a feed:');
		Ti.API.info(JSON.stringify(e));
		var subs = Alloy.Globals.skywriter.parseSubscriptions({
			"posts" : e.body.posts,
			"account" : account
		});

		for (var ent in subs) {
			var combo = Alloy.Globals.skywriter.uenc(ent, account);
			var rel = Alloy.createModel('relationship');
			rel.fetch({
				query : 'SELECT * FROM relationships WHERE combo="' + combo + '"'
			});
			var orel = rel.toJSON();
			rel.save({
				"combo" : combo,
				"display_name" : orel.display_name,
				"local_avatar" : orel.local_avatar,
				"entity" : ent,
				"account" : account,
				"iget" : subs[ent].iget,
				"isend" : subs[ent].isend,
				"type" : "https://tent.io/types/status/v0"
			});
		}
	});
	rels.fetch();
};
function savePost(post, feed, account, next) {
	var p = {
		"post_id" : post.id,
		"received_at" : post.received_at,
		"entity" : post.entity,
		"reposter" : post.reposter,
		"account" : account,
		"type" : post.type,
		"feed_name" : feed,
		"text" : post.content.text,
		"app_url" : post.app.url,
		"next_page" : next
	};
	if (post.content.location && post.content.location.latitude) {
		p.location = JSON.stringify(post.content.location);
	}
	if (post.refs && typeof post.refs === 'object') {
		p.refs = JSON.stringify(post.refs);
	}
	if (post.mentions && typeof post.mentions === 'object') {
		p.mentions = JSON.stringify(post.mentions);
	}
	Ti.API.info('p: ' + JSON.stringify(p));
	var model = Alloy.createModel('statusfeed');
	model.save(p);
	//Ti.API.info(JSON.stringify(p));
};
exports.refreshStatusFeed = function(account) {
	Alloy.Globals.tent.sendRequest({
		'method' : 'GET',
		'account' : account,
		'endpointparams' : {
			'types' : Alloy.Globals.feedtypes,
			'max_refs' : 4
		},
		'followpages' : 2,
		'endpoint' : 'posts_feed'
	}, function(feedcallback) {
		Ti.API.info('feedcallback: ' + JSON.stringify(feedcallback));
		var next = "";
		if (feedcallback.body.pages.next) {
			var next = feedcallback.body.pages.next;
		}
		_.each(feedcallback.body.posts, function(post) {

			if (post.type === 'https://tent.io/types/repost/v0#https://tent.io/types/status/v0') {
				Ti.API.info('try reposting:' + post.id + post.entity);
				var repost = _.findWhere(feedcallback.body.refs, {
					post : post.refs[0].post
				});
				if (repost) {
					repost.reposter = post.entity;
					repost.received_at = post.received_at;
					Ti.API.info('reposting' + post.id + post.entity);
					savePost(repost, 'statusfeed', account, next);
				} else {
					Ti.API.info('reposting failed: ' + post.id + post.entity);
				}
			} else {
				Ti.API.info('plainposting: ' + post.id + post.entity);
				savePost(post, 'statusfeed', account, next);
			}
		});
		_.each(feedcallback.body.refs, function(post) {
			Ti.API.info('refsposting: ' + post.id + post.entity);
			savePost(post, 'ref', account, next);
		});
	});
};

exports.discoverAvatar = function(params, callback) {
	var entity = Alloy.createModel('entity');
	entity.fetch({
		query : 'SELECT * FROM entities WHERE entity="' + params.entity + '" LIMIT 1'
	});
	var ejson = entity.toJSON();
	Ti.API.info('params:' + JSON.stringify(params));
	Ti.API.info('entity: ' + JSON.stringify(ejson));
};

exports.fetchCursor = function(account) {
	Alloy.Globals.tent.sendRequest({
		'account' : account,
		'method' : 'GET',
		'endpoint' : 'posts_feed',
		'endpointparams' : {
			'types' : [Ti.Network.encodeURIComponent('https://tent.io/types/cursor/v0#https://tent.io/types/status/v0')],
			'limit' : '1',
			'entity' : account
		}
	}, function(cursorcallback) {
		Ti.API.info('cursorcallback: ' + JSON.stringify(cursorcallback));
		if (cursorcallback.success && cursorcallback.body.posts[0]) {
			Alloy.Globals.cursor[cursorcallback.entity] = cursorcallback.body.posts[0];
		}
	});
};
exports.relsViews = function(account) {
	Alloy.Globals.relsviews[account] = Alloy.createController('relationshipsview', {
		'account' : account
	}).getView();
};
exports.windows = function(account) {
	Alloy.Globals.windows[account + 'relationshipswindow'] = Alloy.createController('relationshipswindow', {
		'account' : account
	}).getView();
};

exports.uenc = function(a, b) {
	a = a.substr(5, a.length);
	if (b) {
		b = b.substr(5, b.length);
		a += b;
	}
	return a.replace(/\W/g, "");
};
