var G, pos;//Graph Array and position Array
var now;//current chess 
var Ava;//Available Array
var d = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
var Chain = [[2, -1, 12, 13, 14, 15, 16, 17, -1, 3, 9, 15, 21, 27, 33, -1, 23, 22, 21, 20, 19, 18, -1, 32, 26, 20, 14, 8], [1, -1, 6, 7, 8, 9, 10, 11, -1, 4, 10, 16, 22, 28, 34, -1, 29, 28, 27, 26, 25, 24, -1, 31, 25, 19, 13, 7]]; // Green circle chain and blue circle chain

var socket = io.connect('/');
var username;
var myColor, giveup_flag = 0;
/*---------------Game support part---------------*/

function getSide(x){
	if (x == -1) return -1;//none
	else if (x <= 11) return 1;//white 
	else if (x >= 24) return 2;//black
}

function go(cx, cur, dx){//dx is the direction, cx is the chain
	var step = Chain[cx].length + 1, flag = 0;
	while (step--){
		//update status
		cur = (cur + dx + Chain[cx].length) % Chain[cx].length;

		var tmp = Chain[cx][cur], xx = parseInt(tmp / 6), yy = tmp % 6;
		if (tmp == -1) {flag = 1; continue;}
		if (G[xx][yy] == -1 || G[xx][yy] == now) continue;
		if ((getSide(G[xx][yy]) != getSide(now)) && flag == 1) Ava[xx][yy] = 1;
		return;
	}
}

function getAva(){
	Ava = new Array();
	for (var i = 0; i < 6; i++){//initialize
		Ava[i] = new Array();
		for (var j = 0; j < 6; j++) Ava[i][j] = 0;
	}

	var x = parseInt(pos[now] / 6), y = pos[now] % 6;
	for (var i = 0; i < 8; i++){
		var xx = x + d[i][0], yy = y + d[i][1];
		if (xx < 0 || xx > 5 || yy < 0 || yy > 5) continue;
		if (G[xx][yy] != -1) continue;
		Ava[xx][yy] = 1;
	}
	
	for (var i = 0; i < 2; i++)
	for (var j = 0; j < Chain[i].length; j++)
		if (Chain[i][j] == pos[now]) {go(i, j, 1); go(i, j, -1);}
}

function check(){ // check if the game ends
	var whi = 0, bla = 0, Avawhi = 0, Avabla = 0, num;
	for (var i = 0; i < 6; i++)
		for (var j = 0; j < 6; j++){
			if (getSide(G[i][j]) == 1) whi += 1;
			else if (getSide(G[i][j]) == 2) bla += 1;
		}
	for (var i = 0; i < 6; i++)
		for (var j = 0; j < 6; j++){
			if (getSide(G[i][j]) == -1) continue;//no chess
			now = G[i][j];
			getAva();
			num = 0;
			for (var k = 0; k < 6; k++)
			for (var l = 0; l < 6; l++) num += Ava[k][l];
			if (getSide(now) == 1) Avawhi += num;
			if (getSide(now) == 2) Avabla += num;
		}

	if (whi == 0) {
		socket.emit("end", {result: 0});
		Stop();
		return;
	}
	else if (bla == 0) {
        socket.emit("end", {result: 1});
		Stop();
		return;
	}

	if (Avawhi == 0 || Avabla == 0) {
		alert("Can't move!!"); 
		if (whi > black) {
            socket.emit("end", {result: 1});
			Stop();
			return;
		}
		if (whi < black) {
            socket.emit("end", {result: 0});
			Stop(); return;
		}
	}
}
function giveup(){
	giveup_flag = 1;
	socket.emit('giveup');
}
function opmove(){//opponent move
	for (var i = 0; i < 6; i++)
	for (var j = 0; j < 6; j++)
	if (getSide(G[i][j]) == 1){//for white
		now = G[i][j];
		getAva();
		for (var k = 0; k < 6; k++)
		for (var l = 0; l < 6; l++)
		if (Ava[k][l] == 1){
			G[i][j] = -1;
            pos[now] = k * 6 + l; 
        	G[k][l] = now;
        	document.getElementById("div" + pos[now]).innerHTML = "";
            document.getElementById("div" + pos[now]).appendChild(document.getElementById("drag" + now));
			return;
		}
	}
}
/*---------------Game support part(End)---------------*/

/*---------------Event part---------------*/

function allowDrop(ev) {
	ev.preventDefault();
}

function drag(ev) {//start drag
    ev.dataTransfer.setData("Text", ev.target.id);
    now = ev.target.id.slice(4);
    getAva();
    for (var i = 0; i < 6; i++)
    	for (var j = 0; j < 6; j++){
    		var tmp = i * 6 + j;
    		if (Ava[i][j] == 0) document.getElementById("div" + tmp).style.border="";
    		else document.getElementById("div" + tmp).style.border="1px solid #DC143C"; 
    	}
}
function Froze(){
    for (var i = 0; i < 6; i++)
    for (var j = 0; j < 6; j++){
        if (G[i][j] == -1) continue;
       	$('#drag' + G[i][j]).attr('draggable', false);
    }
}
function unFroze(){
    for (var i = 0; i < 6; i++)
        for (var j = 0; j < 6; j++){
            if (G[i][j] == -1) continue;
            if (myColor == 0 && G[i][j] >= 24) $('#drag' + G[i][j]).attr('draggable', true);
            else if (myColor == 1 && G[i][j] <= 11) $('#drag' + G[i][j]).attr('draggable', true);
        }
}

