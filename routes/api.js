/* var express = require('express');
var router = express.Router();
//var User = require('./models/user');
var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'cicciokr'
});

connection.query('CREATE DATABASE IF NOT EXISTS drawingapp', function(err, rows) {		
				console.log("error:", err);
				console.log("rows:", rows);
});
connection.query('USE drawingapp');

connection.query('CREATE TABLE IF NOT EXISTS users (user_id int NOT NULL AUTO_INCREMENT, name VARCHAR(100), PRIMARY KEY(user_id))', function(err, rows) {		
				console.log("error:", err);
				console.log("rows:", rows);
});  

router.route('/users')

    // create a post (accessed at POST /api/users)
    .post(function(req, res) {
			console.log("req:", req);
			connection.query('INSERT INTO users SET name = "'+req.body.name+'"', function(err, rows) {
				if(err) res.send(err);
				connection.query('SELECT * FROM users WHERE user_id = LAST_INSERT_ID()', function(err, user){
					//res.writeHead(200, { 'Content-Type': 'application/json' });
					res.json({ message: 'User created!', state: 200, user: user });
				});
				
			});
			// req.body.name
            /*if (err)
                res.send(err);

            res.json({ message: 'Bear created!' });*/
    /*});

router.route('/users/:user_id')

    // get the user with that id (accessed at GET /api/users/:user_id)
    .get(function(req, res) {
		connection.query('SELECT * FROM users WHERE user_id = '+req.params.user_id+'', function(err, rows){
			console.log("error:", err);
			console.log("rows:", rows);
			if(err) res.send(err);
			
			res.json({users : rows});
		});
        //req.params.user_id
        /*    if (err)
                res.send(err);
            res.json(bear);*/
    /*})

	.delete(function(req, res) {
		connection.query('DELETE FROM users WHERE user_id = '+req.params.user_id+'', function(err, rows){
			console.log("error:", err);
			console.log("rows:", rows);
			if(err) res.send(err);
			
			res.json({message : 'User deleted!'});
		});
        //req.params.user_id
        /*    if (err)
                res.send(err);
            res.json(bear);*/
    /*});


module.exports = router; */