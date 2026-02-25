import { io, Socket } from "socket.io-client";

const url = "http://localhost:3000";

export const socket: Socket = io(url, {
  autoConnect: false
});