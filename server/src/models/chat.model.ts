import mongoose, { Schema } from "mongoose";
import { IMessage } from "../types/message.type";

const chatSchema = new Schema<IMessage>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    message: {
      type: String,
      trim: true,
    },
    fileUrl: {
      type: String,
      default: "",
    },
    fileName: String,
    fileType: String,
    fileSize: Number,
    messageType: {
      type: String,
      enum: ["text", "file"],
      default: "text",
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

chatSchema.index({ sender: 1, receiver: 1 });
chatSchema.index({ receiver: 1, status: 1 });

const Chat = mongoose.model<IMessage>("Chat", chatSchema);
export default Chat;
