var args = arguments[0] || {};
var parent = $.feedview.getParent();
var refs = {};
$.metacard.bringToFront();
var discoverlist = {};
$.feedview.addEventListener('winclose', function(e) {
	$.destroy();
});
var feed = Alloy.Collections.post;
if (feed.length === 0) {
	refresh({
		cached : true
	});
} else {
	refresh({
		cached : true
	});
}

var discover = function(post) {
	Alloy.Globals.skywriter.discover({
		account : args.account,
		discover : post.entity,
		entity : post.entity
	}, function(e) {
		throttledRefresh({
			cached : true
		});
	});

};
function discoverAll() {
	Ti.API.info(JSON.stringify(discoverlist, null, '  '));
	for (var key in discoverlist) {
		discover({
			entity : key
		});
	}
	discoverlist = {};
};

function rowClick(e) {

};

function doTransform(model) {
	try {
		var x = model.toJSON();
		if (x.content) {
			var o = {};
			o.entity = x.entity;
			o.entitytext = o.entity;
			o.replyto = '';
			o.template = 'status';
			o.lock = 'globe2.png';
			if (x.type === 'https://tent.io/types/status/v0#') {
				o.template = 'status';
			} else if (x.type === 'https://tent.io/types/status/v0#reply' && x.refs && x.refs[0]) {
				o.template = 'reply';
				o.replyto = '↳in reply to ' + x.refposts[0].entity;
			}
			if ( typeof x.permissions !== 'undefined' && typeof x.permissions['public'] !== 'undefined' && x.permissions['public'] === false) {
				o.lock = 'lock2.png';
			}
			o.image = 'skysquare.png';
			var entity = Alloy.createModel('entity');
			entity.fetch({
				query : 'SELECT * FROM entities WHERE entity="' + o.entity + '" LIMIT 1'
			});
			var entityjson = entity.toJSON();
			var then = Alloy.Globals.moment(parseInt(entityjson.retrieved, 10));
			var now = Alloy.Globals.moment();
			if (entityjson.local_avatar && now.diff(then, 'days') < 4) {
				o.image = Titanium.Filesystem.applicationDataDirectory + entityjson.local_avatar;
			} else {
				discoverlist[o.entity] = true;
			}
			var as = Alloy.Globals.tent.markdown({
				text : x.content.text,
				mentions : x.mentions
			});
			if (as) {
				o.atstr = Titanium.UI.iOS.createAttributedString(as);
			}
			return o;
		} else {
			return {
				entity : '',
				text : '',
				image : 'skysquare.png'
			};
		}
	} catch(error) {
		Ti.API.info('caught: ' + JSON.stringify(error));
	}
}

function linkPress(link) {
	if (link.url.substr(0, 6) === 'meta: ') {
		$.metacard.init({
			entity : link.url.substr(6, link.url.length)
		});
		$.metacard.show();
	} else if (link.url.substr(0, 7) !== 'http://' && link.url.substr(0, 8) !== 'https://') {
		Ti.Platform.openURL('http://' + link.url);
	} else {
		Ti.Platform.openURL(link.url);
	}
}

function avatarClick(avatar) {
	$.metacard.init({
		entity : avatar.source.entity
	});
	$.metacard.show();
}

function footerClick() {

}

function refresh(params) {
	var reload = true;
	if (params.cached) {
		reload = false;
	}
	feed.fetch({
		account : args.account,
		feedname : args.feedname,
		setcursor : args.setcursor,
		endpoint : args.endpoint,
		endpointparams : args.endpointparams,
		refresh : reload,
		success : function(s) {
			if (reload) {
				_.defer(discoverAll);
			}
			$.refresh.endRefreshing();
		},
		error : function(e) {
			$.refresh.endRefreshing();
		}
	});
}

var throttledRefresh = _.throttle(refresh, 2000, {
	leading : false
});
var debouncedRefresh = _.debounce(refresh, 2000);
