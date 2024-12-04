import {Server} from "socket.io";
import express from "express";
import http from "http";;

const app = express();

const server =  http.createServer(app);

const io = new Server(server,{
    cors:{
        origin:process.env.URL,
        methods:['GET' , 'POST']
    }
})

const userSocketMap  = {}; // this map stores socket id corresponding to user id; userId -> socketId

export const getRecieverSocketId = (recieverId)=> userSocketMap[recieverId]; //recieverId is key -> corresponding socketId is value

io.on('connection',(socket)=>{
    const userId = socket.handshake.query.userId;
    if(userId){
        userSocketMap[userId] = socket.id;
        console.log(`User Connected : UserId = ${userId}, SocketId = ${socket.id}`);
    }
    
    io.emit('getOnlineUsers', Object.keys(userSocketMap)) //ye event emit karta hai , jo client side(frontend) par event listener hai,

    socket.on('disconnect',()=>{
        if(userId){
            console.log(`User Disconnected :  UserId = ${userId}, SocketId = ${socket.id}`);
            delete userSocketMap[userId]; //key delete kar rahe hai
        }

        io.emit('getOnlineUsers' , Object.keys(userSocketMap));
    })
})


export {app ,server, io} 