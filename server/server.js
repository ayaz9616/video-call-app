const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://video-call-app-virid.vercel.app", // Allow your frontend domain
    methods: ["GET", "POST"],
  },
});

// Add this line to enable CORS for the express app (not just socket.io)
app.use(cors({ origin: "https://video-call-app-virid.vercel.app" }));

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join a room
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
    socket.to(roomId).emit("user-joined", socket.id);
  });

  // Handle WebRTC signaling
  socket.on("webrtc-signal", (data) => {
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
