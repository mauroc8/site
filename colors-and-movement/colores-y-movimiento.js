function _(query, context) {
	return (context||document).querySelector(query);
}
function __(query, context) {
	return Array.prototype.slice.call(
	         (context||document).querySelectorAll(query)
	       );
}
//

var canvas = _('#main-canvas');
var resizeCanvas = document.createElement('canvas');
canvas.width = resizeCanvas.width = window.innerWidth;
canvas.height = resizeCanvas.height = window.innerHeight;
var canvasContext=canvas.getContext('2d');
var resizeContext=resizeCanvas.getContext('2d');
window.onresize = function() {
	var w = window.innerWidth, h = window.innerHeight;
	if(w>resizeCanvas.width||h>resizeCanvas.height) {
		var cop=resizeCanvas;
		resizeCanvas=document.createElement('canvas');
		resizeCanvas.width = w;
		resizeCanvas.height = h;
		resizeContext = resizeCanvas.getContext('2d');
		resizeContext.fillStyle = _('input[type="color"]',options).value;
		resizeContext.fillRect(0,0,resizeCanvas.width,resizeCanvas.height);
		resizeContext.drawImage(cop,0,0);
	}
	resizeContext.clearRect(0,0,canvas.width,canvas.height);
	resizeContext.drawImage(canvas,0,0);
	document.body.removeChild(canvas);
	canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	canvasContext=canvas.getContext('2d');
	canvasContext.drawImage(resizeCanvas,0,0);
	canvas.style.position='absolute';
	document.body.appendChild(canvas);
	
	options.style.maxHeight = h + 'px';
}

//globals:
var startTime, lastTime, balls=[],
	mouse={x:0, y:0}, playing=false, colorPalette=[0,255,0,255,0,255],
	currentContext, //a pointer to the current context we are working on
	ctrlZCanvas=document.createElement('canvas'),
	ctrlZContext=ctrlZCanvas.getContext('2d');

window.onmousemove = function(event) {
	mouse.x = event.clientX;
	mouse.y = event.clientY;
}

function initialize(time) {
	startTime = lastTime = time;
	requestAnimationFrame(animate);
}
function animate(time) {
	if(playing==false)
		return;
	
	var frameTime = Math.min(time - lastTime, 300)/1000;
	var elapsedTime = (time - startTime)/1000;
	
	for(var i=0, l=balls.length; i<l; i++) {
		var ball = balls[i];
		drawBall(ball, frameTime, elapsedTime);
		//update position:
		var dx = mouse.x - ball.x;
		var dy = mouse.y - ball.y;
		var fric = Math.pow(1-ball.friction, frameTime*20);
		ball.vx = (ball.vx + dx*ball.attraction) * fric;
		ball.vy = (ball.vy + dy*ball.attraction) * fric;
		ball.x += ball.vx * frameTime;
		ball.y += ball.vy * frameTime;
	}
	
	lastTime = time;
	if(playing)
		requestAnimationFrame(animate);
}

function Ball(custom) {
	return Object.assign(Object.create(null), {
		'x': mouse.x,
		'y': mouse.y,
		'vx': 0,
		'vy': 0,
		'color': newRandomColor(colorPalette),
		'goingTo':newRandomColor(colorPalette),
		'attraction': 0.4, //How attracted to the mouse the ball is
		'friction': 0.1, //from 0 to 1.
		'size': 30, //radius
		'waveSize': 15, //this adds/substracts from radius - must not be greater than size
		'wavePeriod': 1, //divisor: Math.sin(elapsedTime/wavePeriod)
		'waveFunction': Math.sin
	}, custom);
}

function newRandomColor(palette) {
	// palette: [minR, maxR, minG, maxG, minB, maxB]
	// or [maxR, minR, maxG, minG, maxB, minB]
	return Object.assign(Object.create(null), {
		r: palette[0]+Math.floor(Math.random()*(palette[1]-palette[0])),
		g: palette[2]+Math.floor(Math.random()*(palette[3]-palette[2])),
		b: palette[4]+Math.floor(Math.random()*(palette[5]-palette[4])),
		a: palette[6]
	});
}

