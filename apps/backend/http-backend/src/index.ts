import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prismaClient } from "@drawapp/db/client";
import { authMiddleware } from "./authmiddleware.js";
import { UserSchema, SigninSchema, CreateRoomSchema } from "@drawapp/shared";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });
const app = express();
app.use(express.json());
app.use(cors());
const JWT_SECRET = process.env.JWT_SECRET;
const SaltRounds = 10;
app.post("/signup", async (req, res) => {
  const parsedData = UserSchema.safeParse(req.body);

  if (!parsedData.success) {
    const firstError = parsedData.error.issues[0]?.message || "Invalid Input";
    return res.status(400).json({
      message: firstError
    })
  }

  try {
    const password = parsedData.data.password;
    const hashedPassword = await bcrypt.hash(password, SaltRounds);
    const user = await prismaClient.user.create({
      data: {
        name: parsedData.data.username,
        password: hashedPassword,
        email: parsedData.data.email
      }
    })

    res.json({
      message: "You have been Signed Up",
      userId: user.id
    })
  }
  catch (e) {
    console.log(e);
    res.json({
      message: "Sign up has failed"
    })
  }
})
app.post("/signin", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  try {
    const user = await prismaClient.user.findFirst({
      where: {
        email: email
      },
      select: {
        id: true,
        password: true
      }
    });
    if (!user) {
      res.status(404).json({
        message: "Email Id Not registered"
      })
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    const userId = user.id;
    if (passwordMatch) {
      const token = jwt.sign({ id: userId }, JWT_SECRET);
      res.json({
        token
      })
    }

    else {
      res.status(401).json({
        message: "Incorrect Password"
      })
    }
  }

  catch (e) {
    console.log(e);
    res.json({
      message: "Login has failed"
    })
  }


})


app.post("/room", authMiddleware, async (req, res) => {
  const parsedData = CreateRoomSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.status(400).json({
      message: "Incorrect Inputs"
    })
    return;
  }
  //@ts-ignore
  const userId = req.id;

  const room = await prismaClient.room.create({
    data: {
      slug: parsedData.data.name,
      adminId: userId
    },
    select: {
      id: true
    }
  });
  return res.json({
    room: {
      id: room.id
    },
    message: "Room Created"
  })
})

app.get("/chats/:roomId", async (req, res) => {
  const roomId = Number(req.params.roomId);
  if (!roomId) {
    return res.status(204).json({
      message: "Newly Created Room"
    });
  }
  try {
    const messages = await prismaClient.chat.findMany({
      where: {
        roomId: roomId
      },
      orderBy: {
        id: "desc"
      },
      take: 1000
    });

    res.json({
      messages
    })
  }

  catch (e) {
    console.log(e);
    res.json({
      error: e
    })
  }

})

app.get("/rooms/:slug", async (req, res) => {
  const slug = req.params.slug;
  const room = await prismaClient.room.findFirst({
    where: {
      slug
    },
    select: {
      id: true
    }
  });
  res.json({
    room: {
      id: room.id
    }
  })

})

app.listen(3000);
