import { io } from "socket.io-client";

const URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api", "") ||
  "http://localhost:8080";

export const socket = io(URL, {
  autoConnect: false,
  withCredentials: true,
});
