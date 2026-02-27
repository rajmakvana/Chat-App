import { Response } from "express";
import { Request } from "../types/request.type";
import { Group, GroupMessage } from "../models/group.model";

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
      .populate("sender", "name email").populate("seenBy", "name")
      .sort({ createdAt: 1 });
    res.status(201).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to create group" });
  }
};
