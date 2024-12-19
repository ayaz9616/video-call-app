const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// Replace with your actual frontend URL
const FRONTEND_URL = "https://video-call-app-virid.vercel.app/";

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL, // Set frontend URL
    methods: ["GET", "POST"],
  },
});

// WebSocket and signaling logic
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













// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const cors = require("cors");

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "https://video-call-app-virid.vercel.app", // Allow your frontend domain
//     methods: ["GET", "POST"],
//   },
// });

// // Add this line to enable CORS for the express app (not just socket.io)
// app.use(cors({ origin: "https://video-call-app-virid.vercel.app" }));

// io.on("connection", (socket) => {
//   console.log("User connected:", socket.id);

//   // Join a room
//   socket.on("join-room", (roomId) => {
//     socket.join(roomId);
//     console.log(`User ${socket.id} joined room ${roomId}`);
//     socket.to(roomId).emit("user-joined", socket.id);
//   });

//   // Handle WebRTC signaling
//   socket.on("webrtc-signal", (data) => {
//     io.to(data.target).emit("webrtc-signal", {
//       sender: socket.id,
//       signal: data.signal,
//     });
//   });

//   // Handle disconnection
//   socket.on("disconnect", () => {
//     console.log("User disconnected:", socket.id);
//   });
// });

// server.listen(5000, () => {
//   console.log("Server running on http://localhost:5000");
// });
