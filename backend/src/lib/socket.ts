import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

let io: Server;

export const initializeSocketIO = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "https://localhost:3000",
      credentials: true,
    },
  });

  // Socket.IO Authentication Middleware
  io.use((socket: Socket, next) => {
    const cookies = socket.handshake.headers.cookie;
    if (!cookies) {
      return next(new Error("Authentication error: No cookies provided"));
    }

    const parsedCookies = cookie.parse(cookies);
    const token = parsedCookies.accessToken;

    if (!token) {
      return next(new Error("Authentication error: No access token provided"));
    }

    jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
      if (err) {
        return next(new Error("Authentication error: Invalid token"));
      }

      socket.data.user = decoded as JWTPayload;
      next();
    });
  });
  io.on("connection", (socket: Socket) => {
    console.log(
      `Socket connected: ${socket.id} for user ${socket.data.user.userId}`
    );

    // Join a private room based on the user's ID
    socket.join(socket.data.user.userId);

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Export the io instance to be used in other parts of the app
export { io };
