import mongoose, { Document  , Schema} from "mongoose";

export interface IGroup extends Document {
  name: string;
  members: mongoose.Types.ObjectId[];
}

export interface IGroupMessage {
    groupId: mongoose.Types.ObjectId;
    sender : mongoose.Types.ObjectId;
    message : string;
}

const GroupSchema : Schema<IGroup> = new Schema({
    name: {
        type: String,
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
});

export const Group = mongoose.model<IGroup>("Group", GroupSchema);


const GroupMessageSchema : Schema<IGroupMessage> = new Schema({
    groupId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true
    },
    sender : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    message : {
        type : String,
        required : true,
        trim : true
    }
});


export const GroupMessage = mongoose.model<IGroupMessage>("GroupMessage", GroupMessageSchema);




