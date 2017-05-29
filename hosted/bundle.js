"use strict";
//GLOBALS

var socket = void 0;
var ctx = void 0;
var canvas = void 0;
var colorSelect = void 0;
var materialSelect = void 0;
var roomName = "Not Set";
var inRoom = false;
var drawInterval = void 0;

var buffer = [];
var empty = 0;
var wall = 1;
var sand = 2;
var blueSand = 3;
var redSand = 4;
var blackSand = 5;
var whiteSand = 6;
var sandColor = "#ffe7cc";
var material = "sand";
//vv
var width = 100;
var height = 100;
var cellSize = 5;

//^^

var dragging = void 0;

var setBufToServer = function setBufToServer(x, y, val) {

  //console.log(`socket: ${socket}`);
  socket.emit('sandToServer', { x: x, y: y, val: val });
};

var setBuf = function setBuf(x, y, val) {
  buffer[x + y * width] = val;
};

var getBuf = function getBuf(x, y) {
  if (x < 0 || x >= width || y < 0 || y >= height) return empty;
  return buffer[x + y * width];
};

var doMousedown = function doMousedown(e) {
  dragging = true;
};

var doMousemove = function doMousemove(e) {
  if (dragging) {

    //setTimeout( ()=>{
    var mouse = getMouse(e);
    if (material === "sand") {
      setBufToServer(Math.floor(mouse.x / 5), Math.floor(mouse.y / 5), sand);
    } else if (material === "blueSand") {
      setBufToServer(Math.floor(mouse.x / 5), Math.floor(mouse.y / 5), blueSand);
    } else if (material === "redSand") {
      setBufToServer(Math.floor(mouse.x / 5), Math.floor(mouse.y / 5), redSand);
    } else if (material === "blackSand") {
      setBufToServer(Math.floor(mouse.x / 5), Math.floor(mouse.y / 5), blackSand);
    } else if (material === "whiteSand") {
      setBufToServer(Math.floor(mouse.x / 5), Math.floor(mouse.y / 5), whiteSand);
    } else if (material === "wall") {
      setBufToServer(Math.floor(mouse.x / 5), Math.floor(mouse.y / 5), wall);
    }
    //console.dir(buffer);
    //},10); 
  }
};

var doMouseup = function doMouseup() {
  dragging = false;
};

var doMouseout = function doMouseout() {
  dragging = false;
};

var moveSand = function moveSand() {

  for (var y = height - 1; y >= 0; y--) {
    for (var x = 0; x < width; x++) {

      //if (getBuf(x, y) === sand) { // if we have sand
      if (getBuf(x, y) >= 2) {
        // if we have sand
        var currentMat = getBuf(x, y);
        //dir is direction. it chooses which way sand will fall
        var dir = Math.random() < 0.5 ? -1 : 1;

        if (getBuf(x, y + 1) === empty) {
          // if empty below
          setBuf(x, y, empty); // clear sand
          setBuf(x, y + 1, currentMat); // move sand
        } else if (getBuf(x + dir, y + 1) === empty) {
          // if empty diagonal
          setBuf(x, y, empty); // clear sand
          setBuf(x + dir, y + 1, currentMat); // move sand
        }
      }
    }
  }
};

var drawSand = function drawSand(color) {

  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      if (getBuf(x, y) === empty) {
        ctx.fillStyle = '#597686';
      } else if (getBuf(x, y) === sand) {
        ctx.fillStyle = "#ffe7cc";
      } else if (getBuf(x, y) === blueSand) {
        ctx.fillStyle = "blue";
      } else if (getBuf(x, y) === redSand) {
        ctx.fillStyle = "darkred";
      } else if (getBuf(x, y) === blackSand) {
        ctx.fillStyle = "black";
      } else if (getBuf(x, y) === whiteSand) {
        ctx.fillStyle = "white";
      } else if (getBuf(x, y) === wall) {
        ctx.fillStyle = '#444';
      }
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }
};

