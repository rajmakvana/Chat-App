import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import Chat from "../models/chat.model";
import { verifyToken } from "../utils/jwt";

interface AuthSocket extends Socket {
  userId?: string;
}

const onlineUsers = new Map<string, string>();

export let io: Server;

export const initializeSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.use(async (socket: AuthSocket, next) => {
    try {
      const token = await socket.handshake.auth?.token || socket.handshake.headers.token as string;
      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded: any = verifyToken(token);

      socket.userId = decoded._id;
      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: AuthSocket) => {
    const userId = socket.userId!;
    console.log("User Connected 🚀", userId);
    onlineUsers.set(userId, socket.id);

    io.emit("online_users", Array.from(onlineUsers.keys()));

    socket.on("send_message", async (data) => {
      try {
        const { receiverId, message } = data;
        const senderId = socket.userId!;

        const newMessage = await Chat.create({
          sender: senderId,
          receiver: receiverId,
          message,
        });

        const populatedMessage = await newMessage.populate(
          "sender receiver",
          "name email",
        );

        // send to receiver
        const receiverSocketId = onlineUsers.get(receiverId);

        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", populatedMessage);
        }
        // send back to sender
        socket.emit("receive_message", populatedMessage);
      } catch (error) {
        console.log("Message error:", error);
      }
    });

    socket.on("typing", ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing", {
          senderId: userId,
        });
      }
    });

    socket.on("stop_typing", ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("stop_typing", {
          senderId: userId,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", userId);
      onlineUsers.delete(userId);
      io.emit("online_users", Array.from(onlineUsers.keys()));
    });
  });
};
