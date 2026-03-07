import { Response } from "express";
import { Request } from "../types/request.type";
import { Group, GroupMessage } from "../models/group.model";
import { io } from "../sockets/socket";

export const createGroup = async (req: Request, res: Response) => {
  const { groupName, members } = req.body;
  console.log(groupName, members);

  if (
    !groupName ||
    !members ||
    !Array.isArray(members) ||
    members.length === 0
  ) {
    return res
      .status(400)
      .json({ error: "Group name and members are required" });
  }

  try {
    const newGroup = new Group({
      name: groupName,
      members: members,
    });

    await newGroup.save();
    const populatedGroup = await newGroup.populate(
      "members",
      "_id , name , email",
    );
    res.status(201).json(populatedGroup);
  } catch (error) {
    res.status(500).json({ error: "Failed to create group" });
  }
};

export const getAllGroups = async (req: Request, res: Response) => {
  const currentUser = req.authUser?._id;

  try {
    const allGroup = await Group.find({ members: currentUser }).populate(
      "members",
      "_id name email",
    );
    res.status(201).json(allGroup);
  } catch (error) {
    res.status(500).json({ error: "Failed to create group" });
  }
};

export const getGroupMessage = async (req: Request, res: Response) => {
  const { groupId } = req.params;

  try {
    const messages = await GroupMessage.find({ groupId })
      .populate("sender", "name email")
      .populate("seenBy", "name")
      .populate("replyTo")
      .sort({ createdAt: 1 });
    res.status(201).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to create group" });
  }
};

export const uploadGroupImage = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    console.log(groupId);

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const imagePath = `/uploads/profiles/${req.file.filename}`;

    const group = await Group.findByIdAndUpdate(
      groupId,
      {
        groupImage: imagePath,
      },
      { new: true },
    );

    if (!group) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    io.emit("group_profile_change", { group });

    res.status(200).json({
      message: "Profile image uploaded",
      group,
    });
  } catch (error) {
    res.status(500).json({
      message: "Upload failed",
      error,
    });
  }
};

export const togglePinGroup = async (req: Request, res: Response) => {
  try {
    const userId = req.authUser?._id;
    const { groupId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isPinned = group.pinnedBy?.some(
      (pin) => pin.userId.toString() === userId.toString(),
    );

    if (isPinned) {
      group.pinnedBy = group.pinnedBy?.filter(
        (pin) => pin.userId.toString() !== userId.toString(),
      );
    } else {
      group.pinnedBy?.push({ userId, pinnedAt: new Date() });
      group.updatedAt = new Date();
    }

    await group.save();

    io.emit("group_pin_updated", {
      groupId,
      pinnedBy: group.pinnedBy,
    });

    res.json({
      message: isPinned ? "Group unpinned" : "Group pinned",
      group,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
