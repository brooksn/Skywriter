var args = arguments[0] || {};
$.compose.init({
	account : args.account
});
function relsClick(e) {
	alert(JSON.stringify(e));
	$.compose.addMention(e);
	$.relscontainer.hide();
}

function hideRels() {
	$.relscontainer.hide();
}

function mentionListener() {
	$.relscontainer.show();
}

$.compose.addEventListener('mention', mentionListener);

function rightButton() {
	$.compose.sendPost();
}

setTimeout(function() {
	_.defer(function(x) {
		$.relscontainer.add(x);
		x.addEventListener('entityclick', relsClick);
	}, Alloy.Globals.relsviews[args.account]);
}, 25);
$.composewin.addEventListener('close', function(e) {
	Alloy.Globals.relsviews[args.account].removeEventListener('entityclick', relsClick);
	$.destroy();
});
