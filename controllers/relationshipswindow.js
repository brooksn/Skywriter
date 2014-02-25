var args = arguments[0] || {};
$.relationshipswindow.account = args.account;
$.metacard.bringToFront();
var tctrlstring = Ti.UI.iOS.createAttributedString({
	text : 'Friends\n' + args.account,
	attributes : [{
		type : Ti.UI.iOS.ATTRIBUTE_FONT,
		value : {
			fontSize : 10
		},
		range : [7, args.account.length + 1]
	}]
});
var tctrl = Ti.UI.createLabel({
	color : 'white',
	textAlign : Ti.UI.TEXT_ALIGNMENT_CENTER,
	attributedString : tctrlstring
});
$.relationshipswindow.setTitleControl(tctrl);

function relsClick(e) {
	$.metacard.init({
		entity : e.entity
	});
	$.metacard.show();
}

setTimeout(function() {
	_.defer(function(x) {
		$.relationshipswindow.add(x);
		x.addEventListener('entityclick', relsClick);
	}, Alloy.Globals.relsviews[args.account]);
}, 25);
$.relationshipswindow.addEventListener('close', function(e) {
	Alloy.Globals.relsviews[args.account].removeEventListener('entityclick', relsClick);
	$.destroy();
});
