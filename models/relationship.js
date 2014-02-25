exports.definition = {
	config:{
		"columns": {
			"combo": "TEXT PRIMARY KEY",
			"entity": "TEXT",
			"account": "TEXT",
			"type": "TEXT",
			"display_name": "TEXT",
			"local_avatar": "TEXT",
			"isend": "Bool",
			"iget": "Bool"
		},
		"defaults":{
			"combo": "",
			"entity": "",
			"account": "",
			"type": "",
			"display_name": "xxxx_sw",
			"local_avatar": "",
			"isend": false,
			"iget": false
		},
		"adapter": {
			"type": "sql",
			"collection_name": "relationships",
			"idAttribute": "combo"
		}
	}
};
