exports.definition = {
	config:{
		"columns": {
			"rowid": "INTEGER PRIMARY KEY AUTOINCREMENT",
			"post_id": "TEXT",
			"received_at": "TEXT",
			"entity": "TEXT",
			"reposter": "TEXT",
			"account": "TEXT",
			"feed_name": "TEXT",
			"type": "TEXT",
			"text": "TEXT",
			"location": "TEXT",
			"refs": "TEXT",
			"mentions": "TEXT",
			"public": "BOOL",
			"app_url": "TEXT",
			"next_page": "TEXT"
		},
		"defaults":{
			"public": true,
		},
		"adapter": {
			"type": "sql",
			"collection_name": "statusfeeds",
			"idAttribute": "rowid"
		}
	}
};
