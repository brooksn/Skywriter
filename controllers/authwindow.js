$.entityfield.setAutocapitalization(Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE);
$.entityfield.setKeyboardType(Titanium.UI.KEYBOARD_URL);
$.entityfield.setReturnKeyType(Titanium.UI.RETURNKEY_GO);
$.entityfield.setSuppressReturn(false);

function authclick() {
	Alloy.Globals.loading.show('Authorizing', false);
	Alloy.Globals.tent.authorize({
		'entity' : $.entityfield.value,
		'app' : Alloy.Globals.appcredentials
	}, function(e) {
		Ti.API.info('authclick: ' + JSON.stringify(e, null, '  '));
		if (e.success) {
			alert('You have been successfully authenticated.');
		}
		else{
			alert('Authentication failed.');
		}
		Alloy.Globals.loading.hide();
	});
};

function dummyClick() {
	var timestamp = Math.round(+new Date() / 1000);
	var account = Alloy.createModel('account', {
		entity : 'https://' + timestamp,
		tempid : 'dummy',
		tempkey : 'dummy',
		hawkid : 'dummy',
		hawkkey : 'dummy',
		hawkalgo : 'sha256',
		authorized : true

	});

	account.save();
	Ti.API.info('dummy saved: ' + JSON.stringify(account.toJSON(), null, '  '));
	Ti.App.fireEvent('addaccount', {
		entity : 'https://' + timestamp,
	});

};

function authFinish(e) {
	Ti.API.info('authFinish: ' + JSON.stringify(e, null, '  '));
	Ti.App.fireEvent('addaccount', {
		entity : e.account,
	});
	Alloy.Globals.skywriter.discoverRels([{
		entity : e.account
	}]);
	Alloy.Globals.loading.hide();
};
Ti.App.addEventListener('tentAuthFinished', authFinish);
