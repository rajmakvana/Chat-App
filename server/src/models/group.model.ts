import mongoose, { Document, ObjectId, Schema } from "mongoose";

interface PinnedUser {
  userId: mongoose.Types.ObjectId;
  pinnedAt: Date;
}

export interface IGroup extends Document {
  name: string;
  members: mongoose.Types.ObjectId[];
  groupImage?: string;
  pinnedBy?: PinnedUser[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroupMessage {
  groupId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  message: string;
  status: "sent" | "delivered" | "seen";
  createdAt: Date;
  updatedAt: Date;
  replyTo?: mongoose.Types.ObjectId;
  read: boolean;
  seenBy: mongoose.Types.ObjectId[];
}

const GroupSchema: Schema<IGroup> = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    groupImage: {
      type: String,
      default: "",
    },
    pinnedBy: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        pinnedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true },
);

export const Group = mongoose.model<IGroup>("Group", GroupSchema);

const GroupMessageSchema: Schema<IGroupMessage> = new Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
      ref: "GroupMessage",
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);

export const GroupMessage = mongoose.model<IGroupMessage>(
  "GroupMessage",
  GroupMessageSchema,
);
