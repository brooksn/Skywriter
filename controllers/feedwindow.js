var args = arguments[0] || {};
$.feedwindow.account = args.account;
var tctrlstring = Ti.UI.iOS.createAttributedString({
	text : 'Status Feed\n' + args.account,
	attributes : [{
		type : Ti.UI.iOS.ATTRIBUTE_FONT,
		value : {
			fontSize : 10
		},
		range : [11, args.account.length + 1]
	}]
});
var tctrl = Ti.UI.createLabel({
	color : 'white',
	textAlign : Ti.UI.TEXT_ALIGNMENT_CENTER,
	attributedString : tctrlstring
});
$.feedwindow.setTitleControl(tctrl);
var feedview = Alloy.createController('feedview', {
	'account' : args.account,
	'setcursor' : true,
	'feedname' : 'statusfeed',
	'endpoint' : 'posts_feed',
	'endpointparams' : {
		'types' : Alloy.Globals.feedtypes,
		'max_refs' : 4
	},
}).getView();
$.feedwindow.add(feedview);
function openComposeWin(e) {
	Ti.App.fireEvent('openwindow', {
		"window" : e.source.window,
		"account" : args.account
	});
}

function winClose() {
	feedview.fireEvent('winclose');
}
