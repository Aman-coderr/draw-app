import { Game } from "../draw/Game.js";
export async function initDraw(canvas: HTMLCanvasElement, roomId: number, socket: WebSocket, currentShape: "rect" | "ellipse" | "pointer" | "line" | null) {
  const game = new Game(canvas, roomId, socket);
  game.setCurrentShape(currentShape);

  return {
    game: game,
    cleanup: () => {
    }
  };
}