function drawBall(ball, frameTime, elapsedTime) {
	//change color gradually:
	var step = Math.floor(frameTime*70);
	var color = ball.color;
	var goingTo = ball.goingTo;
			 if(color.r < goingTo.r)	color.r += step;
	else if(color.r > goingTo.r)	color.r -= step;
	
			 if(color.g < goingTo.g)	color.g += step;
	else if(color.g > goingTo.g)	color.g -= step;
	
			 if(color.b < goingTo.b)	color.b += step;
	else if(color.b > goingTo.b)	color.b -= step;
	//
	if(Math.abs(color.r - goingTo.r) < step &&
	   Math.abs(color.g - goingTo.g) < step &&
	   Math.abs(color.b - goingTo.b) < step) {
		ball.color = color = goingTo;
		ball.goingTo = newRandomColor(colorPalette);
	}
	//draw:
	var $ = currentContext;
	if(color.a==1)
		$.fillStyle = 'rgb('+color.r+','+color.g+','+color.b+')';
	else
		$.fillStyle = 'rgba('+color.r+','+color.g+','+color.b+','+color.a+')';
	var radius = ball.size + ball.waveSize*ball.waveFunction(elapsedTime/ball.wavePeriod);
	$.beginPath();
	$.arc(ball.x, ball.y, radius, 0, 6.28);
	$.fill();
}

//Now the UI
var options = _('#options');

options.style.maxHeight = (window.innerHeight-30) + 'px';

//sync input[type="range"] with input[type="number"]
__('#color-palette input[type="range"]', options).forEach(function(input, i) {
	input.onchange = function() {
		__('#color-palette input[type="number"]',options)[i].value = this.value;
		previewPalette();
	}
});
__('#color-palette input[type="number"]', options).forEach(function(input, i) {
	input.onchange = function() {
		__('#color-palette input[type="range"]',options)[i].value = this.value;
		previewPalette();
	}
});

//balls
var add = _('tr:last-child', options);

_('td:last-child', add).onclick = function() {
	var clone = add.cloneNode(true);
	//add/remove
	var del = _('td:last-child', clone);
	del.textContent = '-remove';
	del.onclick = deleteThisBall;
	//up/down arrow buttons
	var first=_('td:first-child', clone);
	var div = createUpDownArrow();
	first.appendChild(div);
	
	_('#balls tbody', options).insertBefore(clone, add);
	_('td:first-child span', add).textContent = __('tr', options).length - 1;
	
	//autosave
	save();
}


function deleteThisBall() {
	var del = this.parentNode;
	del.className = 'delete';
	setTimeout(function() {
		del.parentNode.removeChild(del);
		save();
		setTimeout(updateNumbers,130);
	}, 230);
	//autosave
}

function updateNumbers() {
	var tr = __('tr', options);
	for(var i=1, l=tr.length-1;i<l;i++)
		_('td span', tr[i]).textContent = i;
	_('td:first-child span', add).textContent = __('tr', options).length - 1;
}

//up/down arrows
function drawUpArrow(canvas){
	canvas.width=canvas.height=8;
	var cx = canvas.getContext('2d');
	cx.beginPath();
	cx.moveTo(4,1);
	cx.lineTo(7,7);
	cx.lineTo(1,7);
	cx.fill();
}
function drawDownArrow(canvas) {
	canvas.width=canvas.height=8;
	var cx = canvas.getContext('2d');
	cx.beginPath();
	cx.moveTo(4,7);
	cx.lineTo(7,1);
	cx.lineTo(1,1);
	cx.fill();
}
function createUpDownArrow() {
	var up=document.createElement('canvas');
	drawUpArrow(up);
	var down = document.createElement('canvas');
	drawDownArrow(down);
	var div = document.createElement('div');
	up.onclick = moveUp;
	down.onclick = moveDown;
	div.appendChild(up);
	div.appendChild(down);
	return div;
}

