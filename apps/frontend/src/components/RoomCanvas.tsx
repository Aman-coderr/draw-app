import { useState, useEffect } from 'react';
import { Canvas } from "./Canvas.js";
export function RoomCanvas({ roomId }: { roomId: number }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const ws = new WebSocket(`ws://localhost:8080?token=${token}`);

    ws.onopen = () => {
      setSocket(ws);
      ws.send(JSON.stringify({
        type: "join_room",
        roomId
      }))
    }
  }, [])

  if (!socket) {
    return <div>
      Connecting to Server...
    </div>
  }
  return (
    <div>
      <Canvas roomId={roomId} socket={socket} />
    </div>
  )
}
