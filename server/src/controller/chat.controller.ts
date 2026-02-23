import { Response } from "express";
import { User } from "../models/user.model";
import { Request } from "../types/request.type";
import Chat from "../models/chat.model";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const curentUserId = req.authUser?._id;
    const users = await User.find({ _id: { $ne: curentUserId } }).select(
      "-password",
    );
    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
        success : false,
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
      .populate("receiver", "name email");

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages"
    });
  }
};
