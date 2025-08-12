import express, { Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser"; // ✅ เพิ่ม cookie-parser
import authRoutes from "./modules/auth/auth.route";
import issueRoutes from "./modules/issues/issue.route";
import { authenticateToken } from "./middleware/auth.middleware";

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
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

// Sample route
app.get("/api/me", authenticateToken, (req: Request, res: Response) => {
  res.status(200).json(req.user);
});

app.listen(port, () => {
  console.log(`Backend server is listening on port ${port}`);
});

export default app;
