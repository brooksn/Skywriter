var args = arguments[0] || {};
var parent = args.parent;
function openWindow(e) {
	Ti.App.fireEvent('openwindow', {
		"window" : e.source.window,
		"account" : e.source.account
	});
};
