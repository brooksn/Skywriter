var discoverdialog = Ti.UI.createAlertDialog({
	title : "Entity",
	style : Ti.UI.iPhone.AlertDialogStyle.PLAIN_TEXT_INPUT,
	buttonNames : ['discover', 'cancel']
});
discoverdialog.addEventListener('click', function(e) {
	Ti.API.info('discoverdialog: ');
	Ti.API.info('length: ' + e.text.length);
	Alloy.Globals.tent.discoverEndpoint({
		account : '',
		discover : e.text
	}, function(discovered) {
		Ti.API.info('discovered:');
		Ti.API.info(JSON.stringify(discovered, null, '  '));
	});
});
function discoverTest() {
	discoverdialog.show();
};
function deleteRels() {
	var feedb = Ti.Database.open('_alloy_');
	try {
		var deleterels = feedb.execute('DELETE FROM relationships');
		alert('deleted all rels');
	} catch(error) {
		alert('delete error.');
	}
	feedb.close();
}

function deleteEntities() {
	var feedb = Ti.Database.open('_alloy_');
	try {
		var deleteentities = feedb.execute('DELETE FROM entities');
		alert('deleted all entities');
	} catch(error) {
		alert('delete error.');
	}
	feedb.close();
}

function deleteDummies() {
	var feedb = Ti.Database.open('_alloy_');
	try {
		var deleterels = feedb.execute('DELETE FROM accounts WHERE hawkid="dummy"');
		alert('deleted dummies.');
	} catch(error) {
		alert('delete error.');
	}
	feedb.close();
}

function bgMentions() {
	Alloy.Globals.skywriter.background();
}

function testPost() {
	Alloy.Globals.tent.sendRequest({
		postjson : {
			type : 'https://tent.io/types/status/v0#',
			content : {
				text : 'test.'
			},
			permissions : {
				public : false
			}
		},
		endpoint : 'new_post',
		account : ''
	}, function(callback) {
		Ti.API.info(JSON.stringify(callback));
		alert('posted.');
	});
};
