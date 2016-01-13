var refNodeCache = require("node-cache");
var nodeCache = new refNodeCache( { stdTTL: 100, checkperiod: 120 } );
var LINQ = require("node-linq").LINQ;

var DrawAction = {
   cacheKey: "registerRoomAction",
   getRoomActionCache: function(){
     var drawCache = nodeCache.get(this.cacheKey);
     if(drawCache == null) drawCache = [];
     return drawCache;
   },
   getRoomAction: function(client, room) {
       var now = new Date().getTime();
       var registerRoomAction = this.getRoomActionCache();
       var arrRoom = new LINQ(registerRoomAction).Where(function(roomAction) { return (roomAction.room == room && roomAction.date > client.lastupdate && roomAction.date < now); }).OrderBy(function(roomAction) {return roomAction.date;}).Select(function(roomAction) {return roomAction.data;}).ToArray();
       return arrRoom;
   },
   updateRoomAction: function(roomAction) {
        return nodeCache.set(this.cacheKey, roomAction);
   }
};

module.exports = DrawAction;