socket.on('update', function(tmp){
    now = tmp.chess;
    var tnow = now;
    var ID = tmp.ID;
    var target = tmp.target;
    var Slice = tmp.Slice;

    G[parseInt(pos[now] / 6)][pos[now] % 6] = -1;
    if (target == 'i') pos[now] = Slice.slice(3);
    else pos[now] = pos[Slice.slice(4)];
    G[parseInt(pos[now] / 6)][pos[now] % 6] = now;
    document.getElementById("div" + pos[now]).innerHTML = "";
    document.getElementById("div" + pos[now]).appendChild(document.getElementById(ID));
    reset();
    document.getElementById("div" + pos[now]).style.border="1px solid white";
    check();
    // alert(myColor + " " + tnow);
    if (myColor == 0 && tnow <= 11) unFroze();
    if (myColor == 1 && tnow >= 24) unFroze();
});
function drop(ev) {
    var data = ev.dataTransfer.getData("Text");
    Froze();
    //alert(now);
    socket.emit('update', {chess: now, ID: data, target: ev.target.id[1], Slice: ev.target.id} );
}

function reset(){
	for (var i = 0; i < 6; i++)
	for (var j = 0; j < 6; j++){
		var tmp = i * 6 + j;

		document.getElementById("div" + tmp).style.border = "";
    }
}
/*---------------Event part(End)---------------*/

/*---------------initialize part---------------*/

function drawCir(cxt, x, y, r, ang1, ang2, dir, color){
	cxt.moveTo(x, y);
	cxt.beginPath();
	cxt.arc(x, y, r, ang1, ang2, dir); 
	cxt.strokeStyle = color; 
	cxt.stroke();
}

function buildGraph(){
	//draw background
	Can = document.getElementById("board");
	cxt = Can.getContext("2d");
	cxt.lineWidth = 3;

	drawCir(cxt, 100, 100, 100, 0, Math.PI*0.5, true, "green");
	drawCir(cxt, 350, 100, 100, Math.PI*0.5, Math.PI*1, true, "green");
	drawCir(cxt, 100, 350, 100, Math.PI*1.5, 0, true, "green");
	drawCir(cxt, 350, 350, 100, Math.PI*1, Math.PI*1.5, true, "green");

	drawCir(cxt, 100, 100, 50, 0, Math.PI*0.5, true, "blue");
	drawCir(cxt, 350, 100, 50, Math.PI*0.5, Math.PI*1, true, "blue");
	drawCir(cxt, 100, 350, 50, Math.PI*1.5, 0, true, "blue");
	drawCir(cxt, 350, 350, 50, Math.PI*1, Math.PI*1.5, true, "blue");

	hor_x=100; hor_y=100;
	ver_x=100; ver_y=100;
	for (var i = 0; i < 6; i++){
		if (i == 0 || i == 5) cxt.strokeStyle="yellow";
		else if (i == 1 || i == 4)  cxt.strokeStyle="blue";
		else cxt.strokeStyle="green";

		cxt.beginPath();
		cxt.moveTo(hor_x, hor_y); cxt.lineTo(hor_x+250, hor_y); cxt.stroke();
		hor_y += 50;
		cxt.moveTo(ver_x, ver_y); cxt.lineTo(ver_x, ver_y+250); cxt.stroke();
		ver_x += 50;
	}
	//create div and chess
	document.getElementById("chessBoard").innerHTML = "";
	sta_x = 85; sta_y = 85;
	for (var i = 0; i < 6; i++){
		for (var j = 0; j < 6; j++){
			x = (i * 6 + j);
			document.getElementById("chessBoard").innerHTML += '<div id="div' + x + '" class="box" style="top:' + sta_x +'px; left:' + sta_y + 'px;" ondragover="if (Ava['+ i +']['+ j +'] == 1) allowDrop(event)" ondrop="drop(event)" ></div>';

			if (x <= 11){
				document.getElementById("div" + x).innerHTML += '<img class="chess white" src="../images/chess_white.png"  draggable="' +(myColor == 1) + '"  ondragstart="drag(event)" ondragend="reset();" name = "drag' + x + '" id="drag' + x + '" />' ;
			}else if (x >= 24){
				document.getElementById("div" + x).innerHTML += '<img class="chess black" src="../images/chess_black.png"  draggable="' +(myColor == 0) + '"  ondragstart="drag(event)" ondragend="reset();" name = "drag' + x + '" id="drag' + x + '" />' ;
			}
			sta_y += 50;
		}
		sta_y = 85; 
		sta_x += 50;
	}
}

function initGame(){
	G = new Array();
	pos = new Array();
	for (var i = 0; i < 6; i++){
		G[i] = new Array();
		for (var j = 0; j < 6; j++){
			var x = i * 6 + j;
			if (x <= 11 || x >= 24) {G[i][j] = x; pos[x] = x;}
			else {G[i][j] = -1; pos[x] = -1;}
		}
	}
}

/*---------------initialize part (End)---------------*/


function Start(){
	document.getElementById("readMe").style.display = "none";
	document.getElementById("gameBoard").style.display = "block";
	buildGraph();
	initGame();
    if (myColor == 1) Froze();
}

/*-----------------Execution part------------------*/


socket.on('news', function (data) {
    console.log(data.username);
    username = data.username;
    $('#user').html(username);
    console.log(username);
    socket.emit("getColor", data);
});

socket.on('color', function (data){
	if (data.color == 0) alert("You Play Black Chess !");
	else alert("You Play White Chess !");
    myColor = data.color;
    Start();
});

socket.on('jump', function (data){
    window.location.href = "/over";
});

socket.on('giveup', function (data){
    if (giveup_flag == 1){
        socket.emit("end", {result: 1 - myColor});
	}else socket.emit("end", {result: myColor});
});
socket.on('oppo_discon', function (data) {
    alert("Your opponent disconnected!");
    window.location.href = "/profile";
});


