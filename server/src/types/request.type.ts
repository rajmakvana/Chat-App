import { Request as ExpressRequest } from "express";
import { IUser } from "./user.type";


// Define the Request interface by extending ExpressRequest
export interface Request extends ExpressRequest {
  authUser?: IUser;
  userId?: string;
}
