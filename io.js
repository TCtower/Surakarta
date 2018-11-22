
var app = require('./app');
// Set up the Socket.IO server


// io.on('connection', function(socket){
//     var SearchLoop;
//     var username;
//     console.log(socket.handshake.session.test);
//
//
//     socket.on('search', function(data){
//         username = data.username;
//         console.log("Finding opponent for " + username);
//         oppo[username] = 1;
//         socket.handshake.session.gogo = 233;
//         socket.handshake.session.save();
//         console.log(socket.handshake.session.gogo);
//         SearchLoop = setInterval(function() {
//
//             for (var name in oppo){
//                 if (oppo[username] != 1){
//                     client.emit('match', { username: username , opponame: oppo[username]});
//                     clearInterval(SearchLoop);
//                 }
//                 var status = oppo[name];
//                 if (status != 1) continue;
//                 else if (name == username) continue;
//                 else {
//                     Match(username, name);
//                     console.log(name + " " + status);
//                 }
//             }
//             console.log(data.username + ": searching...");
//
//         }, 1000);
//     });
//
//     socket.on('confirm', function(data){
//         console.log(data.username + " Confirm");
//         match[belong[username]]++;
//         if (match[belong[username]] == 2){
//             console.log("start");
//         }
//     });
//
//     socket.on('cancelSearch', function(data){
//         console.log("Cancel search for " + data.username);
//         oppo[username] = 0;
//         clearInterval(SearchLoop);
//     });
//
//     socket.on('disconnect', function(){
//         user--;
//         oppo[username] = 0;
//         clearInterval(SearchLoop);
//         console.log("Disconnect");
//     });
//     socket.on('getUsername', function(data){
//         Test();
//         username = data.username;
//         console.log(oppo[username]);
//         Cn[username] = client;
//         Cn[username].emit("color", {color: color[username]})
//
//     });
//     socket.on('update', function(data){
//         console.log(oppo[username]);
//         Cn[oppo[username]].emit('update', data);
//         Cn[username].emit('update', data)
//     });
//
//     user++;
//
//     socket.emit('news', { user: user , id: random(1, 10000)});
//
//     console.log("Connected");
// });


module.exports = io;