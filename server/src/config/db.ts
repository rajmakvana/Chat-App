import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const mongoDbUri : string | undefined = process.env.MONGO_URI

export const connectToDb = async () => {
  try {
    if (!mongoDbUri) {
      throw new Error("MONGO_URI is not defined");
    }
        await mongoose.connect(mongoDbUri);
        console.log(`dataBase connect Succefully`);
    
  } catch (error) {
    console.log(`database Error` , error);
  }
}