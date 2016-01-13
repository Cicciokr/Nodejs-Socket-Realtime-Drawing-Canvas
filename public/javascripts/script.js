/* author Francesco Pantisano */
$(function () {

	// This demo depends on the canvas element
	if (!('getContext' in document.createElement('canvas'))) {
		alert('Sorry, il tuo browser non supporta i canvas!');
		return false;
	}

	// The URL of your web server (the port is set in app.js)
	var url = 'http://nodejs.francescopantisano.it/drawing';

	var doc = $(document),
		win = $(window),
		canvas = $('#paper'),
		ctx = canvas[0].getContext ? canvas[0].getContext('2d') : null,
		img = document.createElement('img'),
		instructions = $('#instructions');


	// Generate an unique ID
	//var id = Math.round($.now() * Math.random());
	// A flag for drawing activity
	var firstaccess = true;
	var drawing = false;
	var dragging = true;
	var lastAction = null;
	var canDraw = false;
	var strokestyleInit = "#ff0000";
	var linewidthInit = 2;
	var oldstrokestyleInit = "#ff0000";
	var oldlinewidthInit = 2;

	var clients = {};
	var cursors = {};
	var checkboxClient = {};

	var mouseX = null;
	var mouseY = null;
	var originx = 0;
	var originy = 0;
	var scale = 1;
	var prev = {};
	//var rect = canvas[0].getBoundingClientRect();
	var rect = canvas.offset();
	var zoom = 1;

	/*checkboxClient[id] = $('<div class="checkboxClient"><input type="checkbox" class="singleCheckClient" name="scritte-' + id + '" checked>Layer di ' + id + '</div>').appendTo('#checkboxClients');*/
	/*canvas.addLayer({
  name: 'mappa',
		index: 0
}).addLayer({
  name: 'scritte',
		index: 1
}).drawLayers();*/

	canvas.drawImage({
		source: '/images/map/cuorenero.jpg',
		name: 'mappa',
		layer: true,
		x: 0,
		y: 0,
		width: 1070,
		height: 674,
		fromCenter: false,
		draggable: false
	});

	$("#saveStrategy").on("click", function () {
		var image = new Image();
		image.src = canvas[0].toDataURL("image/png");
		//src contain all base64
        window.open(image.src, '_blank');
		//window.location = image.src;
	});

	$("#addAvatar").on("click", function () {
		var idrand = Math.round($.now() * Math.random());
		canvas.drawImage({
			name: 'avatar-' + idrand,
			groups: ['allAvatar'],
			source: 'http://heroesofthestormitalia.com/wp-content/images/icon/iconsmall/abathur-new.png',
			x: 80,
			y: 80,
			layer: true,
			index: 2,
			width: 35,
			height: 50,
			fromCenter: false,
			draggable: true,
			dragstop: function (layer) {
				dragAvatar(layer);
			}
		});
	});

	/* menu action */
	$('#lineWidth').on('change', function () {
		linewidthInit = this.value;
	});

	$('#dragMap').on('click', function () {
		action("drag", true);
	});

	$('.writeMap').on('click', function () {
        strokestyleInit = $(this).data("color");
		action("write", true);
	});

	$('#checkboxClients').on('change', '.singleCheckClient', function () {
		console.log($(this).attr('name'));
		if (!$(this).is(":checked")) {
			//tolgo la visibilità del layer
			hideLayer($(this).attr('name'), false);
		} else {
			//metto visibilità del layer
			hideLayer($(this).attr('name'), true);
		}
	});
	/* end action menu */

	/* start socket */
	var socket = io.connect(url, {
    	'reconnection': true,
    	'reconnectionDelay': 1000,
    	'reconnectionDelayMax' : 5000,
    	'reconnectionAttempts': 5,
		'flash policy port': 10843
	});
    //var socket = io.connect();
	socket.on("connect", function () {
		socket.emit('user_join', {username: username, room: room, firstaccess: firstaccess });
		firstaccess = false;
	});
    
	socket.on("leave", function (data) {
		console.log("client leave", data);
		delete cursors[data.username];
		delete checkboxClient[data.username];
	});

	socket.on('add_client', function (data) {
		
			var idUser = data.username;
			if (!(idUser in clients)) {
				console.log("registro nuovo utente", idUser);
				// a new user has come online. create a cursor for them
				if(idUser != username) {
					cursors[idUser] = $('<div class="cursor">' + idUser + '</div>').appendTo('#cursors');
				}
				checkboxClient[idUser] = $('<div class="checkboxClient"><input type="checkbox" class="singleCheckClient" name="scritte-' + idUser + '" checked>Layer di ' + idUser + '</div>').appendTo('#checkboxClients');
				clients[idUser] = data;
			}
	});
	
	socket.on('leave_client', function (data) {
		
			var idUser = data.username;
			if (idUser in clients) {
				cursors[idUser].remove();
				checkboxClient[idUser].remove();
				delete clients[idUser];
				delete cursors[idUser];
				delete checkboxClient[idUser];
			}
	});
	
	socket.on('moving', function (data) {

		// Move the mouse pointer
		var idUser = data.username;
		
 		if (!(idUser in clients)) {
			console.log("registro nuovo utente", idUser);
			// a new user has come online. create a cursor for them
			
			if(idUser != username) {
				cursors[idUser] = $('<div class="cursor">' + idUser + '</div>').appendTo('#cursors');
			}
			checkboxClient[idUser] = $('<div class="checkboxClient"><input type="checkbox" class="singleCheckClient" name="scritte-' + idUser + '" checked>Layer di ' + idUser + '</div>').appendTo('#checkboxClients');
		}
		
			
			console.log("moving");
			cursors[idUser].css({
				'left': data.x,
				'top': data.y
			});

			// Is the user drawing?
			if (data.drawing && clients[idUser]) {

				// Draw a line on the canvas. clients[data.id] holds
				// the previous position of this user's mouse pointer
				console.log("moving drawline");
				drawLine(clients[idUser].x, clients[idUser].y, data.x, data.y, data.linewidth, data.strokestyle, idUser);
			}

			// Saving the current client state
			clients[idUser] = data;
			clients[idUser].updated = $.now();
		

	});

	canvas.on('mousedown', function (e) {
		console.log("drawing", drawing);
		e.preventDefault();
		mouseX = e.clientX - rect.left;
		mouseY = e.clientY - rect.top;
		drawing = (canDraw) ? true : false;
		prev.x = mouseX;
		prev.y = mouseY;
	});

	canvas.on('mousewheel', function (event, delta) {
		var mousex = event.clientX - canvas.offsetLeft;
		var mousey = event.clientY - canvas.offsetTop;
		//var wheel = event.deltaFactor/120;//n or -n
		console.log("delta", delta);
		var wheel = event.wheelDelta ? event.wheelDelta / 40 : event.detail ? -event.detail : 0;

		canvas.saveCanvas();

		zoom = Math.pow(1.1, delta);

		console.log(zoom);
		canvas.translateCanvas({
			translateX: originx,
			translateY: originy
		}).scaleCanvas({
			scaleX: zoom,
			scaleY: zoom
		}).translateCanvas({
			translateX: -(mousex / scale + originx - mousex / (scale * zoom)),
			translateY: -(mousey / scale + originy - mousey / (scale * zoom))
		}).drawLayers();

		originx = (mousex / scale + originx - mousex / (scale * zoom));
		originy = (mousey / scale + originy - mousey / (scale * zoom));
		scale *= zoom;

		console.log("drawmap mouse wheel");
		//canvas.css("-webkit-transform", "scale("+zoom+")");
		canvas.restoreCanvas();
	});

	doc.bind('mouseup mouseleave', function () {
		drawing = false;
	});

	var lastEmit = $.now();

	doc.on('mousemove', function (e) {
		if ($.now() - lastEmit > 30) {

			mouseX = e.clientX - rect.left;
			mouseY = e.clientY - rect.top;
            console.log("mouse moving socket");
			socket.emit('mousemove', {
				'x': mouseX / scale,
				'y': mouseY / scale,
				'username': username,
				'drawing': drawing,
				'linewidth': linewidthInit,
				'strokestyle': strokestyleInit
			});
			lastEmit = $.now();
		}

		// Draw a line for the current user's movement, as it is
		// not received in the socket.on('moving') event above

		if (drawing) {

			drawLine(prev.x / scale, prev.y / scale, mouseX / scale, mouseY / scale, linewidthInit, strokestyleInit, username);

			prev.x = mouseX;
			prev.y = mouseY;

		}
	});

	$('#switchBtn').on('click', function () {
		socket.emit('switchroom', {
			'newroom': $("input[name='switchroom']").val()
		});
	});
	// Remove inactive clients after 10 seconds of inactivity
	setInterval(function () {
		console.log("interval");
		for (var ident in clients) {
			if ($.now() - clients[ident].updated > 10000) {

				// Last update was more than 10 seconds ago. 
				// This user has probably closed the page

				cursors[ident].remove();
				checkboxClient[ident].remove();
				delete clients[ident];
				delete cursors[ident];
				delete checkboxClient[ident];
			}
		}

	}, 20000);

	function drawLine(fromx, fromy, tox, toy, linewidth, strokestyle, username) {

		canvas.drawLine({
			strokeStyle: strokestyle,
			strokeWidth: linewidth,
			layer: true,
			x1: fromx,
			y1: fromy,
			x2: tox,
			y2: toy,
			closed: (strokestyle != oldstrokestyleInit) ? true : false,
			rounded: true,
			index: 3,
			groups: ['allScritte', 'scritte-' + username]
		}).drawLayers();

	}

	function action(actions, value) {
		console.log("action", actions, "value", value);
		/* setto a false le varie azioni */
		canDraw = false;
		dragMap(false);
		canvas.removeClass();
        //&& $("a." + actions).hasClass("active")
		//if (lastAction == actions) value = false;

		switch (actions) {
		case "write":
			if (value) {
				canDraw = true;
				canvas.addClass('pen-cursor');
			}
			break;
		case "drag":
			if (value) {
				canvas.addClass('drag-cursor');
				dragMap(true);
			}
			break;
		}

		$("a.btn").each(function (index) {
			$(this).removeClass("active");
			if ($(this).hasClass(actions) && value) {
				$(this).addClass("active");
			}
		});

		lastAction = actions;
	}

	function dragMap(flagDrag) {
		if (!flagDrag) {
			dragging = false;
			canvas.setLayer('mappa', {
				draggable: false,
				dragGroups: []
			}).drawLayer('mappa');
			canvas.restoreCanvas();
		} else {
			dragging = true;
			canvas.setLayer('mappa', {
				draggable: true,
				dragGroups: ['allAvatar', 'allScritte']
			}).drawLayer('mappa');
		}
	}

	function hideLayer(layer, isvisible) {
		//nasconde o visualizza i layer
		canvas.setLayerGroup(layer, {
			visible: isvisible
		}).drawLayers();
	}

	function dragAvatar(layer) {
		//mando via socket i dati per il movimento dell'avatar
	}

});