import { useState, useEffect, useRef } from 'react';
import { Canvas } from "./Canvas.js";

export function RoomCanvas({ roomId }: { roomId: number }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "reconnecting">("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let destroyed = false;

    function connect() {
      const token = localStorage.getItem("token");
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
      const ws = new WebSocket(`${wsUrl}?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (destroyed) { ws.close(); return; }
        setStatus("connected");
        setSocket(ws);
        ws.send(JSON.stringify({ type: "join_room", roomId }));
      };

      ws.onclose = () => {
        if (destroyed) return;
        setStatus("reconnecting");
        setSocket(null);
        // Auto-reconnect after 2s
        reconnectTimer.current = setTimeout(connect, 2000);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      destroyed = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [roomId]);

  if (!socket) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg font-medium">
            {status === "reconnecting" ? "Reconnecting..." : "Connecting to Server..."}
          </p>
        </div>
      </div>
    );
  }

  return <Canvas roomId={roomId} socket={socket} />;
}
