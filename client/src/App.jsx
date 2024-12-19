import React, { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import "./index.css";

const socket = io("https://video-call-app-lwxn.onrender.com"); // Replace with your server URL

function App() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const [roomId, setRoomId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    socket.on("user-joined", async () => {
      console.log("Another user joined the room");
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      socket.emit("webrtc-signal", { target: roomId, signal: offer });
    });

    socket.on("webrtc-signal", async (data) => {
      console.log("Signal received:", data);

      if (data.signal.type === "offer") {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.signal));
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.emit("webrtc-signal", { target: data.sender, signal: answer });
      } else if (data.signal.type === "answer") {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.signal));
      } else if (data.signal.candidate) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
      }
    });

    return () => {
      socket.off("user-joined");
      socket.off("webrtc-signal");
    };
  }, []);

  const setupPeerConnection = (stream) => {
    peerConnection.current = new RTCPeerConnection();

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc-signal", { target: roomId, signal: event.candidate });
      }
    };

    peerConnection.current.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    stream.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, stream);
    });
  };

  const joinRoom = async () => {
    try {
      socket.emit("join-room", roomId);
      setIsConnected(true);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setupPeerConnection(stream);
      setIsReady(true);
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-800 text-white flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-5">Video Call App</h1>
      {!isConnected ? (
        <div className="flex flex-col items-center space-y-4">
          <input
            type="text"
            className="mb-3 p-2 rounded text-black"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded"
            onClick={joinRoom}
          >
            Join Room
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-5">
          <div className="flex space-x-5">
            {isReady && (
              <>
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  className="w-1/3 h-auto border-4 border-blue-500 rounded"
                />
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  className="w-1/3 h-auto border-4 border-green-500 rounded"
                />
              </>
            )}
          </div>
          <p className="text-lg font-semibold">You are in Room: {roomId}</p>
        </div>
      )}
    </div>
  );
}

export default App;
