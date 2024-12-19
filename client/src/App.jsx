import React, { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("https://video-call-app-lwxn.onrender.com"); // Replace with your server URL

function App() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [roomId, setRoomId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    socket.on("user-joined", () => {
      console.log("Another user joined the room");
    });

    socket.on("webrtc-signal", async (data) => {
      // Handle signals (offer, answer, ice candidate)
    });

    return () => {
      socket.off("user-joined");
      socket.off("webrtc-signal");
    };
  }, []);

  const joinRoom = () => {
    socket.emit("join-room", roomId);
    setIsConnected(true);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;
        setIsReady(true);
      });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-3xl mb-5">Video Call App</h1>
      {!isConnected ? (
        <div className="flex flex-col items-center">
          <input
            type="text"
            className="mb-3 p-2 rounded"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button
            className="p-2 bg-blue-600 rounded"
            onClick={joinRoom}
          >
            Join Room
          </button>
        </div>
      ) : (
        <div className="flex space-x-5">
          {isReady && (
            <>
              <video ref={localVideoRef} autoPlay muted className="w-1/3 rounded" />
              <video ref={remoteVideoRef} autoPlay className="w-1/3 rounded" />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
