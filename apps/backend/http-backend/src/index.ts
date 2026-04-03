import express, { type Express } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  prismaClient,
  connectDatabase,
  disconnectDatabase,
} from "@drawapp/db/client";
import { authMiddleware } from "./authmiddleware.js";
import { UserSchema, SigninSchema, CreateRoomSchema } from "@drawapp/shared";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
const app: Express = express();
app.use(express.json());
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const ALLOWED_ORIGINS = FRONTEND_URL.split(",").map((url) => url.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        ALLOWED_ORIGINS.includes(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

const requiredEnvVars = ["JWT_SECRET", "DATABASE_URL"];
function validateEnvironment() {
  const missing = requiredEnvVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}
validateEnvironment();

const JWT_SECRET = process.env.JWT_SECRET as string;
const SaltRounds = 10;

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 10;

function rateLimitMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (record.count >= MAX_REQUESTS) {
    return res
      .status(429)
      .json({ message: "Too many requests. Please try again later." });
  }

  record.count++;
  next();
}

async function initDatabase() {
  try {
    await connectDatabase();
    console.log("Database connected");
  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  await disconnectDatabase();
  console.log("Database disconnected");
  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

initDatabase();

app.post("/signup", rateLimitMiddleware, async (req, res) => {
  const parsedData = UserSchema.safeParse(req.body);

  if (!parsedData.success) {
    const errors = parsedData.error.issues.map((issue: any) => issue.message);
    return res.status(400).json({
      message: errors.join(", "),
    });
  }

  try {
    const password = parsedData.data.password;
    const hashedPassword = await bcrypt.hash(password, SaltRounds);
    const user = await prismaClient.user.create({
      data: {
        name: parsedData.data.username,
        password: hashedPassword,
        email: parsedData.data.email,
      },
    });

    res.json({
      message: "You have been Signed Up",
      userId: user.id,
    });
  } catch (e) {
    console.error("Signup error:", e);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
});

app.post("/signin", rateLimitMiddleware, async (req, res) => {
  const parsedData = SigninSchema.safeParse(req.body);

  if (!parsedData.success) {
    const errors = parsedData.error.issues.map((issue) => issue.message);
    return res.status(400).json({
      message: errors.join(", "),
    });
  }

  const email = parsedData.data.email;
  const password = parsedData.data.password;

  try {
    const user = await prismaClient.user.findFirst({
      where: {
        email: email,
      },
      select: {
        id: true,
        password: true,
      },
    });
    if (!user) {
      res.status(404).json({
        message: "Email Id Not registered",
      });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    const userId = user.id;
    if (passwordMatch) {
      const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });
      res.json({
        token,
      });
    } else {
      res.status(401).json({
        message: "Incorrect Password",
      });
    }
  } catch (e) {
    console.error("Signin error:", e);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
});

app.post("/room", authMiddleware, async (req, res) => {
  const parsedData = CreateRoomSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.status(400).json({
      message: "Incorrect Inputs",
    });
  }
  //@ts-ignore
  const userId = req.id;

  const room = await prismaClient.room.create({
    data: {
      slug: parsedData.data.name,
      adminId: userId,
    },
    select: {
      id: true,
    },
  });
  return res.json({
    room: {
      id: room.id,
    },
    message: "Room Created",
  });
});

app.get("/chats/:roomId", async (req, res) => {
  const roomId = Number(req.params.roomId);
  if (!roomId) {
    return res.status(204).json({
      message: "Newly Created Room",
    });
  }
  try {
    const messages = await prismaClient.chat.findMany({
      where: {
        roomId: roomId,
      },
      orderBy: {
        id: "asc",
      },
      take: 1000,
    });

    res.json({
      messages,
    });
  } catch (e) {
    console.error("Chat fetch error:", e);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
});

app.get("/rooms/:slug", async (req, res) => {
  const slug = req.params.slug;
  const room = await prismaClient.room.findFirst({
    where: {
      slug,
    },
    select: {
      id: true,
    },
  });

  if (!room) {
    return res.status(404).json({
      message: "Room not found",
    });
  }

  res.json({
    room: {
      id: room.id,
    },
  });
});

app.get("/health", async (req, res) => {
  try {
    await prismaClient.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch (e) {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

export default app;


