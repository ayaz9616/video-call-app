import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("https://video-call-app-lwxn.onrender.com"); // Replace with your deployed backend URL

const App = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnections = useRef({});
  const [roomId, setRoomId] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  const servers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  useEffect(() => {
    // Handle user joined
    socket.on("user-joined", (newUserId) => {
      console.log("New user joined:", newUserId);
      createOffer(newUserId);
    });

    // Handle WebRTC signaling
    socket.on("webrtc-signal", async (data) => {
      const { sender, signal } = data;

      if (!peerConnections.current[sender]) {
        createPeerConnection(sender);
      }

      const peerConnection = peerConnections.current[sender];

      if (signal.type === "offer") {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit("webrtc-signal", { target: sender, signal: answer });
      } else if (signal.type === "answer") {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
      } else if (signal.candidate) {
        peerConnection.addIceCandidate(new RTCIceCandidate(signal));
      }
    });

    return () => {
      socket.off("user-joined");
      socket.off("webrtc-signal");
    };
  }, []);

  const createPeerConnection = (userId) => {
    const peerConnection = new RTCPeerConnection(servers);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc-signal", {
          target: userId,
          signal: event.candidate,
        });
      }
    };

    peerConnection.ontrack = (event) => {
      console.log("Received remote stream");
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    peerConnections.current[userId] = peerConnection;
    return peerConnection;
  };

  const createOffer = async (userId) => {
    const peerConnection = createPeerConnection(userId);

    const stream = localVideoRef.current.srcObject;
    stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit("webrtc-signal", { target: userId, signal: offer });
  };

  const joinRoom = async () => {
    socket.emit("join-room", roomId);
    setIsConnected(true);

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoRef.current.srcObject = stream;
  };

  return (
    <div>
      <h1>AYAZ</h1>
      <h1>Video Call App</h1>
      {!isConnected ? (
        <div>
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      ) : (
        <div>
          <video ref={localVideoRef} autoPlay playsInline style={{ width: "300px", margin: "10px" }} />
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "300px", margin: "10px" }} />
        </div>
      )}
    </div>
  );
};

export default App;
