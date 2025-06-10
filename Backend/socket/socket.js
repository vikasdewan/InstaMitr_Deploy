import { Server } from "socket.io";
import express from "express";
import http from "http";

const app = express();
const server = http.createServer(app);

const io = new Server(server,{
    cors:{
        origin:"https://instamitr.onrender.com",
        methods:['GET' , 'POST']
  }
});

const userSocketMap = {}; // userId -> socketId
const activeCalls = {}; // Track active calls: { callId: { participants: [userId1, userId2] } }

export const getRecieverSocketId = (receiverId) => userSocketMap[receiverId];

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log(`User Connected: UserId = ${userId}, SocketId = ${socket.id}`);
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap)) //ye event emit karta hai , jo client side(frontend) par event listener hai,

    socket.on('disconnect',()=>{
    if(userId){
      console.log(`User Disconnected :  UserId = ${userId}, SocketId = ${socket.id}`);
      delete userSocketMap[userId]; //key delete kar rahe hai
    }

        io.emit('getOnlineUsers' , Object.keys(userSocketMap));
  });
});

export { app, server, io };