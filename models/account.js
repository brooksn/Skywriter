exports.definition = {
	config:{
		"columns": {
			"entity": "TEXT PRIMARY KEY",
			"encoded_uri": "TEXT",
			"authorized": "Bool",
			"appid": "TEXT",
			"tempid": "TEXT",
			"tempkey": "TEXT",
			"tempalgo": "TEXT",
			"hawkid": "TEXT",
			"hawkkey": "TEXT",
			"hawkalgo": "TEXT",
			"mentionscursor": "TEXT"
		},
		"defaults": {
			"entity": "",
			"encoded_uri": "",
			"authorized": false,
			"appid": "",
			"tempid": "",
			"tempkey": "",
			"tempalgo": "",
			"hawkid": "",
			"hawkkey": "",
			"hawkalgo": "",
			"mentionscursor": "0"
		},
		"adapter": {
			"type": "sql",
			"collection_name": "accounts",
			"idAttribute": "entity"
		}
	}
};