function moveUp() {
	var tr = this;
	while(tr.tagName!=='TR')
		tr = tr.parentNode;
	if(tr.previousElementSibling!==_('tr:first-child',options)) {
		tr.className = 'delete';
		setTimeout(function() {
			if(tr.previousElementSibling!==_('tr:first-child',options))
				tr.parentNode.insertBefore(tr, tr.previousElementSibling);
			setTimeout(function() {
				tr.className = "";
				setTimeout(updateNumbers,230);
			},70);
		}, 230);
	}
}
function moveDown() {
	var tr = this;
	while(tr.tagName!=='TR')
		tr = tr.parentNode;
	if(tr.nextElementSibling!==_('tr:last-child',options)) {
		tr.className = 'delete';
		setTimeout(function() {
			if(tr.nextElementSibling!==_('tr:last-child',options))
				tr.parentNode.insertBefore(tr, tr.nextElementSibling.nextElementSibling);
			setTimeout(function() {
				tr.className = "";
				setTimeout(updateNumbers,230);
			},70);
		}, 230);
	}
}

//Save and Restore
function save() {
	var palette = __('input[type="range"]', options).map(input=>Number(input.value));
	localStorage.setItem('palette', JSON.stringify(palette));
	var balls = __('#balls tr:not(:first-child):not(:last-child)', options).map(function(tr) {
		return __('input', tr).map(inp=>inp.value);
	});
	localStorage.setItem('balls', JSON.stringify(balls));
	localStorage.setItem('background', _('input[type="color"]',options).value);
}
_('#fn-save',options).onclick=save;


function restore() {
	var palette = localStorage.getItem('palette');
	if(palette) {
		var range = __('input[type="range"]', options);
		var num = __('input[type="number"]', options);
		JSON.parse(palette).forEach(function(color, i) {
			range[i].value = num[i].value = color;
		});
	} else {
		randomize();
	}
	var balls = localStorage.getItem('balls');
	if(balls) {
		balls = JSON.parse(balls);
	} else {
		balls = [
			[30, 15, 1,   0.4, 0.1],
			[20,  5, 1.8, 0.8, 0.08],
			[10,  5, 2.6, 0.9, 0.06]
		];
	}
	
	balls.forEach(function(ball) {
		var clone = add.cloneNode(true);
		//add/delete
		var del = _('td:last-child', clone);
		del.textContent = '-remove';
		del.onclick = deleteThisBall;
		//up/down arrow buttons
		var first=_('td:first-child', clone);
		var div = createUpDownArrow();
		first.appendChild(div);
		//update input values
		__('input', clone).forEach(function(input, i) {
			input.value = ball[i];
		});
		
		_('#balls tbody', options).insertBefore(clone, add);
		_('td:first-child span', add).textContent = __('tr', options).length - 1;
	});
	var background = localStorage.getItem('background');
	if(background)
	   _('input[type="color"]',options).value = background;
}
restore();
canvasContext.fillStyle=_('input[type="color"]',options).value;
canvasContext.fillRect(0,0,canvas.width,canvas.height);

var tutorial;
if(localStorage.getItem('has-done-tutorial'))
	tutorial=false;
else {
	tutorial=document.createElement('div');
	tutorial.id = 'tutorial';
	tutorial.textContent='Click here --or anywhere-- to start drawing';
	document.body.appendChild(tutorial);
}

window.onclick = function(event) {
	if(event.button!==0)
		return;
	if(event.target===canvas||event.target===tutorial) {
		if(tutorial) {
			setTimeout(_=>tutorial.textContent='Then click again to stop',100);
		}
		playing = !playing;
		if(playing) {
			options.className = 'delete';
			colorPalette = __('input[type="range"]',options).map(inp=>Number(inp.value));
			balls = __('tr:not(:first-child):not(:last-child)',options).map(function(tr) {
				var inp = __('input',tr).map(inp=>Number(inp.value));
				return Ball({
					'size': inp[0],
					'waveSize': inp[1],
					'wavePeriod': inp[2],
					'attraction': inp[3],
					'friction': inp[4]
				});
			});
			saveCtrlZCopy();
			currentContext = canvasContext;
			requestAnimationFrame(initialize);
			setTimeout(_=>options.style.display='none', 230);
		} else {
			options.style.display='block';
			if(tutorial) {
				tutorial.className='delete';
				setTimeout(_=>document.body.removeChild(tutorial),230);
				tutorial=false;
				localStorage.setItem('has-done-tutorial', 'true');
			}
			setTimeout(_=>options.className = '',0);
		}
	}
}

