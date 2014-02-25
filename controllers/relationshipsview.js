var args = arguments[0] || {};
var discoverlist = {};
var fetchparams = {
	query: 'SELECT * FROM relationships WHERE iget=1 OR isend=1 ORDER BY display_name ASC',
	success: function(s){
		$.refresh.endRefreshing();
	},
	error: function(e){
		$.refresh.endRefreshing();
	}
};
var rels = Alloy.Collections.relationship;
function rfetch(){
	rels.fetch(fetchparams);
}
var throttledFetch = _.throttle(rfetch, 2000, {leading: false});
var discover = function(post){
	Alloy.Globals.skywriter.discover({
		account: args.account,
		discover: post.entity,
		entity: post.entity
	}, function(e){
		Ti.API.info('feedview discover got this:' + JSON.stringify(e));
		throttledFetch();
	});
	
};
function discoverAll(){
	for(var key in discoverlist){
		discover({entity: key});
	}
	discoverlist = {};
};
var discoverOnce = _.once(discoverAll);
var refresh = _.throttle(function(){
	var refreshparams = fetchparams;
	refreshparams.success = function(s){
		_.defer(discoverOnce);
		$.refresh.endRefreshing();
	};
	rels.fetch(refreshparams);
}, 400);
refresh();
function discover(entity){
	Alloy.Globals.skywriter.discover({
		account: args.account,
		discover: entity
	}, function(e){
		Ti.API.info('rels discover got this:' + JSON.stringify(e));
		refresh();
	});
	
}
function rowClick(e){
	var item = $.list.sections[e.sectionIndex].getItemAt(e.itemIndex);
	$.relationships.fireEvent('entityclick', {
		entity:item.entity.entity,
		name: item.entity.text
	});
}
function doTransform(model) {
	var o = model.toJSON();
	o.template='fullItem';
	o.image='skysquare.png';
	if(o.local_avatar && o.local_avatar.length>1){
		o.image=Titanium.Filesystem.applicationDataDirectory + o.local_avatar;
	}
	else{
		discoverlist[o.entity] = true;
	}
	if(!o.display_name || o.display_name === 'xxxx_sw'){
		o.display_name=o.entity;
		o.searchabletext = o.entity;
	}
	else{
		o.searchabletext = o.entity + ' ' + o.display_name;
	}
	Ti.API.info(o.entity + ' isend: ' + o.isend + ' iget: ' + o.iget);
	if(o.isend==='1' && o.iget==='1'){
		o.template = 'dual';
	}
	else if(o.isend==='1'){
		o.template = 'isend';
	}
	else{
		o.template = 'iget';
	}
	return o;
}
function filterFunction(collection) {
    return collection.where({account:args.account});
}
