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
      required: true,
      trim: true,
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
    read : {
      type : Boolean,
      default : false
    }
  },
  {
    timestamps: true,
  },
);

chatSchema.index({ sender: 1, receiver: 1 });
chatSchema.index({ receiver: 1, status: 1 });

const Chat = mongoose.model<IMessage>("Chat", chatSchema);
export default Chat;
