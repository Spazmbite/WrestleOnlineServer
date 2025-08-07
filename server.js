const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

let players = {}; // tu trzymamy dane o użytkownikach

app.use(express.static('public')); // frontend w folderze 'public'

io.on('connection', (socket) => {
  console.log(`(${socket.id})`,`Connecting user... `);

  // Spawn postaci
  socket.on('sendInit', (player) => {
    console.log(`(${socket.id})`,`User ${player.id} spawned`);
    players[socket.id] = player;
  });
  
  // Update współrzędnych postaci
  socket.on('sendCoords', (newCoords) => {
    //players[socket.id] = coords;
    if(players[newCoords.socket] != undefined){
      players[newCoords.socket].x = newCoords.x;
      players[newCoords.socket].y = newCoords.y;
      players[newCoords.socket].timeout = Date.now();
    } else {
      //console.log(`(${socket.id})`,`Tries to send coords but something gone wrong.`,newCoords.socket);
    }
      
  });

  // Informacje o akcji od usera
  socket.on('sendAction', (act) => {
    
    // == grappling ==
    if(act[1] == "grapple"){
      console.log(`(${socket.id})`,`Grappling...`);
      var idGrappled = findClosestEnemy(act[0]);
      if(idGrappled != null && idGrappled < 40){
        console.log(`(${socket.id})`,`Grappled ${idGrappled}`);
        players[act[0]].grappling = idGrappled;
        players[idGrappled].grappledBy = act[0];
      }
    }

    io.emit('updatePlayers', players);
  });

  
  

  // Wymuś kontrolę nad innym graczem
  socket.on('sendCoordsPlayer', (combinedCoords) => {
    players[pId(combinedCoords[0])] = combinedCoords[1];
  });

  

  // Kiedy klient wyśle info log
  socket.on('sendLog', (log) => {
    io.emit('updateLog', log); // wysyłamy do wszystkich
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('updateCoords', players);
  });
});

http.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});

function findClosestEnemy(id){
  var out = null;
  var dist = 100000000;
  for (let p in players) {
    if(p != id){
      var thisDist = distanceBetweenPoints(players[id].x, players[id].y, players[p].x, players[p].y);
      if(thisDist < dist){
        dist = thisDist;
        out = p;
      }
    }
  }
  return out;
}

function playerId(id){
    for (let d in players) {
        if(players[d].id == id){
            return players[d];
        }
    }
}

function pId(id){
  for (let d in players) {
      if(players[d].id == id){
          return d;
      }
  }
  return null;
}

function distanceBetweenPoints(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

setInterval(function(){
  io.emit('updatePlayers', players);
},20);

setInterval(() => {
  fetch("https://wrestleonlineserver.onrender.com")
    .then(() => console.log("Ping!"))
    .catch(err => console.error("Błąd pingu:", err));
}, 10 * 60 * 1000); // co 10 minut






/*
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

let players = {}; // tu trzymamy dane o użytkownikach
let bullets = {};


var countBullets = 0;

app.use(express.static('public')); // frontend w folderze 'public'

io.on('connection', (socket) => {
  console.log('Użytkownik połączony:', socket.id);

  // Kiedy klient wyśle swoje koordynaty
  socket.on('sendCoords', (coords) => {
    players[socket.id] = coords;
  });

  // Wymuś kontrolę nad innym graczem
  socket.on('sendCoordsPlayer', (combinedCoords) => {
    players[pId(combinedCoords[0])] = combinedCoords[1];
  });

  // Kiedy klient wyśle info o akcji usera
  socket.on('sendAction', (act) => {
    io.emit('updateActions', act); // wysyłamy do wszystkich
  });

  // Kiedy klient wyśle info log
  socket.on('sendLog', (log) => {
    io.emit('updateLog', log); // wysyłamy do wszystkich
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('updateCoords', players);
  });
});

http.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});

function playerId(id){
    for (let d in players) {
        if(players[d].id == id){
            return players[d];
        }
    }
}

function pId(id){
  for (let d in players) {
      if(players[d].id == id){
          return d;
      }
  }
  return null;
}

setInterval(function(){
  io.emit('updateCoords', players);
},20);

setInterval(() => {
  fetch("https://wrestleonlineserver.onrender.com")
    .then(() => console.log("Ping!"))
    .catch(err => console.error("Błąd pingu:", err));
}, 10 * 60 * 1000); // co 10 minut

*/
