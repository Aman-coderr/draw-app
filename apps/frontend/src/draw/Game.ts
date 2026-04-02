import axios from "axios";

type Shape =
  | {
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      type: "ellipse";
      centerX: number;
      centerY: number;
      radiusX: number;
      radiusY: number;
    }
  | {
      type: "pointer";
      points: { x: number; y: number }[];
    }
  | {
      type: "line";
      x: number;
      y: number;
      endX: number;
      endY: number;
    }
  | {
      type: "eraser";
      points: { x: number; y: number }[];
    };

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private existingShapes: Shape[];
  private roomId: number;
  private clicked: boolean;
  private startX: number = 0;
  private startY: number = 0;
  private lastX: number = 0;
  private lastY: number = 0;
  private currentShape:
    | "rect"
    | "ellipse"
    | "pointer"
    | "line"
    | "eraser"
    | null;
  private snapshot: ImageData | null;
  socket: WebSocket;
  private currentPoints: { x: number; y: number }[] = [];
  private eraserRadius: number = 12;

  private boundMouseDown: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundTouchStart: (e: TouchEvent) => void;
  private boundTouchEnd: (e: TouchEvent) => void;
  private boundTouchMove: (e: TouchEvent) => void;
  private boundResize: () => void;

  constructor(canvas: HTMLCanvasElement, roomId: number, socket: WebSocket) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not get canvas context");
    this.ctx = context;
    this.existingShapes = [];
    this.roomId = roomId;
    this.socket = socket;
    this.clicked = false;
    this.currentShape = null;
    this.snapshot = null;

    this.boundMouseDown = this.onMouseDown.bind(this);
    this.boundMouseUp = this.onMouseUp.bind(this);
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundTouchStart = this.onTouchStart.bind(this);
    this.boundTouchEnd = this.onTouchEnd.bind(this);
    this.boundTouchMove = this.onTouchMove.bind(this);
    this.boundResize = this.onResize.bind(this);

    this.init();
    this.initHandlers();
    this.initMouseHandlers();
    this.initTouchHandlers();
    this.initResizeHandler();
  }

  setCurrentShape(
    shape: "rect" | "ellipse" | "pointer" | "line" | "eraser" | null,
  ) {
    this.currentShape = shape;
  }

  // ── Resize ────────────────────────────────────────────────────────────────────
  private onResize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.clearCanvas();
    this.snapshot = this.ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height,
    );
  }

  private initResizeHandler() {
    window.addEventListener("resize", this.boundResize);
  }

  // ── Touch coords ──────────────────────────────────────────────────────────────
  private getTouchPos(touch: Touch): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  }

  // ── Shared pointer logic ──────────────────────────────────────────────────────
  private handlePointerDown(x: number, y: number) {
    this.clicked = true;
    this.startX = x;
    this.startY = y;
    this.lastX = x;
    this.lastY = y;
    if (this.currentShape === "pointer" || this.currentShape === "eraser") {
      this.currentPoints = [{ x, y }];
    }
    this.snapshot = this.ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height,
    );
  }

  private handlePointerUp(x: number, y: number) {
    this.clicked = false;
    let shape: Shape | null = null;

    if (this.currentShape === "pointer") {
      shape = { type: "pointer", points: this.currentPoints };
    }
    if (this.currentShape === "eraser") {
      shape = { type: "eraser", points: this.currentPoints };
    }
    if (this.currentShape === "rect") {
      shape = {
        type: "rect",
        x: this.startX,
        y: this.startY,
        width: x - this.startX,
        height: y - this.startY,
      };
    }
    if (this.currentShape === "ellipse") {
      const centerX = (x + this.startX) / 2;
      const centerY = (y + this.startY) / 2;
      const radiusX = Math.abs(x - this.startX) / 2;
      const radiusY = Math.abs(y - this.startY) / 2;
      shape = { type: "ellipse", centerX, centerY, radiusX, radiusY };
    }
    if (this.currentShape === "line") {
      shape = {
        type: "line",
        x: this.startX,
        y: this.startY,
        endX: x,
        endY: y,
      };
    }

    if (!shape) return;

    this.existingShapes.push(shape);
    this.clearCanvas();
    this.snapshot = this.ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height,
    );

    try {
      this.socket.send(
        JSON.stringify({
          type: "chat",
          message: JSON.stringify({ shape }),
          roomId: this.roomId,
        }),
      );
    } catch (error) {
      console.error("Failed to send shape:", error);
    }
    this.currentPoints = [];
  }

  private handlePointerMove(x: number, y: number) {
    if (!this.clicked) return;

    if (this.currentShape === "pointer") {
      const linePoints = this.bresenhamLine(this.lastX, this.lastY, x, y);
      this.ctx.fillStyle = "rgba(255,255,255,1)";
      linePoints.forEach((point) => {
        this.ctx.fillRect(point.x, point.y, 2, 2);
        this.currentPoints.push(point);
      });
      this.lastX = x;
      this.lastY = y;
      return;
    }

    if (this.currentShape === "eraser") {
      const linePoints = this.bresenhamLine(this.lastX, this.lastY, x, y);
      // ✅ KEY FIX: source-over + black fill. Never use destination-out.
      this.ctx.globalCompositeOperation = "source-over";
      this.ctx.fillStyle = "#000000";
      linePoints.forEach((point) => {
        this.ctx.beginPath();
        this.ctx.arc(
          point.x,
          point.y,
          this.eraserRadius,
          0,
          Math.PI * 2,
          false,
        );
        this.ctx.fill();
        this.currentPoints.push(point);
      });
      this.lastX = x;
      this.lastY = y;
      return;
    }

    if (this.snapshot) {
      this.ctx.putImageData(this.snapshot, 0, 0);
    }
    this.ctx.strokeStyle = "rgba(255,255,255,1)";
    this.ctx.lineWidth = 2;

    const width = x - this.startX;
    const height = y - this.startY;
    const centerX = (x + this.startX) / 2;
    const centerY = (y + this.startY) / 2;
    const radiusX = Math.abs(x - this.startX) / 2;
    const radiusY = Math.abs(y - this.startY) / 2;

    if (this.currentShape === "rect") {
      this.ctx.strokeRect(this.startX, this.startY, width, height);
    }
    if (this.currentShape === "ellipse") {
      this.ctx.beginPath();
      this.ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      this.ctx.stroke();
    }
    if (this.currentShape === "line") {
      this.ctx.beginPath();
      this.ctx.moveTo(this.startX, this.startY);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
    }
  }

  // ── Mouse handlers ────────────────────────────────────────────────────────────
  private onMouseDown(e: MouseEvent) {
    this.handlePointerDown(e.offsetX, e.offsetY);
  }
  private onMouseUp(e: MouseEvent) {
    this.handlePointerUp(e.offsetX, e.offsetY);
  }
  private onMouseMove(e: MouseEvent) {
    this.handlePointerMove(e.offsetX, e.offsetY);
  }

  // ── Touch handlers ────────────────────────────────────────────────────────────
  private onTouchStart(e: TouchEvent) {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    const pos = this.getTouchPos(touch);
    this.handlePointerDown(pos.x, pos.y);
  }
  private onTouchEnd(e: TouchEvent) {
    e.preventDefault();
    const touch = e.changedTouches[0];
    if (!touch) return;
    const pos = this.getTouchPos(touch);
    this.handlePointerUp(pos.x, pos.y);
  }
  private onTouchMove(e: TouchEvent) {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    const pos = this.getTouchPos(touch);
    this.handlePointerMove(pos.x, pos.y);
  }

  // ── Register / destroy ────────────────────────────────────────────────────────
  initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.boundMouseDown);
    this.canvas.addEventListener("mouseup", this.boundMouseUp);
    this.canvas.addEventListener("mousemove", this.boundMouseMove);
  }

  initTouchHandlers() {
    this.canvas.addEventListener("touchstart", this.boundTouchStart, {
      passive: false,
    });
    this.canvas.addEventListener("touchend", this.boundTouchEnd, {
      passive: false,
    });
    this.canvas.addEventListener("touchmove", this.boundTouchMove, {
      passive: false,
    });
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this.boundMouseDown);
    this.canvas.removeEventListener("mouseup", this.boundMouseUp);
    this.canvas.removeEventListener("mousemove", this.boundMouseMove);
    this.canvas.removeEventListener("touchstart", this.boundTouchStart);
    this.canvas.removeEventListener("touchend", this.boundTouchEnd);
    this.canvas.removeEventListener("touchmove", this.boundTouchMove);
    window.removeEventListener("resize", this.boundResize);
  }

  // ── Bresenham ─────────────────────────────────────────────────────────────────
  private bresenhamLine(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
  ): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const dx = Math.abs(x1 - x0),
      dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1,
      sy = y0 < y1 ? 1 : -1;
    let err = dx - dy,
      x = x0,
      y = y0;
    while (true) {
      points.push({ x, y });
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
    return points;
  }

  // ── Init ──────────────────────────────────────────────────────────────────────
  async init() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    try {
      this.existingShapes = await this.getExistingShapes();
      this.clearCanvas();
      this.snapshot = this.ctx.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height,
      );
    } catch (error) {
      console.error("Failed to load existing shapes:", error);
      this.snapshot = this.ctx.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height,
      );
    }
  }

  initHandlers() {
    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "chat") {
          const parsedShape = JSON.parse(message.message);
          this.existingShapes.push(parsedShape.shape);
          this.clearCanvas();
          this.snapshot = this.ctx.getImageData(
            0,
            0,
            this.canvas.width,
            this.canvas.height,
          );
        }
      } catch (error) {
        console.error("Error handling socket message:", error);
      }
    };
  }

  // ── clearCanvas ───────────────────────────────────────────────────────────────
  clearCanvas() {
    // ✅ Always reset to normal mode first — critical safety net
    this.ctx.globalCompositeOperation = "source-over";

    // 1. Solid black background
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 2. Replay all shapes in insertion order so eraser correctly covers earlier shapes
    this.existingShapes.forEach((shape) => {
      if (shape.type === "eraser") {
        // ✅ Black fill — NOT destination-out. This means you can draw on top again.
        this.ctx.globalCompositeOperation = "source-over";
        this.ctx.fillStyle = "#000000";
        shape.points.forEach((point) => {
          this.ctx.beginPath();
          this.ctx.arc(
            point.x,
            point.y,
            this.eraserRadius,
            0,
            Math.PI * 2,
            false,
          );
          this.ctx.fill();
        });
        return;
      }

      this.ctx.strokeStyle = "rgba(255,255,255,1)";
      this.ctx.lineWidth = 2;

      if (shape.type === "rect") {
        this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      }
      if (shape.type === "ellipse") {
        this.ctx.beginPath();
        this.ctx.ellipse(
          shape.centerX,
          shape.centerY,
          shape.radiusX,
          shape.radiusY,
          0,
          0,
          2 * Math.PI,
        );
        this.ctx.stroke();
      }
      if (shape.type === "line") {
        this.ctx.beginPath();
        this.ctx.moveTo(shape.x, shape.y);
        this.ctx.lineTo(shape.endX, shape.endY);
        this.ctx.stroke();
      }
      if (shape.type === "pointer") {
        this.ctx.fillStyle = "rgba(255,255,255,1)";
        shape.points.forEach((p) => {
          this.ctx.fillRect(p.x, p.y, 2, 2);
        });
      }
    });
  }

  // ── Fetch existing shapes ─────────────────────────────────────────────────────
  async getExistingShapes(): Promise<Shape[]> {
    const backendUrl =
      import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
    try {
      const res = await axios.get(`${backendUrl}/chats/${this.roomId}`);
      const messages =
        res.data.messages ?? (Array.isArray(res.data) ? res.data : null);
      if (!Array.isArray(messages)) return [];
      return messages
        .map((x: any) => {
          try {
            const data =
              typeof x.message === "string" ? JSON.parse(x.message) : x.message;
            return data.shape;
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    } catch (error: any) {
      console.error("Failed to fetch existing shapes:", error.message);
      return [];
    }
  }
}
