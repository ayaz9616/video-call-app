const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://video-call-app-virid.vercel.app/", // Update this if Vite runs on a different port
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join a room
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
    socket.to(roomId).emit("user-joined", socket.id); // Notify other users in the room
  });

  // Handle WebRTC signaling
  socket.on("webrtc-signal", (data) => {
    console.log(`Signal from ${socket.id} to ${data.target}`);
    io.to(data.target).emit("webrtc-signal", {
      sender: socket.id,
      signal: data.signal,
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
