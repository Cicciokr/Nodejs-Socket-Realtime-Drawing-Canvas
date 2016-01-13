var express = require('express');
var router = express.Router();
//var session = require('express-session');

/* GET home page. */
router.get('/', function(req, res) {
	var sess=req.session;
	if(sess.username)
	{
		res.redirect('/drawing');
	} else {
		
		res.render('index', { title: 'Welcome Drawing Map App' });
	}
});

router.post('/', function(req, res) {
	var sess=req.session;
	//In this we are assigning email to sess.email variable.
	//email comes from HTML page.
	sess.room=req.body.room;
	sess.username=req.body.username;
	sess.token="jdhjkfdshkfj";
	
	
	res.redirect('/drawing');
});

router.get('/drawing', function(req, res) {
	var sess=req.session;
	console.log("sessione:", sess);
	if(sess.username)
	{
		res.render('drawing', { title: 'Welcome Drawing Map App', username: sess.username, room: sess.room });
	} else {	
		res.redirect('/');
	}
});

module.exports = router;
