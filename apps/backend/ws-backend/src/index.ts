import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { prismaClient } from '@drawapp/db/client';
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });
const wss = new WebSocketServer({ port: 8080 });
const JWT_SECRET = process.env.JWT_SECRET;

interface User {
  ws: WebSocket,
  rooms: string[],
  userId: string,
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

  }

  catch (e) {
    console.log(e);
    return null;
  }

}
wss.on("connection", async function (ws, request) {
  const url = request.url;
  if (!url) {
    return;
  }
  const queryParams = new URLSearchParams(url.split('?')[1]);
  const userToken = queryParams.get('token') || "";
  const userAuthenticated = checkUser(userToken);

  if (userAuthenticated === null) {
    ws.close();
    return;
  }

  users.push({
    ws,
    userId: userAuthenticated,
    rooms: []
  })

  ws.on("message", async (message) => {
    let parsedData;
    if (typeof message != "string") {
      parsedData = JSON.parse(message.toString());
    }
    else {
      parsedData = JSON.parse(message);
    }
    if (parsedData.type === "join_room") {
      const user = users.find(x => x.ws === ws);
      const roomId = String(parsedData.roomId);

      if (user && !user.rooms.includes(parsedData.roomId)) {
        user.rooms.push(parsedData.roomId);
      }
    }

    if (parsedData.type === "leave_room") {
      const user = users.find(x => x.ws === ws);

      if (!user) {
        return;
      }
      const roomId = String(parsedData.roomId);
      user.rooms = user.rooms.filter(x => x !== parsedData.roomId);
    }

    if (parsedData.type === "chat") {
      const roomId = parsedData.roomId;
      const message = parsedData.message;

      await prismaClient.chat.create({
        data: {
          roomId: Number(roomId),
          message,
          userId: userAuthenticated
        }
      });

      users.forEach(user => {
        if (user.rooms.includes(roomId)) {
          try {
            user.ws.send(JSON.stringify({
              type: "chat",
              message: message,
              roomId
            }))
          }
          catch (e) {
            console.log(e);
          }


        }
      })
    }


  })
})