//randomize color palette
function randomize() {
	var numb = __('#color-palette input[type="number"]',options);
	__('#color-palette input[type="range"]:not(.alpha)',options).forEach(function(input,i) {
		var rand = Math.floor(Math.random()*256);
		input.value = numb[i].value = rand;
	});
	previewPalette();
}
_('#fn-randomize',options).onclick=randomize;

var previewCanvas = _('#preview-canvas');
var previewContext = previewCanvas.getContext('2d');

function previewPalette() {
	var w = previewCanvas.width;
	var h = previewCanvas.height;
	//
	var palette = __('input[type="range"]',options).map(inp=>Number(inp.value));
	for(var i=0;i<6;i+=2) {
		var a = palette[i];
		var b = palette[i+1];
		if(a>b) {
			palette[i] = b;
			palette[i+1] = a;
		}
	}
	//
	var redRange = palette[1]-palette[0];
	var greenRange = palette[3]-palette[2];
	var blueRange = palette[5]-palette[4];
	for(var y=0; y<4;y++) {
		var redPlus = y * redRange/3;
		var red = Math.floor(palette[0] + redPlus);
		for(var x=0; x<4;x++) {
			var greenPlus = x * greenRange/3;
			var green = Math.floor(palette[2] + greenPlus);
			for(var z=0;z<4;z++) {
				var bluePlus = z * blueRange/3;
				var blue = Math.floor(palette[4] + bluePlus);
				previewContext.fillStyle = 'rgb('+red+','+green+','+blue+')';
				var zAddsToX = z%2 ? w/8 : 0;
				var zAddsToY = z>1 ? h/6 : 0;
				previewContext.fillRect(x*w/4 + zAddsToX, y*h/3 + zAddsToY,
				                        w/8, h/6);
			}
		}
	}
}
previewPalette();

var optionsWindow=null;

function openInNewWindow() {
	var rect = options.getBoundingClientRect();
	optionsWindow = window.open(
	   "",
	   "_blank",
	   "width="+(rect.width+24)+",height="+rect.height+",\
	   left=0,top=0,menubar=no,toolbar=no,location=yes,scrollbars=yes");
	if(optionsWindow==null)
		return;
	optionsWindow.document.open();
	optionsWindow.document.write(
		'<!DOCTYPE HTML>\
			<head>\
				<title>Options</title>\
				<link rel="stylesheet" href="style.css">\
				<style>html,body{max-width:100%;overflow-x:hidden;}</style>\
			</head>\
			<body>\
			</body>'
	);
	optionsWindow.document.close();
	optionsWindow.document.body.appendChild(options);
	options.style.position = 'relative';
	options.style.margin = '0';
	_('#openInNewWindow',options).style.display = 'none';
	optionsWindow.onkeydown=ctrlZEventHandler;
	optionsWindow.onunload=function(){
		document.body.appendChild(options);
		options.style.position="absolute";
		_('#openInNewWindow',options).style.display = 'inline-block';
		options.style.margin="1em";
		optionsWindow=null;
	}
}

window.onunload=function(){if(optionsWindow)optionsWindow.close();}

//ctrlZ
window.onkeydown=ctrlZEventHandler;

function ctrlZEventHandler(event) {
	if(event.ctrlKey&&event.keyCode==90) {
		event.preventDefault();
		ctrlZ();
	}
}

function ctrlZ() {
	currentContext.clearRect(0,0,canvas.width,canvas.height);
	currentContext.drawImage(ctrlZCanvas,0,0);
	if(canvas.width<resizeCanvas.width||canvas.height<resizeCanvas.height) {
		resizeContext.drawImage(ctrlZCanvas,0,0);
	}
}

_('#fn-fillBg').onclick = function() {
	saveCtrlZCopy();
	canvasContext.fillStyle = _('input[type="color"]',options).value;
	canvasContext.fillRect(0,0,canvas.width,canvas.height);
	//autosave
	save();
}

//unused
function clear(){
	canvasContext.clearRect(0,0,canvas.width,canvas.height);
}

function saveCtrlZCopy() {
	ctrlZCanvas.width=resizeCanvas.width;
	ctrlZCanvas.height=resizeCanvas.height;
	if(canvas.width<resizeCanvas.width||canvas.height<resizeCanvas.height) {
		ctrlZContext.drawImage(resizeCanvas,0,0);
	}
	ctrlZContext.drawImage(canvas,0,0);
}