var getMouse = function getMouse(e) {
  var mouse = {};
  mouse.x = e.pageX - e.target.offsetLeft;
  mouse.y = e.pageY - e.target.offsetTop;
  return mouse;
};

var onConnect = function onConnect() {
  socket = io.connect();

  socket.on('connect', function () {
    console.log("connecting to room: " + roomName);
    socket.emit('join', roomName);

    canvas.onmousedown = doMousedown;
    canvas.onmousemove = doMousemove;
    canvas.onmouseup = doMouseup;
    canvas.onmouseout = doMouseout;

    for (var x = 0; x < 500; x++) {
      setBuf(x, height - 10, wall);
    }

    drawInterval = setInterval(function () {
      moveSand();
      drawSand();
    }, 50);
  });

  socket.emit('getBufferS');

  socket.on('getBufferC', function () {
    console.log("In getBufferC");
    //if(socket.firstInRoom){
    socket.emit('sendBufferS', buffer);
    //}
  });
  //  
  socket.on('syncBufferC', function (data) {
    console.log("In getBufferC");
    console.dir(buffer);
    console.dir(data);
    buffer = data.slice(0);
  });

  socket.on('broadcastSand', function (data) {
    setBuf(data.x, data.y, data.val);
  });
};

var noRoomScreen = function noRoomScreen() {
  ctx.fillStyle = '#597686';
  ctx.fillRect(0, 0, 500, 500);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.fillText("Enter Room to Begin", canvas.width / 2, canvas.height / 2);
};

var buttonEvents = function buttonEvents() {
  //grab all buttons
  var roomButton = document.querySelector("#roomButton");
  var randButton = document.querySelector("#randButton");
  var privateButton = document.querySelector("#privateButton");
  var leaveButton = document.querySelector("#leaveButton");

  roomButton.addEventListener('click', function () {
    if (!inRoom) {
      roomName = document.querySelector("#roomName").value;
      //console.log("clicked enter room")
      onConnect();
      inRoom = true;
      roomButton.style.backgroundColor = "grey";
      randButton.style.backgroundColor = "grey";
      privateButton.style.backgroundColor = "grey";
    }
  });

  randButton.addEventListener('click', function () {
    if (!inRoom) {
      roomName = "";
      //console.log("clicked rand")
      onConnect();
      inRoom = true;
      roomButton.style.backgroundColor = "grey";
      randButton.style.backgroundColor = "grey";
      privateButton.style.backgroundColor = "grey";
    }
  });

  privateButton.addEventListener('click', function () {
    if (!inRoom) {
      roomName = "private";
      //console.log("clicked private")
      onConnect();
      inRoom = true;
      roomButton.style.backgroundColor = "grey";
      randButton.style.backgroundColor = "grey";
      privateButton.style.backgroundColor = "grey";
    }
  });

  leaveButton.addEventListener('click', function () {
    //console.log("clicked leave");
    socket.disconnect();
    inRoom = false;
    clearInterval(drawInterval);
    noRoomScreen();

    for (var i = 0; i < width * height; i++) {
      buffer[i] = empty;
    }

    roomButton.style.backgroundColor = "white";
    randButton.style.backgroundColor = "white";
    privateButton.style.backgroundColor = "white";
  });

  //color grab event
  colorSelect = document.querySelector('#colorSelect');
  colorSelect.addEventListener('change', function () {
    material = colorSelect.value;
  });

  //material event
  materialSelect = document.querySelector('#materialSelect');
  materialSelect.addEventListener('change', function () {
    material = materialSelect.value;
    if (material === 'sand') {
      material = colorSelect.value;
    }
  });
};

var init = function init() {
  canvas = document.querySelector("#canvas");
  ctx = canvas.getContext("2d");

  canvas.width = width * cellSize;
  canvas.height = height * cellSize;

  noRoomScreen();

  colorSelect = document.querySelector("#colorSelect");

  buttonEvents();

  for (var i = 0; i < width * height; i++) {
    buffer[i] = empty;
  }
};

window.onload = init;
