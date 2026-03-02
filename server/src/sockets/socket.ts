import { Server, Socket } from "socket.io";
import mongoose from "mongoose";
import Chat from "../models/chat.model";
import { Group, GroupMessage } from "../models/group.model";
import { verifyToken } from "../utils/jwt";
import { User } from "../models/user.model";

interface AuthSocket extends Socket {
  userId?: string;
}

export const onlineUsers = new Map<string, string>();

export let io: Server;

export const initializeSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  /**
   * ============================
   * AUTH
   * ============================
   */
  io.use((socket: AuthSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers.token as string);

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded: any = verifyToken(token);

      socket.userId = decoded._id;

      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  /**
   * ============================
   * CONNECTION
   * ============================
   */
  io.on("connection", async (socket: AuthSocket) => {
    const userId = socket.userId!;

    console.log("User Connected:", userId);

    onlineUsers.set(userId, socket.id);

    io.emit("online_users", Array.from(onlineUsers.keys()));

    /**
     * ============================
     * FIX 1: DELIVER UNDELIVERED MESSAGES
     * ============================
     */
    const undeliveredMessages = await Chat.find({
      receiver: userId,
      status: "sent",
    });

    await Chat.updateMany(
      {
        receiver: userId,
        status: "sent",
      },
      {
        status: "delivered",
      },
    );

    undeliveredMessages.forEach((msg) => {
      const senderSocketId = onlineUsers.get(msg.sender.toString());

      if (senderSocketId) {
        io.to(senderSocketId).emit("message_delivered", {
          messageId: msg._id,
        });
      }
    });

    /**
     * ============================
     * PRIVATE MESSAGE
     * ============================
     */
    socket.on("send_message", async (data) => {
      try {
        const { receiverId, message, replyTo } = data;

        const senderId = userId;

        const newMessage = await Chat.create({
          sender: senderId,
          receiver: receiverId,
          message,
          replyTo: replyTo || null,
          status: "sent",
          read: false,
        });

        const receiverSocketId = onlineUsers.get(receiverId);

        /**
         * update delivered
         */
        if (receiverSocketId) {
          newMessage.status = "delivered";

          await newMessage.save();
        }

        /**
         * populate
         */
        const populatedMessage = await Chat.findById(newMessage._id)
          .populate("sender", "name email")
          .populate("receiver", "name email")
          .populate({
            path: "replyTo",
            select: "message sender",
            populate: {
              path: "sender",
              select: "name",
            },
          });

        /**
         * send to receiver
         */
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", populatedMessage);

          io.to(receiverSocketId).emit("receive_lastMessage", populatedMessage);

          socket.emit("message_delivered", {
            messageId: newMessage._id,
          });
        }

        /**
         * send to sender
         */
        socket.emit("receive_message", populatedMessage);
      } catch (error) {
        console.log("send_message error:", error);
      }
    });

    /**
     * ============================
     * FIX 2: MARK SEEN
     * ============================
     */
    socket.on("mark_seen", async ({ senderId }) => {
      try {
        await Chat.updateMany(
          {
            sender: senderId,
            receiver: userId,
            status: { $ne: "seen" },
          },
          {
            status: "seen",
            read: true,
          },
        );

        const senderSocketId = onlineUsers.get(senderId);

        /**
         * notify sender
         */
        if (senderSocketId) {
          io.to(senderSocketId).emit("messages_seen", {
            seenBy: userId,
          });
        }

        /**
         * notify receiver (reset unread)
         */
        socket.emit("unread_reset", {
          userId: senderId,
        });
      } catch (error) {
        console.log("mark_seen error:", error);
      }
    });

    /**
     * ============================
     * TYPING
     * ============================
     */
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

    /**
     * ============================
     * GROUP JOIN
     * ============================
     */
    socket.on("join_group", async ({ groupId }) => {
      const group = await Group.findOne({
        _id: new mongoose.Types.ObjectId(groupId),
        members: userId,
      });

      if (!group) return;

      socket.join(groupId);
    });

    /**
     * ============================
     * GROUP MESSAGE
     * ============================
     */
    socket.on("send_group_message", async (data) => {
      try {
        const { groupId, message, replyTo } = data;

        const newMessage = await GroupMessage.create({
          groupId,

          sender: userId,

          message,

          replyTo: replyTo || null,

          seenBy: [userId],
        });

        const populatedMessage = await GroupMessage.findById(newMessage._id)
          .populate("sender", "name email")
          .populate({
            path: "replyTo",
            select: "message sender",
            populate: {
              path: "sender",
              select: "name",
            },
          });

        io.to(groupId).emit("receive_group_message", populatedMessage);
      } catch (error) {
        console.log(error);
      }
    });

    /**
     * ============================
     * GROUP SEEN
     * ============================
     */
    socket.on("mark_group_seen", async ({ groupId }) => {
      await GroupMessage.updateMany(
        {
          groupId,
          seenBy: { $ne: userId },
        },
        {
          $addToSet: { seenBy: userId },
        },
      );

      const user = await User.findById(userId).select("_id name").lean();

      io.to(groupId).emit("group_seen_update", {
        groupId,
        user,
      });
    });

    // pin / unpin handle in chat message
    socket.on("toggle_pin_message", async (data) => {
      try {
        const { messageId, receiverId } = data;

        const message = await Chat.findById(messageId);

        if (!message) return;

        message.isPinned = !message.isPinned;
        await message.save();

        const populatedMessage = await message.populate([
          { path: "receiver", select: "name _id" },
          { path: "replyTo" },
          { path: "sender", select: "name _id" },
        ]);

        console.log(populatedMessage);
        // send to sender
        socket.emit("message_pin_updated", populatedMessage);

        // send to receiver
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("message_pin_updated", message);
        }
      } catch (error) {
        console.log(error);
      }
    });

    // pin user

    socket.on("toggle_user_pin", async ({ targetUserId }) => {
      try {
        const currentUserId = socket.userId;

        if (!currentUserId) return;
        const currentUser = await User.findById(currentUserId);
        if (!currentUser) return;
        const isPinned = currentUser.pinnedUsers.some(
          (id) => id.toString() === targetUserId,
        );
        if (isPinned) {
          currentUser.pinnedUsers = currentUser.pinnedUsers.filter(
            (id) => id.toString() !== targetUserId,
          );
        } else {
          currentUser.pinnedUsers.push(targetUserId);
        }

        await currentUser.save();

        // Send updated pinned list to current user
        io.to(socket.id).emit("user_pin_updated", {
          pinnedUsers: currentUser.pinnedUsers,
        });
      } catch (error) {
        console.log("Pin error:", error);
      }
    });

    socket.on("toggle_pin_group", async ({ groupId }) => {
      try {
        const currentUserId = socket.userId;

        if (!currentUserId) return;

        const group = await Group.findById(groupId);

        if (!group) return;

        // ensure array exists
        if (!group.pinnedBy) {
          group.pinnedBy = [];
        }

        // SAFE check
        const existingPinIndex = group.pinnedBy.findIndex(
          (p) => p?.userId && p.userId.toString() === currentUserId.toString(),
        );

        if (existingPinIndex !== -1) {
          // UNPIN
          group.pinnedBy.splice(existingPinIndex, 1);
        } else {
          // PIN
          group.pinnedBy.push({
            userId: new mongoose.Types.ObjectId(currentUserId),
            pinnedAt: new Date(),
          });
        }

        await group.save();

        // send updated group to ALL group members
        io.emit("group_pin_updated", {
          groupId: group._id,
          pinnedBy: group.pinnedBy,
        });
      } catch (error) {
        console.log("toggle_pin_group error:", error);
      }
    });
    /**
     * ============================
     * DISCONNECT
     * ============================
     */
    socket.on("disconnect", () => {
      onlineUsers.delete(userId);

      io.emit("online_users", Array.from(onlineUsers.keys()));

      console.log("Disconnected:", userId);
    });
  });
};
