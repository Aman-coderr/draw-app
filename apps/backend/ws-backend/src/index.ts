import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import {
  prismaClient,
  disconnectDatabase,
  connectDatabase,
} from "@drawapp/db/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });
const wss = new WebSocketServer({ port: 8080 });
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

initDatabase().then(() => {
  console.log("WebSocket server starting on port 8080");
});

async function initDatabase() {
  try {
    await connectDatabase();
    console.log("Database initialized");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  wss.clients.forEach((client) => {
    client.close(1001, "Server shutting down");
  });

  wss.close(() => {
    console.log("WebSocket server closed");
  });

  await disconnectDatabase();
  console.log("Graceful shutdown complete");
  process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

async function saveChatWithRetry(
  roomId: number,
  message: string,
  userId: string,
  retries = 3,
) {
  for (let i = 0; i < retries; i++) {
    try {
      await prismaClient.chat.create({
        data: {
          roomId,
          message,
          userId,
        },
      });
      return;
    } catch (error) {
      console.error(`Database error (attempt ${i + 1}/${retries}):`, error);
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      } else {
        throw error;
      }
    }
  }
}

interface User {
  ws: WebSocket;
  rooms: string[];
  userId: string;
}

const users: User[] = [];

function checkUser(token: string): string | null {
  try {
    const decodedData = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (typeof decodedData === "string") {
      return null;
    }

    if (!decodedData || !decodedData.id) {
      return null;
    }

    return decodedData.id;
  } catch (e) {
    console.log(e);
    return null;
  }
}
wss.on("connection", async function (ws, request) {
  const url = request.url;
  if (!url) {
    return;
  }
  const queryParams = new URLSearchParams(url.split("?")[1]);
  const userToken = queryParams.get("token") || "";
  const userAuthenticated = checkUser(userToken);

  if (userAuthenticated === null) {
    ws.close();
    return;
  }

  users.push({
    ws,
    userId: userAuthenticated,
    rooms: [],
  });

  ws.on("message", async (message) => {
    let parsedData;
    if (typeof message != "string") {
      parsedData = JSON.parse(message.toString());
    } else {
      parsedData = JSON.parse(message);
    }
    if (parsedData.type === "join_room") {
      const user = users.find((x) => x.ws === ws);
      const roomId = String(parsedData.roomId);

      if (user && !user.rooms.includes(parsedData.roomId)) {
        user.rooms.push(parsedData.roomId);
      }
    }

    if (parsedData.type === "leave_room") {
      const user = users.find((x) => x.ws === ws);

      if (!user) {
        return;
      }
      const roomId = String(parsedData.roomId);
      user.rooms = user.rooms.filter((x) => x !== parsedData.roomId);
    }

    if (parsedData.type === "chat") {
      const roomId = parsedData.roomId;
      const message = parsedData.message;

      try {
        await saveChatWithRetry(Number(roomId), message, userAuthenticated);
      } catch (error) {
        console.error("Failed to save chat after retries:", error);
        ws.send(
          JSON.stringify({ type: "error", message: "Failed to send message" }),
        );
      }

      users.forEach((user) => {
        if (user.rooms.includes(roomId)) {
          try {
            user.ws.send(
              JSON.stringify({
                type: "chat",
                message: message,
                roomId,
              }),
            );
          } catch (e) {
            console.log(e);
          }
        }
      });
    }
  });
});
