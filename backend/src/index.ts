import express, { Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/auth/auth.route";
import issueRoutes from "./modules/issues/issue.route";
import usersRoutes from "./modules/users/user.route";
import { authenticateToken } from "./middleware/auth.middleware";
import { createServer } from "http";
import { initializeSocketIO } from "./lib/socket";

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(helmet());
const allowedOrigins = ["http://localhost:3000", "https://localhost:3000"];
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    message: "Too many requests. Please try again later.",
    code: "TOO_MANY_REQUESTS",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Routes ---
app.get("/api", (req: Request, res: Response) => {
  res.send("IT Issue Tracker Backend is running!");
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/users", usersRoutes);


// Sample route
app.get("/api/me", authenticateToken, (req: Request, res: Response) => {
  res.status(200).json(req.user);
});

// สร้าง Http server เพื่อรองรับ WebSocket
// รองรับ real-time communication เช่น emit, รับ event จาก client
const httpServer = createServer(app);
initializeSocketIO(httpServer);

httpServer.listen(port, () => {
  console.log(`Backend server with Socket.IO is listening on port ${port}`);
});

export default app;
