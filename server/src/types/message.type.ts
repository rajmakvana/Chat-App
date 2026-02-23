import { Document , Types } from "mongoose";

export interface IMessage extends Document {
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}