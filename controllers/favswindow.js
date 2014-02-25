var args = arguments[0] || {};
$.favswindow.account = args.account;
var tctrlstring = Ti.UI.iOS.createAttributedString({
	text: '⭐️Favorites\n' + args.account,
	attributes: [
		{
			type: Ti.UI.iOS.ATTRIBUTE_FONT,
			value: {fontSize: 10},
			range: [11, args.account.length+1]
		}
	]
});
var tctrl = Ti.UI.createLabel({
	color: 'white',
	textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
	attributedString: tctrlstring
});
$.favswindow.setTitleControl(tctrl);
var feedview = Alloy.createController('feedview', {
		'account': args.account,
		'setcursor': false,
		'justrefs': true,
		'feedname': 'favorites',
		'endpoint': 'posts_feed',
		'endpointparams': {
			'types': [
				Ti.Network.encodeURIComponent('https://tent.io/types/favorite/v0#https://tent.io/types/status/v0')
			],
			'max_refs': 4,
			'entities': [
				Ti.Network.encodeURIComponent(args.account)
			]
		}
	}).getView();
$.favswindow.add(feedview);

function winClose(){
	feedview.fireEvent('winclose');
}
