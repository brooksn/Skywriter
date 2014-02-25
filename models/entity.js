exports.definition = {
	config:{
		"columns": {
			"entity": "TEXT PRIMARY KEY",
			"name": "TEXT",
			"avatar": "TEXT",
			"bio": "TEXT",
			"website": "TEXT",
			"location": "TEXT",
			/* For a single-account app:
			"isend_statuses": "Bool",
			"iget_statuses": "Bool",
			*/
			"local_avatar": "TEXT",
			"retrieved": "datetime"
		},
		"defaults":{
			"entity": "",
			"name": "",
			"avatar": "",
			"bio": "",
			"website": "",
			"location": "",
			"local_avatar": "",
			"retrieved": ""
		},
		"adapter": {
			"type": "sql",
			"collection_name": "entities",
			"idAttribute": "entity"
		}
	}
};
