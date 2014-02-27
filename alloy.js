Titanium.App.iOS.setMinimumBackgroundFetchInterval(Titanium.App.iOS.BACKGROUNDFETCHINTERVAL_MIN);
Alloy.Globals.moment = require('alloy/moment');
Alloy.Globals.tent = require('tent');
var getnrkey = require('getnrkey');
Ti.Geolocation.setPurpose('You may add your location to the content of Tent posts.');

var newrelic = require('ti.newrelic');
var nrkey = getnrkey.nrkey();
if (Ti.App.Properties.hasProperty('nr')) {
	if (Ti.App.Properties.getBool('nr')) {
		newrelic.start(nrkey);
	}
} else {
	var nrdialog = Ti.UI.createAlertDialog({
		title : "Thanks for testing Skywriter. Do you want to send detailed usage data (including your Tent entity, but never post content) to the developer?",
		buttonNames : ['Yes', 'No']
	});
	nrdialog.addEventListener('click', function(nr) {
		Ti.API.info('NR: ' + JSON.stringify(nr));
		if (nr.index === 0) {
			Ti.App.Properties.setBool('nr', true);
			newrelic.start(nrkey);
		} else {
			Ti.App.Properties.setBool('nr', false);
		}
	});
	nrdialog.show();
}
var attsfolder = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, 'attachments');
var feedfolder = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, 'tentposts');
if (!attsfolder.exists()) {
	attsfolder.createDirectory();
}
if (!feedfolder.exists()) {
	feedfolder.createDirectory();
}

var sha1 = require('alloy/sha1');
Alloy.Globals.skywriter = require('skywriter');
Alloy.Globals.feedtypes = [Ti.Network.encodeURIComponent('https://tent.io/types/status/v0'), Ti.Network.encodeURIComponent('https://tent.io/types/status/v0#reply'),
//	Ti.Network.encodeURIComponent('https://tent.io/types/repost/v0#https://tent.io/types/status/v0'),
Ti.Network.encodeURIComponent('https://tent.io/types/favorite/v0#https://tent.io/types/status/v0')];
var quitters = Alloy.Collections.instance('account');
var rels = Alloy.Collections.instance('relationship');
quitters.fetch({
	query : 'SELECT * FROM accounts WHERE hawkid="dummy"'
});
while (quitters.length) {
	quitters.at(0).destroy();
}
quitters.fetch();

Alloy.Globals.loading = Alloy.createWidget("nl.fokkezb.loading");
Alloy.Globals.appcredentials = {
	"type" : "https://tent.io/types/app/v0#",
	"content" : {
		"name" : "New! Skywriter beta: " + Ti.Platform.username,
		"url" : "https://brooks.is",
		"scopes" : ["permissions"],
		"types" : {
			"read" : ["https://tent.io/types/meta/v0", "https://tent.io/types/photo/v0", "https://tent.io/types/status/v0", "https://tent.io/types/repost/v0", "https://tent.io/types/cursor/v0", "https://tent.io/types/favorite/v0", "https://tent.io/types/tag/v0", "https://tent.io/types/subscription/v0", "https://tent.io/types/relationship/v0"],
			"write" : ["https://tent.io/types/meta/v0", "https://tent.io/types/photo/v0", "https://tent.io/types/status/v0", "https://tent.io/types/repost/v0", "https://tent.io/types/cursor/v0", "https://tent.io/types/favorite/v0", "https://tent.io/types/tag/v0", "https://tent.io/types/subscription/v0", "https://tent.io/types/relationship/v0"]
		},
		"redirect_uri" : "skywriter://"
	},
	"permissions" : {
		"public" : false
	}
};

Alloy.Globals.Map = require('ti.map');
Ti.include('/cryptojs/hmac-sha256.js');
Ti.include('/cryptojs/enc-base64-min.js');

var URIListener = function(e) {
	setTimeout(function() {
		if (Ti.App.getArguments()['url']) {
			var parts = Alloy.Globals.tent.parseURI(Ti.App.getArguments()['url']);
			if (Ti.App.getArguments()['url'].substr(0, 20) == 'skywriter://auth.com') {
				Ti.API.info('incoming from oauth. calling Tent.authPostToken');
				Alloy.Globals.tent.authPostToken({
					'url' : Ti.App.getArguments()['url'],
					'parts' : parts
				}, function(e) {
					if (e.error) {
						alert('authorization failed: ' + e.error);
					} else {
						Ti.App.fireEvent('tentAuthFinished', e);
					}
				});
				setTimeout(function(){
					Alloy.Globals.loading.hide();
				}, 8000);
			} else {
				Ti.API.info('skywriter opened by URI: ' + Ti.App.getArguments()['url']);
				Ti.API.info(JSON.stringify(parts, null, '  '));
				setTimeout(function(){
					Alloy.Globals.loading.hide();
				}, 2000);
			}
		}
		else{
			setTimeout(function(){
				Alloy.Globals.loading.hide();
			}, 2000);
		}
	}, 120);
};

Ti.App.addEventListener('resume', URIListener);

quitters.fetch();

Alloy.Globals.relsviews = {};
Alloy.Globals.windows = {};
Alloy.Globals.cursor = {};
_.each(quitters.toJSON(), function(acct) {
	Alloy.Globals.skywriter.fetchCursor(acct.entity);
	Alloy.Globals.skywriter.relsViews(acct.entity);
});
