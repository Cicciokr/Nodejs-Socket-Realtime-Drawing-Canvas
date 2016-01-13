var express = require('express');
var http = require('http');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var expressSession = require('express-session');

//model
var clientModel = require("./models/client.js");
var drawAction = require("./models/drawaction.js");

var routes = require('./routes/index');

var app = express();

// view engine setup
app.set('port', process.env.PORT || 5000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));

app.use(expressSession({
	secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));
console.log("session created");

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(cookieParser());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/drawing', routes);


// catch 404 and forward to error handler
/* app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
}); */

// error handlers

app.use(function (req, res, next) {
	
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
	
    next();
});

// production error handler
// no stacktraces leaked to user
/*app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});*/

// Enable Socket.io
var server = http.createServer(app).listen(app.get('port'));
var io = require('socket.io').listen( server );

var nsp = io.of('/drawing');

nsp.on('connection', function (socket) {
	
   socket.on('user_join', function(data) {
       //var room = data.room;
       var now = new Date().getTime();
       var registerRoomAction = [];
       var clients = [];
       var room = data.room;
       var username = data.username;
       socket.room = room;
       socket.username = username;
       socket.join(room);

       clients = clientModel.getOtherClient(username);
       console.log("clients:", clients);
       var timeUser = (data.firstaccess) ? 0 : now;
       var client = clientModel.addClient(username, room, timeUser, data.firstaccess);
       clients.push(client);
       clientModel.updateClients(clients);

       nsp.in(room).emit('add_client', {username: username});

       if(client !== null && client !== undefined && client.firstaccess)
       {
           var arrRoom = drawAction.getRoomAction(client, socket.room);
           console.log("arrRoom", arrRoom);
           for(var l=0;l<arrRoom.length;l++)
           {
               socket.emit('moving', arrRoom[l]);	
           }
       }
   });
	
   socket.on('error', function (err) { console.error(err); });
   socket.on('mousemove', function (data) {
		var room = socket.room;
	    var now = new Date().getTime();
		var registerRoomAction = [];
        //in the register room action save all written by the users
		
       registerRoomAction = drawAction.getRoomActionCache();
       registerRoomAction.push({ room: room, date: now, data: data});
       drawAction.updateRoomAction(registerRoomAction);
	   
        //send the moving event to all the client connected to the room
	   	socket.to(room).emit('moving', data);
    });
	
	socket.on('switchroom', function(data) {
        //to all client sayd that the socket leave room
		nsp.in(socket.room).emit('leave_client', {username: socket.username});
        //leave
		socket.leave(socket.room);
        //change
		socket.room = data.newroom;
        //join
		socket.join(socket.room);
        //to all client sayd that the socket join room
		nsp.in(socket.room).emit('add_client', {username: socket.username});
	});
    
    socket.on('disconnect', function(){      
	    nsp.in(socket.room).emit('leave_client', {username: socket.username});
		socket.leave(socket.room);
    });
	
});

module.exports = app;