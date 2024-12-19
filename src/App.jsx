import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const App = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const [roomId, setRoomId] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  const servers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  useEffect(() => {
    // Handle signaling messages
    socket.on("webrtc-signal", async (data) => {
      if (data.signal.type === "offer") {
        const peerConnection = createPeerConnection();
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit("webrtc-signal", {
          target: data.sender,
          signal: answer,
        });
      } else if (data.signal.type === "answer") {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.signal));
      } else if (data.signal.candidate) {
        const candidate = new RTCIceCandidate(data.signal.candidate);
        peerConnectionRef.current.addIceCandidate(candidate);
      }
    });

    return () => socket.off("webrtc-signal");
  }, []);

  const createPeerConnection = () => {
    const peerConnection = new RTCPeerConnection(servers);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc-signal", {
          target: roomId,
          signal: event.candidate,
        });
      }
    };

    peerConnection.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  };

  const joinRoom = () => {
    socket.emit("join-room", roomId);
    setIsConnected(true);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      localVideoRef.current.srcObject = stream;

      const peerConnection = createPeerConnection();
      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

      peerConnection.createOffer().then((offer) => {
        peerConnection.setLocalDescription(offer);
        socket.emit("webrtc-signal", { target: roomId, signal: offer });
      });
    });
  };

  return (
    <div>
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
          <video ref={localVideoRef} autoPlay playsInline  style={{ width: "300px", margin: "10px" }} />
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "300px", margin: "10px" }} />
        </div>
      )}
    </div>
  );
};

export default App;
