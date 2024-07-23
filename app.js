const express = require('express');
const app = express();
const http=require('http');
const socketio=require('socket.io');
const path =require('path')
app.use(express.static(path.join(__dirname,"public")));
const server=http.createServer(app);
const io=socketio(server)

app.get('/',function(req,res){
    res.render('index.ejs')
})

io.on("connection",function(socket){
    socket.on("send-location",(data)=>{
        console.log(data)
       io.emit("receive-location",{
        id:socket.id,
        ...data
       })
    })
 socket.on("disconnet",function(){
    io.emit("user-disconnected",{
        id: socket.id,
    })
 })
    
});

app.set("view engine","ejs");
server.listen(3000,()=>{
    
    console.log("server is running")
})