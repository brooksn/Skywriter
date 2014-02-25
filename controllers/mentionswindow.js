var args = arguments[0] || {};
$.mentionswindow.account = args.account;
var tctrlstring = Ti.UI.iOS.createAttributedString({
	text : 'Mentions\n' + args.account,
	attributes : [{
		type : Ti.UI.iOS.ATTRIBUTE_FONT,
		value : {
			fontSize : 10
		},
		range : [8, args.account.length + 1]
	}]
});
var tctrl = Ti.UI.createLabel({
	color : 'white',
	textAlign : Ti.UI.TEXT_ALIGNMENT_CENTER,
	attributedString : tctrlstring
});
$.mentionswindow.setTitleControl(tctrl);
var feedview = Alloy.createController('feedview', {
	'account' : args.account,
	'setcursor' : false,
	'feedname' : 'mentions',
	'endpoint' : 'posts_feed',
	'endpointparams' : {
		'types' : [Ti.Network.encodeURIComponent('https://tent.io/types/status/v0'), Ti.Network.encodeURIComponent('https://tent.io/types/status/v0#reply')],
		'max_refs' : 4,
		'mentions' : [args.account]
	}
}).getView();
$.mentionswindow.add(feedview);

function winClose() {
	feedview.fireEvent('winclose');
}
