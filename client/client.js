"use strict"
//GLOBALS
let socket;
let ctx;
let canvas;
let colorSelect;
let materialSelect;
let roomName = "Not Set";
let inRoom = false;
let drawInterval;

let buffer = [];
const empty = 0;
const wall = 1;
const sand = 2;
const blueSand = 3;
const redSand = 4;
const blackSand = 5;
const whiteSand = 6;
let sandColor = "#ffe7cc";
let material = "sand";
//vv
const width = 100;
const height = 100;
const cellSize = 5;

//^^

let dragging;

const setBufToServer = (x, y, val) =>{

  //console.log(`socket: ${socket}`);
  socket.emit('sandToServer', {x:x, y:y, val:val});

};

const setBuf =(x, y, val) =>{
  buffer[x+y*width] = val;
}

const getBuf = (x, y) =>{
  if (x < 0 || x >= width ||
      y < 0 || y >= height)
    return empty;
  return buffer[x + y * width];
};

const doMousedown = (e) =>{
  dragging = true;
};

const doMousemove = (e) => {
  if(dragging){

    //setTimeout( ()=>{
    const mouse = getMouse(e);
    if(material === "sand"){
      setBufToServer(Math.floor(mouse.x/5), Math.floor(mouse.y/5), sand);
    }else if(material === "blueSand"){
      setBufToServer(Math.floor(mouse.x/5), Math.floor(mouse.y/5), blueSand);
    }else if(material === "redSand"){
      setBufToServer(Math.floor(mouse.x/5), Math.floor(mouse.y/5), redSand);
    }else if(material === "blackSand"){
      setBufToServer(Math.floor(mouse.x/5), Math.floor(mouse.y/5), blackSand);
    }else if(material === "whiteSand"){
      setBufToServer(Math.floor(mouse.x/5), Math.floor(mouse.y/5), whiteSand);
    }else if(material === "wall"){
      setBufToServer(Math.floor(mouse.x/5), Math.floor(mouse.y/5), wall);
    }
    //console.dir(buffer);
    //},10); 

  }
};

const doMouseup = () =>{
  dragging = false;
}

const doMouseout = () =>{
  dragging = false;
}

const moveSand = () =>{

  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {

      //if (getBuf(x, y) === sand) { // if we have sand
      if (getBuf(x, y) >= 2) { // if we have sand
        const currentMat = getBuf(x, y);
        //dir is direction. it chooses which way sand will fall
        let dir = Math.random() < 0.5 ? -1 : 1;

        if (getBuf(x, y + 1) === empty) { // if empty below
          setBuf(x, y, empty); // clear sand
          setBuf(x, y + 1, currentMat); // move sand
        } else if (getBuf(x + dir, y + 1) === empty) { // if empty diagonal
          setBuf(x, y, empty); // clear sand
          setBuf(x + dir, y + 1, currentMat); // move sand
        }

      }
    }
  }

};

const drawSand = (color) =>{

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if(getBuf(x,y) === empty){
        ctx.fillStyle = '#597686';
      }else if(getBuf(x,y) === sand){
        ctx.fillStyle = "#ffe7cc";
      }
      else if(getBuf(x,y) === blueSand){
        ctx.fillStyle = "blue";
      }
      else if(getBuf(x,y) === redSand){
        ctx.fillStyle = "darkred";
      }
      else if(getBuf(x,y) === blackSand){
        ctx.fillStyle = "black";
      }       
      else if(getBuf(x,y) === whiteSand){
        ctx.fillStyle = "white";
      } 
      else if(getBuf(x,y) === wall){
        ctx.fillStyle = '#444';
      }
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }

};

const getMouse = (e)=>{
  let mouse = {}
  mouse.x = e.pageX - e.target.offsetLeft;
  mouse.y = e.pageY - e.target.offsetTop;
  return mouse;
};

const onConnect = () => {
  socket = io.connect();

  socket.on('connect', () => {
    console.log(`connecting to room: ${roomName}`)
    socket.emit('join', roomName);

    canvas.onmousedown = doMousedown;
    canvas.onmousemove = doMousemove;
    canvas.onmouseup = doMouseup;
    canvas.onmouseout = doMouseout;

    for (let x = 0; x < 500; x++){
      setBuf(x, height - 10, wall);  
    }

    drawInterval = setInterval( ()=>{
      moveSand();
      drawSand();
    },(50));
  });

  socket.emit('getBufferS');

  socket.on('getBufferC', (data)=>{
    console.log("In getBufferC");
    //if(socket.firstInRoom){
    socket.emit('sendBufferS', buffer);
    //}
  });
  //  
  socket.on('syncBufferC', (data)=>{
    console.log("In getBufferC");
    console.dir(buffer);
    console.dir(data);
    buffer = data.slice(0);
  });

  socket.on('broadcastSand', (data)=>{
    setBuf(data.x, data.y, data.val);
  });
};

const noRoomScreen = () =>{
  ctx.fillStyle = '#597686';
  ctx.fillRect(0,0,500,500);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.fillText("Enter Room to Begin", canvas.width/2, canvas.height/2 );

};

const buttonEvents = () =>{
  //grab all buttons
  const roomButton = document.querySelector("#roomButton");
  const randButton = document.querySelector("#randButton");
  const privateButton = document.querySelector("#privateButton");
  const leaveButton = document.querySelector("#leaveButton");


  roomButton.addEventListener('click', ()=>{
    if(!inRoom){
      roomName = document.querySelector("#roomName").value;
      //console.log("clicked enter room")
      onConnect();
      inRoom = true;
      roomButton.style.backgroundColor = "grey";
      randButton.style.backgroundColor = "grey";
      privateButton.style.backgroundColor = "grey";

    }
  });

  randButton.addEventListener('click', ()=>{
    if(!inRoom){
      roomName = "";
      //console.log("clicked rand")
      onConnect();
      inRoom = true;
      roomButton.style.backgroundColor = "grey";
      randButton.style.backgroundColor = "grey";
      privateButton.style.backgroundColor = "grey";
    }
  });

  privateButton.addEventListener('click', ()=>{
    if(!inRoom){
      roomName = "private";
      //console.log("clicked private")
      onConnect();
      inRoom = true;
      roomButton.style.backgroundColor = "grey";
      randButton.style.backgroundColor = "grey";
      privateButton.style.backgroundColor = "grey";
    }
  });

  leaveButton.addEventListener('click', ()=>{
    //console.log("clicked leave");
    socket.disconnect();
    inRoom = false;
    clearInterval(drawInterval);
    noRoomScreen();

    for(let i = 0; i < width*height; i++){
      buffer[i] = empty;
    }

    roomButton.style.backgroundColor = "white";
    randButton.style.backgroundColor = "white";
    privateButton.style.backgroundColor = "white";
  });

  //color grab event
  colorSelect = document.querySelector('#colorSelect');
  colorSelect.addEventListener('change', ()=>{
    material = colorSelect.value;
  });

  //material event
  materialSelect = document.querySelector('#materialSelect');
  materialSelect.addEventListener('change', ()=>{
    material = materialSelect.value;
    if(material === 'sand'){
      material = colorSelect.value;
    } 
  });
};

const init = () => {
  canvas = document.querySelector("#canvas");
  ctx = canvas.getContext("2d");

  canvas.width = width * cellSize;
  canvas.height = height * cellSize;  

  noRoomScreen();

  colorSelect = document.querySelector("#colorSelect");

  buttonEvents();

  for(let i = 0; i < width*height; i++){
    buffer[i] = empty;
  }

};

window.onload = init;
