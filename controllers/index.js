function openWindow(e) {
	try {
		e.window = e.source.window;
	} catch(error) {
	}
	if (Alloy.Globals.windows[e.account + e.window]) {
		Ti.API.info('existing window');
		$.navwin.openWindow(Alloy.Globals.windows[e.account + e.window]);
	} else {
		var window = Alloy.createController(e.window, {
			'account' : e.account
		}).getView();
		$.navwin.openWindow(window);
	}
};
Ti.App.addEventListener('openwindow', openWindow);

function listClick(e) {

}

var tctrl = Ti.UI.createImageView({
	image : 'navplane.png'
});
$.mainwin.setTitleControl(tctrl);
$.mainwin.setTitle(' ');
function transformFunction(model) {
	var transform = model.toJSON();
	var entity = Alloy.createModel('entity');
	entity.fetch({
		query : 'SELECT * FROM entities WHERE entity="' + transform.entity + '" LIMIT 1'
	});
	var entityjson = entity.toJSON();
	var then = Alloy.Globals.moment(parseInt(entityjson.retrieved, 10));
	var now = Alloy.Globals.moment();
	if (entityjson.local_avatar && now.diff(then, 'days') < 4) {
		transform.image = Titanium.Filesystem.applicationDataDirectory + entityjson.local_avatar;
	} else {
		transform.image = 'skysquare.png';
		Alloy.Globals.skywriter.discover({
			account : transform.entity,
			discover : transform.entity,
			entity : transform.entity
		}, function(e) {
			throttledRefresh({
				cached : true
			});
		});
	}
	if (transform.hawkid !== 'dummy') {
		transform.title = transform.entity;
		if (transform.entity.substr(0, 8) === 'https://') {
			transform.title = transform.entity.substr(8);
		} else if (transform.entity.substr(0, 7) === 'http://') {
			transform.title = transform.entity.substr(7);
		}

		var meta = Ti.App.Properties.getObject(transform.entity);
		if (meta.content.profile.name) {
			transform.title = meta.content.profile.name;
		}
	} else {
		transform.title = transform.entity;
	}
	return transform;
};
function filterFunction(collection) {
	return collection.where({
		hawkalgo : 'sha256'
	});
};
$.accounts = Alloy.Collections.account;
$.accounts.fetch();

function addAccount(params) {
	$.accounts.fetch();

};
function removeAccount(entity) {
	$.accounts.fetch();
};

Ti.App.addEventListener('addaccount', addAccount);
Ti.App.addEventListener('removeaccount', removeAccount);

$.mainwin.addEventListener('close', function() {
	$.destroy();
});
function refresh() {
	$.accounts.fetch();
}

var throttledRefresh = _.throttle(refresh, 2000, {
	leading : false
});
$.navwin.open();
