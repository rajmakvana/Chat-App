import { Request , Response } from "express";
import {Group} from '../models/group.model';

export const createGroup = async (req : Request , res : Response) => {

    const { groupName , members} = req.body;
    console.log(groupName, members);

    if(!groupName || !members || !Array.isArray(members) || members.length === 0) {
        return res.status(400).json({ error: "Group name and members are required" });
    }

    try {
        const newGroup = new Group({
            name: groupName,
            members: members
        });

        const savedGroup = await newGroup.save();
        res.status(201).json(savedGroup);
    } catch (error) {
        res.status(500).json({ error: "Failed to create group" });
    }

}