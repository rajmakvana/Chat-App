import { Document, Types } from "mongoose";

export interface IUser extends Document {
    name : string,
    email : string,
    password : string,
    profileImage : string,
    pinnedUsers : Types.ObjectId[]
    createdAt?: Date;
    updatedAt?: Date;
}