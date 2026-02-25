import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import Chat from "../models/chat.model";
import { verifyToken } from "../utils/jwt";
import { GroupMessage } from "../models/group.model";

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
      const token =
        (await socket.handshake.auth?.token) ||
        (socket.handshake.headers.token as string);
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

  io.on("connection", async (socket: AuthSocket) => {
    const userId = socket.userId!;
    console.log("User Connected 🚀", userId);
    onlineUsers.set(userId, socket.id);

    const undeliveredMessages = await Chat.find({
      receiver: userId,
      status: "sent",
    });

    await Chat.updateMany(
      {
        receiverId: userId,
        status: "sent",
      },
      {
        status: "delivered",
      },
    );

    undeliveredMessages.forEach((msg) => {
      const senderSocketId = onlineUsers.get(msg.sender._id.toString());

      if (senderSocketId) {
        console.log("update delivered for message:", msg._id);
        io.to(senderSocketId).emit("message_delivered", {
          messageId: msg._id,
        });
      }
    });

    io.emit("online_users", Array.from(onlineUsers.keys()));

    socket.on("send_message", async (data) => {
      try {
        const { receiverId, message } = data;
        const senderId = socket.userId!;

        const newMessage = await Chat.create({
          sender: senderId,
          receiver: receiverId,
          message,
          status: "sent",
        });

        const receiverSocketId = onlineUsers.get(receiverId);

        if (receiverSocketId) {
          newMessage.status = "delivered";
          await newMessage.save();
        }

        const populatedMessage = await newMessage.populate(
          "sender receiver",
          "name email",
        );

        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", populatedMessage);

          socket.emit("message_delivered", {
            messageId: newMessage._id,
          });
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

    socket.on("mark_seen", async ({ senderId }) => {
      await Chat.updateMany(
        {
          sender: senderId,
          receiver: socket.userId,
          status: { $ne: "seen" },
        },
        {
          status: "seen",
        },
      );

      const senderSocketId = onlineUsers.get(senderId);

      if (senderSocketId) {
        io.to(senderSocketId).emit("messages_seen", {
          seenBy: socket.userId,
        });
      }
    });

    socket.on("join_group", ({ groupId }) => {
      socket.join(groupId);
      console.log(`${socket.userId} joined group ${groupId}`);
    });

    socket.on("send_group_message", async ({ groupId, message }) => {
      const senderId = socket.userId;

      const newMessage = await GroupMessage.create({
        groupId : groupId,
        message : message,
        sender : senderId
      });
      
      io.to(groupId).emit("receive_group_message", newMessage);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", userId);
      onlineUsers.delete(userId);
      io.emit("online_users", Array.from(onlineUsers.keys()));
    });
  });
};
