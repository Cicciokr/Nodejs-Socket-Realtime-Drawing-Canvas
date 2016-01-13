var refNodeCache = require("node-cache");
var nodeCache = new refNodeCache( { stdTTL: 100, checkperiod: 120 } );
var LINQ = require("node-linq").LINQ;

var Clients = {
	username: "",
	room: "",
	lastupdate: 0,
	firstaccess: true,
	cacheKey: "clients",
	addClient: function(username, room, lastupdate, firstaccess)
	{
		this.username = username;
		this.room = room;
		this.lastupdate = lastupdate;
		this.firstaccess = firstaccess;
		return { username: this.username, room: this.room, lastupdate: this.lastupdate, firstaccess: this.firstaccess }
	},
	getClients: function() {
        var clientsCache = nodeCache.get(this.cacheKey);
        if(clientsCache == null) clientsCache = [];
		return clientsCache;
	},
	getOtherClient: function(username)
	{
		var clientsCache = this.getClients();
        
		var clients = new LINQ(clientsCache).Where(function(client) { return (client.username != username); }).Select(function(client) {return client;}).ToArray();
		return clients;
	},
	getClient: function(username)
	{
		var clientsCache = this.getClients();
		var client = new LINQ(clientsCache).Where(function(client) { return (client.username == username); }).Select(function(client) {return client;}).Single();
		return client;
	},
	updateClients: function(clientsObj)
	{
		return nodeCache.set(this.cacheKey, clientsObj);
	}
};

module.exports = Clients;