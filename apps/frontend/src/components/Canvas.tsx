import { Circle, Pencil, RectangleHorizontalIcon, Eraser, EllipsisVertical } from "lucide-react";
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
      // Set black background immediately
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
      if (cleanup) {
        cleanup();
      }
    };
  }, [roomId, socket]); // ADD dependencies

  useEffect(() => {
    if (game) {
      game.setCurrentShape(currentShape);
    }
  }, [currentShape, game]);

  const btnStyle = (shape: string) =>
    `p-2 rounded transition 
     ${currentShape === shape ? "bg-blue-600" : "bg-gray-700"} 
     hover:bg-gray-600 cursor-pointer`;

  return (
    <div className="w-max">
      <div className="relative inline-block">
        <canvas
          ref={canvasRef}
          width={1536}
          height={695}
          style={{ backgroundColor: "black" }} // ADD inline style as backup
        />
        <div className="absolute top-0 grid grid-cols-5 gap-5 rounded p-2">
          <div
            className={btnStyle("ellipse")}
            onClick={() => setCurrentShape("ellipse")}
          >
            <Circle color="white" />
          </div>
          <div
            className={btnStyle("rect")}
            onClick={() => setCurrentShape("rect")}
          >
            <RectangleHorizontalIcon color="white" />
          </div>
          <div
            className={btnStyle("pointer")}
            onClick={() => setCurrentShape("pointer")}
          >
            <Pencil color="white" />
          </div>
          <div
            className={btnStyle("eraser")}
            onClick={() => setCurrentShape("eraser")}>
            <Eraser color="white" />
          </div>
          <div
            className={btnStyle("line")}
            onClick={() => setCurrentShape("line")}>
            <EllipsisVertical color="white" />
          </div>
        </div>
      </div>
    </div>
  );
}

