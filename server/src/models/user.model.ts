import mongoose , { Schema , Document  } from "mongoose";
import { IUser } from "../types/user.type";


const userSchema = new Schema<IUser>({
    name : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true,
        unique : true
    },
    password : {
        type : String,
        required : true,
    },
} , {
    timestamps : true
});


export const User = mongoose.model<IUser>("User" , userSchema); 