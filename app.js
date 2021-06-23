const express = require('express'); 
const mongoose = require('mongoose')
const User = require('./models/User'); 
const {json} = require('express');
const multer = require('multer');
const userRoutes = require('./routes/user'); 
const channelRoutes = require('./routes/channel');
const guildroutes = require('./routes/guild'); 
const jwt = require('jsonwebtoken'); 
var cors = require('cors')
const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http,{cors:{origin:['http://localhost:3000']}});

require('dotenv').config()

// App config
app.use(express.json()); 
app.use(express.urlencoded({extended:false})); 
app.use(cors());
app.use('/ServerProfiles', express.static('ServerProfiles')) ; 
app.use('/profiles', express.static('profiles')) ; 

const PORT = process.env.SERVER_PORT||5000;

const DBURI = process.env.MONGO_SERVER ;
mongoose.connect(DBURI,{ useUnifiedTopology: true, useNewUrlParser: true})
    .then((result)=>{
        http.listen(PORT,()=>console.log(`app started and running @ port: ${PORT}`)); 
        console.log("app starteed");  
        console.log('connected to database');  
    })  
    .catch((error)=>{ 
        console.log(error); 
    })
 
io.use(function(socket, next){
  if (socket.handshake.query && socket.handshake.query.token){
      const token = socket.handshake.query.token;
    jwt.verify(token, process.env.JWT_KEY, function(err, decoded) {
      if (err){
        console.log(err) ; 
        console.log("auth error"); 
        return next(new Error('Auth Failed'));
      }
      socket.userData = decoded;
      next();
    });
  }
  else {
    next(new Error('AuthFailed'));
    console.log("auth error"); 
  }    
})

// Run when client connects

// io code
io.on("connection", function(socket) {
    const userId = socket.userData.userId ; 
    User.findByIdAndUpdate(userId,{online:true}).then(()=>{console.log("user connected to the chat ",socket.userData.username);});
    socket.emit('user-connected',{message:'done'});
    socket.on("new-operations", function(data) {
      io.to(socket.id).emit("new-remote-operations", data);
    });
    socket.on('hello', (msg)=>{ console.log(msg)});
    socket.on("chatmessage",(msg,channelId)=>{ console.log(msg,channelId)}) 
    socket.on("disconnect", ()=>{ 
        User.findByIdAndUpdate(userId,{online:false}).then(()=>{console.log("user disconnected from the chat")});
    }); 
});

// routes
app.use('/api/v1/user/',userRoutes);
app.use('/api/v1/channels/', channelRoutes); 
app.use('/api/v1/guild/',guildroutes); 
module.exports = app; 