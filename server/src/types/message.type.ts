import mongoose, { Document, Types } from "mongoose";

export interface IMessage extends Document {
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  message?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  messageType?: "text" | "file";
  isPinned?: boolean;
  status: "sent" | "delivered" | "seen";
  replyTo?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  read: boolean;
}
