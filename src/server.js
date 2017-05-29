const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');
const url = require('url');

const PORT = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync(`${__dirname}/../hosted/index.html`);
const style = fs.readFileSync(`${__dirname}/../hosted/style.css`);
const bundle = fs.readFileSync(`${__dirname}/../hosted/bundle.js`);

const onRequest = (request, response) => {
  const parsedUrl = url.parse(request.url);
  // console.log(parsedUrl.pathname);

  if (parsedUrl.pathname === '/') {
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.write(index);
    response.end();
  } else if (parsedUrl.pathname === '/style.css') {
    response.writeHead(200, { 'Content-Type': 'text/css' });
    response.write(style);
    response.end();
  } else if (parsedUrl.pathname === '/bundle.js') {
    response.writeHead(200, { 'Content-Type': 'text/javascript' });
    response.write(bundle);
    response.end();
  }
};

const app = http.createServer(onRequest).listen(PORT);
console.log(`Listening on port 127.0.0.1: ${PORT}`);

// pass http server to socketio and grab websocket server as io
const io = socketio(app);

let roomInt = 1;
let privateNum = 1;
let roomNum = 1;
let roomName;
const onJoined = (sock) => {
  const socket = sock;
  socket.on('join', (data) => {
    // console.log(`Data: ${data}`);

    if (data === '') {
      roomName = `room${roomNum}`;
      if (roomInt % 2 === 0) {
        roomNum++;
      }
      roomInt++;
    } else if (data === 'private') {
      roomName = `private${privateNum}`;
      privateNum++;
    } else {
      roomName = data;
    }
    // console.log(`RoomName: ${roomName}`);
    socket.room = roomName;

    socket.join(roomName);
  });
};

const sendBufferS = (socket, buffer) => {
  const socketRoom = io.sockets.adapter.rooms[socket.room];
  // console.dir(socket);

  const keys = Object.keys(socketRoom.sockets);
  if (socket.id === keys[0]) {
    // only send to the last socket, the one who just joined

    io.to(keys[socketRoom.length - 1]).emit('syncBufferC', buffer);
    // io.sockets.in(socket.room).emit('syncBufferC', buffer);
  }
};

const getBufferS = (socket) => {
  const socketRoom = io.sockets.adapter.rooms[socket.room];
  console.dir('socketRoom:');
  console.dir(io.sockets.adapter.rooms[socket.room]);
  // if room already has someone in it
  if (socketRoom.length > 0) {
    // get their buffer
    io.sockets.in(socket.room).emit('getBufferC');
  }
};

const onUpdate = (sock) => {
  const socket = sock;
  socket.on('sandToServer', (data) => {
    io.sockets.in(socket.room).emit('broadcastSand', data);
  });

  socket.on('getBufferS', () => {
    getBufferS(socket);
  });

  socket.on('sendBufferS', (data) => {
    sendBufferS(socket, data);
  });
};

const onDisconnect = (sock) => {
  const socket = sock;
  socket.on('disconnect', () => {
    console.log(`disconnect called for socket in room ${socket.room}`);
    socket.leave(socket.room);
  });
};

io.sockets.on('connection', (socket) => {
  onJoined(socket);
  onUpdate(socket);
  onDisconnect(socket);
});

console.log('Websocket server started');
