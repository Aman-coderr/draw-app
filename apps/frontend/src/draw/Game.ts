import axios from 'axios';

type Shape = {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
} | {
  type: "ellipse";
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
} | {
  type: "pointer";
  points: { x: number; y: number }[];
} | {
  type: "line";
  x: number;
  y: number;
  endX: number;
  endY: number;
} | {
  type: "eraser";
  points: { x: number; y: number }[];
}

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
  private currentShape: "rect" | "ellipse" | "pointer" | "line" | "eraser" | null;
  private snapshot: ImageData | null;
  socket: WebSocket;
  private currentPoints: { x: number; y: number }[] = [];
  private eraserRadius: number = 8;

  constructor(canvas: HTMLCanvasElement, roomId: number, socket: WebSocket) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not get canvas context");
    }
    this.ctx = context;
    this.existingShapes = [];
    this.roomId = roomId;
    this.socket = socket;
    this.clicked = false;
    this.currentShape = null;
    this.snapshot = null;
    this.init();
    this.initHandlers();
    this.initMouseHandlers();
  }

  setCurrentShape(shape: "rect" | "ellipse" | "pointer" | "line" | "eraser" | null) {
    this.currentShape = shape;
  }

  private bresenhamLine(x0: number, y0: number, x1: number, y1: number): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);

    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;

    let err = dx - dy;

    let x = x0;
    let y = y0;

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

  async init() {
    if (!this.ctx) {
      console.error("Canvas Context Missing");
      return;
    }

    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    try {
      this.existingShapes = await this.getExistingShapes();
      this.clearCanvas();
      this.snapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    } catch (error) {
      console.error("Failed to load existing shapes:", error);
      this.snapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
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
          this.snapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        }
      } catch (error) {
        console.error("Error handling socket message:", error);
      }
    };
  }

  clearCanvas() {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);


    this.existingShapes
      .filter(shape => shape.type !== "eraser")
      .forEach(shape => {
        this.ctx.strokeStyle = "rgba(255,255,255,1)";
        this.ctx.lineWidth = 2;

        if (shape.type === "rect") {
          this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        }
        if (shape.type === "ellipse") {
          this.ctx.beginPath();
          this.ctx.ellipse(shape.centerX, shape.centerY, shape.radiusX, shape.radiusY, 0, 0, 2 * Math.PI);
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
          shape.points.forEach(p => {
            this.ctx.fillRect(p.x, p.y, 2, 2);
          });
        }
      });


    this.ctx.globalCompositeOperation = "destination-out";

    this.existingShapes
      .filter(shape => shape.type === "eraser")
      .forEach(shape => {
        shape.points.forEach(point => {
          this.ctx.beginPath();
          this.ctx.arc(point.x, point.y, this.eraserRadius, 0, Math.PI * 2, false);
          this.ctx.fill();
        });
      });

    this.ctx.globalCompositeOperation = "source-over";
  }


  initMouseHandlers() {
    this.canvas.addEventListener("mousedown", (e) => {
      this.clicked = true;
      this.startX = e.offsetX;
      this.startY = e.offsetY;
      this.lastX = this.startX;
      this.lastY = this.startY;

      if (this.currentShape === "pointer" || this.currentShape === "eraser") {
        this.currentPoints = [{ x: e.offsetX, y: e.offsetY }];
      }

      this.snapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    });

    this.canvas.addEventListener("mouseup", (e) => {
      this.clicked = false;
      let shape: Shape | null = null;

      if (this.currentShape === "pointer") {
        shape = {
          type: "pointer",
          points: this.currentPoints
        };
      }

      if (this.currentShape === "eraser") {
        shape = {
          type: "eraser",
          points: this.currentPoints
        };
      }

      if (this.currentShape === "rect") {
        const width = e.offsetX - this.startX;
        const height = e.offsetY - this.startY;
        shape = {
          type: "rect",
          x: this.startX,
          y: this.startY,
          width,
          height
        };
      }

      if (this.currentShape === "ellipse") {
        const centerX = (e.offsetX + this.startX) / 2;
        const centerY = (e.offsetY + this.startY) / 2;
        const radiusX = Math.abs(e.offsetX - this.startX) / 2;
        const radiusY = Math.abs(e.offsetY - this.startY) / 2;
        shape = {
          type: "ellipse",
          centerX,
          centerY,
          radiusX,
          radiusY
        };
      }

      if (this.currentShape === "line") {
        const endX = e.offsetX;
        const endY = e.offsetY;
        shape = {
          type: "line",
          x: this.startX,
          y: this.startY,
          endX,
          endY
        };
      }

      if (!shape) return;

      this.existingShapes.push(shape);
      this.clearCanvas();
      this.snapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

      try {
        this.socket.send(JSON.stringify({
          type: "chat",
          message: JSON.stringify({ shape }),
          roomId: this.roomId
        }));
      } catch (error) {
        console.error("Failed to send shape:", error);
      }

      // IMPORTANT FIX
      this.currentPoints = [];
    });

    this.canvas.addEventListener("mousemove", (e) => {
      if (this.clicked) {
        let mouseX = e.offsetX;
        let mouseY = e.offsetY;

        const width = e.offsetX - this.startX;
        const height = e.offsetY - this.startY;
        const centerX = (e.offsetX + this.startX) / 2;
        const centerY = (e.offsetY + this.startY) / 2;
        const radiusX = Math.abs(e.offsetX - this.startX) / 2;
        const radiusY = Math.abs(e.offsetY - this.startY) / 2;

        if (this.currentShape === "pointer") {
          const linePoints = this.bresenhamLine(this.lastX, this.lastY, mouseX, mouseY);
          this.ctx.fillStyle = "rgba(255,255,255,1)";

          linePoints.forEach(point => {
            this.ctx.fillRect(point.x, point.y, 2, 2);
            this.currentPoints.push({ x: point.x, y: point.y });
          });

          this.lastX = mouseX;
          this.lastY = mouseY;
          return;
        }

        if (this.currentShape === "eraser") {
          const linePoints = this.bresenhamLine(this.lastX, this.lastY, mouseX, mouseY);

          this.ctx.globalCompositeOperation = "destination-out";
          linePoints.forEach(point => {
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, this.eraserRadius, 0, Math.PI * 2, false);
            this.ctx.fill();

            // store actual erase points
            this.currentPoints.push({ x: point.x, y: point.y });
          });
          this.ctx.globalCompositeOperation = "source-over";

          this.lastX = mouseX;
          this.lastY = mouseY;
          return;
        }

        if (this.snapshot) {
          this.ctx.putImageData(this.snapshot, 0, 0);
        }
        this.ctx.strokeStyle = "rgba(255,255,255,1)";
        this.ctx.lineWidth = 2;

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
          this.ctx.lineTo(e.offsetX, e.offsetY);
          this.ctx.stroke();
        }
      }
    });
  }

  async getExistingShapes(): Promise<Shape[]> {
    try {
      const res = await axios.get(`http://localhost:3000/chats/${this.roomId}`);
      let messages;
      if (res.data.messages) {
        messages = res.data.messages;
      } else if (Array.isArray(res.data)) {
        messages = res.data;
      } else {
        console.error("Unexpected response format:", res.data);
        return [];
      }

      if (!Array.isArray(messages)) {
        console.error("Messages is not an array:", messages);
        return [];
      }

      const shapes = messages
        .map((x: any) => {
          try {
            const messageData = typeof x.message === 'string'
              ? JSON.parse(x.message)
              : x.message;
            return messageData.shape;
          } catch (e) {
            console.error("Failed to parse message:", x.message, e);
            return null;
          }
        })
        .filter((shape: any) => shape !== null && shape !== undefined);

      return shapes;
    } catch (error: any) {
      console.error("Failed to fetch existing shapes:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: `http://localhost:3000/chats/${this.roomId}`
      });
      return [];
    }
  }
}

