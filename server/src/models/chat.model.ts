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
  },
  {
    timestamps: true,
  },
);

const Chat = mongoose.model<IMessage>("Chat", chatSchema);
export default Chat;
