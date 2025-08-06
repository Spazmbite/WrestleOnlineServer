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
    
    if(players[socket.id].grappledBy != null){
        players[socket.id].y = playerId(players[socket.id].grappledBy).y;
        players[socket.id].x = (playerId(players[socket.id].grappledBy).x > players[socket.id].x) ? (playerId(players[socket.id].grappledBy).x - 35) : (playerId(players[socket.id].grappledBy).x + 35);
    }


    
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
    /*if(players[socket.id+"_1"]){ delete players[socket.id+"_1"]; }
    if(players[socket.id+"_2"]){ delete players[socket.id+"_2"]; }
    if(players[socket.id+"_3"]){ delete players[socket.id+"_3"]; }
    if(players[socket.id+"_4"]){ delete players[socket.id+"_4"]; }
    if(players[socket.id+"_5"]){ delete players[socket.id+"_5"]; }*/
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

setInterval(function(){
  io.emit('updateCoords', players);
},20);

setInterval(() => {
  fetch("https://wrestleonlineserver.onrender.com")
    .then(() => console.log("Ping!"))
    .catch(err => console.error("Błąd pingu:", err));
}, 10 * 60 * 1000); // co 10 minut
