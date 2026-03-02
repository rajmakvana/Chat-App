import { Response } from "express";
import { User } from "../models/user.model";
import { Request } from "../types/request.type";
import Chat from "../models/chat.model";
import { io, onlineUsers } from "../sockets/socket";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.authUser?._id;

    const users = await User.find({
      _id: { $ne: currentUserId },
    }).select("-password -createdAt -updatedAt");

    const usersWithUnreadCount = await Promise.all(
      users.map(async (user) => {
        // unread messages count
        const unreadCount = await Chat.countDocuments({
          sender: user._id,
          receiver: currentUserId,
          status: "delivered",
        });

        // last message
        const lastMessage = await Chat.findOne({
          $or: [
            { sender: currentUserId, receiver: user._id },
            { sender: user._id, receiver: currentUserId },
          ],
        })
          .sort({ createdAt: -1 })
          .select("message");

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          profileImage: user.profileImage,
          unreadCount,
          lastMessage,
          pinnedUsers: user?.pinnedUsers || [],
        };
      }),
    );

    res.status(200).json({
      success: true,
      users: usersWithUnreadCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  const curentUserId = req.authUser?._id;
  const { userId } = req.params;

  try {
    const messages = await Chat.find({
      $or: [
        { sender: curentUserId, receiver: userId },
        { sender: userId, receiver: curentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "name email")
      .populate("receiver", "name email")
      .populate("replyTo");

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
    });
  }
};

export const getChatList = async (req: Request, res: Response) => {
  const userId = req.authUser?._id;

  const chats = await Chat.aggregate([
    {
      $match: {
        $or: [{ sender: userId }, { receiver: userId }],
      },
    },

    {
      $sort: { createdAt: -1 },
    },

    {
      $group: {
        _id: {
          $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"],
        },

        lastMessage: { $first: "$message" },

        status: { $first: "$status" },

        createdAt: { $first: "$createdAt" },

        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$receiver", userId] },
                  { $ne: ["$status", "seen"] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const populatedChats = await User.populate(chats, {
    path: "_id",
    select: "name email",
  });

  res.json(populatedChats);
};


export const sendFileMessage = async (req : Request, res : Response) => {
  try {
    const senderId = req.authUser?._id;
    const receiverId = req.body.receiverId;

    const file = req.file;

    if (!file) {
      return res.status(400).json({
        message: "File required",
      });
    }

    const fileUrl = `/uploads/files/${file.filename}`;

    const message = await Chat.create({
      sender : senderId,
      receiver : receiverId,
      fileUrl,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      messageType: "file",
    });

    const populatedMessage = await message.populate("sender" , "_id name")

    // emit socket
    const receiverSocketId = onlineUsers.get(receiverId!.toString());

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receive_new_message", populatedMessage);
    }

    // also send to sender
    const senderSocketId = onlineUsers.get(senderId!.toString());

    if (senderSocketId) {
      io.to(senderSocketId).emit("receive_new_message", populatedMessage);
    }
    console.log(populatedMessage);
    res.status(200).json({
      message: "File sent",
      data: message,
    });

  } catch (error) {
    console.log(error);
  }
};