#!/usr/bin/env node

/**
 * Module dependencies.
 */

var app = require('../app');
var debug = require('debug')('untitled:server');
var http = require('http');

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}

var io = require('socket.io')(server);
var sharedsession = require("express-socket.io-session");
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017";

io.use(sharedsession(app.sessionMiddleware, {
    autoSave:true
}));


var user = 0, flag = 0;
var oppo = [], belong = [];
var match = [], color = [];
var Cn = [];

function random(lower, upper) {
    return Math.floor(Math.random() * (upper - lower)) + lower;
}
function Match(a, b){
    var matchNum = random(1, 100000);
    console.log("Create match#" + matchNum + " for " + a + " " + b);
    oppo[a] = b;
    oppo[b] = a;
    belong[a] = belong[b] = matchNum;
    color[a] = 0;
    color[b] = 1;
    match[matchNum] = 0;
}

io.on('connection', function(socket){
    var SearchLoop;
    var username, started;
    console.log(socket.handshake.session.username);

    socket.on('getSort', function(data){
        socket.emit('Sort', {Sort: socket.handshake.session.Sort});
    });
    socket.on('search', function(data){
        started = false;
        console.log("Finding opponent for " + username);
        oppo[username] = 1;
        Cn[username] = socket;
        SearchLoop = setInterval(function() {

            for (var name in oppo){
                if (oppo[username] != 1){
                    started = true;
                    socket.emit('match', { username: username , opponame: oppo[username]});
                    clearInterval(SearchLoop);
                }
                var status = oppo[name];
                if (status != 1) continue;
                else if (name == username) continue;
                else {
                    Match(username, name);
                    started = true;
                    console.log(name + " " + status);
                }
            }
            console.log(data.username + ": searching...");

        }, 500);
    });
    socket.on('end', function(data) {
        var newtot, newwin;
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            console.log("Success connect");

            var dbo = db.db("user");
            var where = {username: socket.handshake.session.username};

            dbo.collection("account").find(where).toArray(function(err, result) {
                if (err) throw err;
                console.log(result[0]);
                if (result == "") res.render('index', {error: 'No such user'});
                else {
                    newtot = parseInt(result[0].tot) + 1;
                    if (data.result == color[username]) newwin = parseInt(result[0].win) + 1;
                    else newwin = parseInt(result[0].win);

                    console.log(newwin + " " + newtot);
                    var whereStr = {username: socket.handshake.session.username};
                    var updateStr = {$set: { win : newwin, tot: newtot}};

                    dbo.collection("account").updateOne(whereStr, updateStr, function(err, res) {
                        if (err) throw err;
                        console.log("Update success!!!!");
                        if (data.result == color[username]){
                            socket.handshake.session.result = "You win! Congratulations!";
                            socket.handshake.session.save();
                        }else{
                            socket.handshake.session.result = "You loss! Try harder!";
                            socket.handshake.session.save();
                        }
                        socket.emit("jump");
                    });
                }
                console.log("Finish");
                db.close();
            });
        });

    });
    socket.on('giveup', function(data){
        Cn[username].emit('giveup');
        Cn[oppo[username]].emit('giveup');
    });

    socket.on('confirm', function(data){
        console.log(data.username + " Confirm");
        match[belong[username]]++;
        Cn[oppo[username]].emit('oppoconfirm', data);
        if (match[belong[username]] == 2){
            started = false;
            console.log("start");
            Cn[username].emit('start', data);
            Cn[oppo[username]].emit('start', data);
        }
    });

    socket.on('cancelSearch', function(data){
        console.log("Cancel search for " + data.username);
        oppo[username] = 0;
        clearInterval(SearchLoop);
    });

    socket.on('disconnect', function(){
        user--;
        clearInterval(SearchLoop);
        console.log("Disconnect");
    });
    socket.on('getColor', function(data){
        started = true;
        username = socket.handshake.session.username;
        console.log(username + " vs " + oppo[username]);
        Cn[username] = socket;
        Cn[username].emit("color", {color: color[username]})
    });
    socket.on('update', function(data){
        console.log(oppo[username]);
        Cn[oppo[username]].emit('update', data);
        Cn[username].emit('update', data)
    });

    user++;

    username = socket.handshake.session.username;
    socket.emit('news', { username: username});

    console.log("Connected");
});


server.on('error', function(error) {
    console.log('The error: '+error);
    //...
});
