var args = arguments[0] || {};
var parent = args.parent;
function resetCaret(){
	$.mentionscount.setText('');
	$.mentionscount.hide();
	$.caret.show();
}
function openWindow(e) {
	if(e.source.window === 'mentionswindow'){
		_.defer(resetCaret);
	}
	Ti.App.fireEvent('openwindow', {
		"window" : e.source.window,
		"account" : e.source.account
	});
};
function checkMentions(e){
	try{
		var account = Alloy.createModel('account');
		account.fetch({query: 'SELECT * FROM accounts WHERE entity="' + $.account.account + '"'});
		var acctjson = account.toJSON();
		if(Alloy.Globals.cursor[acctjson.entity] && Alloy.Globals.cursor[acctjson.entity].received_at){
			if(parseInt(Alloy.Globals.cursor[acctjson.entity].received_at)>acctjson.mentionscursor){
				acctjson.mentionscursor=Alloy.Globals.cursor[acctjson.entity].received_at;
			}
			var request = {
				account : acctjson.entity,
				endpoint : 'posts_feed',
				method : 'GET',
				endpointparams : {
					types : [Ti.Network.encodeURIComponent('https://tent.io/types/status/v0'), Ti.Network.encodeURIComponent('https://tent.io/types/status/v0#reply')],
					mentions : [acctjson.entity],
					since: parseInt(acctjson.mentionscursor)
				}
			};
			Alloy.Globals.tent.sendRequest(request, function(mentionscallback){
				if(mentionscallback.success){
					acctjson.mentionscursor = '' + parseInt(new Date().getTime());
					if(mentionscallback.body.posts.length>0){
						$.caret.hide();
						$.mentionscount.setText(mentionscallback.body.posts.length);
						$.mentionscount.show();
						var notification = Ti.App.iOS.scheduleLocalNotification({
							date: new Date(new Date().getTime()+3000),
							alertBody: mentionscallback.body.posts.length + ' new mentions to ' + acctjson.entity
						});
						_.defer(function(){
							var update = Alloy.Collections.instance('post');
							update.fetch({
								account: acctjson.entity,
								setcursor: false,
								feedname: 'mentions',
								refresh: true,
								endpoint: 'posts_feed',
								endpointparams : {
									types : [Ti.Network.encodeURIComponent('https://tent.io/types/status/v0'), Ti.Network.encodeURIComponent('https://tent.io/types/status/v0#reply')],
									max_refs : 4,
									mentions : [acctjson.entity]
								}
							});
						});
					}
					account.save({
						mentionscursor : acctjson.mentionscursor
					});
				}
				if(e){
					Ti.App.iOS.endBackgroundHandler(e.handlerId);
				}
			});
		}
	} catch(error){
		if(e){
			Ti.App.iOS.endBackgroundHandler(e.handlerId);
		}
	}
}
Ti.App.iOS.addEventListener('backgroundfetch', checkMentions);
