import { Circle, Pencil, RectangleHorizontalIcon, Eraser, Slash } from "lucide-react";
import { initDraw } from "../pages/Canvas.js";
import { useState, useEffect, useRef } from "react";
import { Game } from "../draw/Game.js";

export function Canvas({ roomId, socket }: { roomId: number, socket: WebSocket }) {
  const [currentShape, setCurrentShape] = useState<"rect" | "ellipse" | "pointer" | "line" | "eraser" | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (canvasRef.current && !game) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }

      initDraw(canvasRef.current, roomId, socket, currentShape).then((result) => {
        if (result) {
          setGame(result.game);
          cleanup = result.cleanup;
        }
      }).catch((error) => {
        console.error("Failed to initialize draw:", error);
      });
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [roomId, socket]);

  useEffect(() => {
    if (game) {
      game.setCurrentShape(currentShape);
    }
  }, [currentShape, game]);

  const btnStyle = (shape: string) =>
    `flex items-center justify-center w-11 h-11 sm:w-10 sm:h-10 rounded-lg transition-all duration-150 active:scale-95
     ${currentShape === shape
      ? "bg-blue-600 shadow-lg shadow-blue-900/50"
      : "bg-gray-700 hover:bg-gray-600"
    } cursor-pointer`;

  const tools: { shape: "rect" | "ellipse" | "pointer" | "line" | "eraser"; icon: React.ReactNode; label: string }[] = [
    { shape: "pointer", icon: <Pencil size={20} color="white" />, label: "Pen" },
    { shape: "rect", icon: <RectangleHorizontalIcon size={20} color="white" />, label: "Rect" },
    { shape: "ellipse", icon: <Circle size={20} color="white" />, label: "Circle" },
    { shape: "line", icon: <Slash size={20} color="white" />, label: "Line" },
    { shape: "eraser", icon: <Eraser size={20} color="white" />, label: "Erase" },
  ];

  return (

    <div className="fixed inset-0 overflow-hidden bg-black">

      <canvas
        ref={canvasRef}
        className="block w-full h-full touch-none"
        style={{ backgroundColor: "black" }}
      />


      <div
        className="
          fixed z-20 flex gap-2 p-2 rounded-xl
          bg-gray-800/90 backdrop-blur-sm shadow-2xl border border-gray-700

          /* mobile: bottom bar */
          bottom-4 left-1/2 -translate-x-1/2

          /* tablet/desktop: top-left */
          sm:bottom-auto sm:top-4 sm:left-4 sm:translate-x-0
        "
      >
        {tools.map(({ shape, icon, label }) => (
          <button
            key={shape}
            className={btnStyle(shape)}
            onClick={() => setCurrentShape(shape)}
            title={label}
            aria-label={label}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}
