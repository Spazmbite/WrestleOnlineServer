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

      players[newCoords.socket].timeout = Date.now();
      
      players[newCoords.socket].x = newCoords.x;
      players[newCoords.socket].y = newCoords.y;
      players[newCoords.socket].facing = newCoords.facing;
      players[newCoords.socket].running = newCoords.running;
      //players[newCoords.socket].anim = newCoords.anim;
      //players[newCoords.socket].animtime = newCoords.animtime;
      players[newCoords.socket].socket = newCoords.socket;
      
    } else {
      //console.log(`(${socket.id})`,`Tries to send coords but something gone wrong.`,newCoords.socket);
    }      
  });

  socket.on('sendAnim', (newAnim) => {
    if(players[newAnim.socket] != undefined){
           
    }
  });

  // Informacje o akcji od usera
  socket.on('sendAction', (act) => {
    if(players[act[0]] != undefined){
      // == attacking == 
      if(act[1] == "attack"){
        console.log(`(${socket.id})`,`Attacking...`);
        var idAttacked = findNearestEnemy(act[0]);
        
        players[act[0]].anim = "punchTest";
        
        if(idAttacked != null){
          console.log(`(${socket.id})`,`Attacked ${idAttacked}`);
          
          //players[idAttacked].forceanim = "gettingPunchTest";
        }
      }
      // == grappling ==
      if(act[1] == "grapple"){
        if(players[act[0]].grappling == null){
          console.log(`(${socket.id})`,`Grappling...`);
          var idGrappled = findNearestEnemy(act[0]);
          if(idGrappled != null){
            console.log(`(${socket.id})`,`Grappled ${idGrappled}`);
            players[act[0]].grappling = idGrappled;
            players[idGrappled].grappledBy = act[0];
            
            //players[idGrappled].forceanim = "idleGrapple";
          }
        } else {
          console.log(`(${socket.id})`,`Stopping grapple...`);
          players[players[act[0]].grappling].grappledBy = null;
          players[act[0]].grappling = null;
          
          //players[players[act[0]].grappling].forceanim = "";
        }
        
      }

      // == grappling attack
      if(act[1] == "performAttack"){
        console.log(`(${socket.id})`,`Performing move...`,act[2]);
        players[players[act[0]].grappling].grappledBy = null;
        players[act[0]].grappling = null;
        
        //players[players[act[0]].grappling].forceanim = act[2];
      }
    }

    io.emit('updatePlayers', players);
  });
  

  // Kiedy klient wyśle info log
  socket.on('sendLog', (log) => {
    io.emit('updateLog', log); // wysyłamy do wszystkich
  });

  socket.on('forceDisconnect', () => {
    saveDisconnect(socket.id);
  });

  socket.on('disconnect', () => {
    saveDisconnect(socket.id);
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

function findNearestEnemy(id){
  var out = null;
  var dist = 100000000;
  for (let p in players) {
    if(p != id){
      var thisDist = distanceBetweenPoints(players[id].x, players[id].y, players[p].x, players[p].y);
      if(thisDist < dist && thisDist < 30 && players[id].grappledBy == null && players[p].grappledBy == null  && 
         ((players[id].x > players[p].x && players[id].facing == -1) || (players[id].x <= players[p].x && players[id].facing == 1)) 
        ){
        dist = thisDist;
        out = p;
      }
    }
  }
  return out;
}

function saveDisconnect(id){
  // un-grappling
  for (let p in players) {
    if(players[p].grappledBy == id){
      players[p].grappledBy = null;
    }
  }


  // finish disconnect
  if(players[id] != undefined){
    players[id].disconnected = true;
  }
  io.emit('updatePlayers', players);
  console.log(`(${id})`,`User disconnected.`);
  delete players[id];
  io.emit('updatePlayers', players);
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
  for (let d in players) {
    /*if(players[d].forceanim != null){
      if(players[d].anim != players[d].forceanim){
        players[d].anim = players[d].forceanim;
      } else {
        players[d].forceanim = null;
      }
      
      //
    }*/
    if((Date.now() - players[d].timeout) > 5000){
      saveDisconnect(d);
    }
  }
  io.emit('updatePlayers', players);
  for (let d in players) {
    //players[d].action = "";
  }
},10);

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
