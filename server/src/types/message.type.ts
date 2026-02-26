import { Document , Types } from "mongoose";

export interface IMessage extends Document {
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  message: string;
  status: "sent" | "delivered" | "seen";
  createdAt: Date;
  updatedAt: Date;
  read : boolean
}