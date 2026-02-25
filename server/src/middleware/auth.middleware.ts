import { Response , NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { User } from "../models/user.model";
import { IUser } from "../types/user.type";
import { Request } from "../types/request.type";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const token = req.headers["x-authorized"] as string;
  // const token = req.headers['authorization']?.split(' ')[1]

  if (!token) {
    res.status(401).json({ message: "No token provided , please Login" });
    return;
  }

  let decoded: any;
  try {
    const decoded = await verifyToken(token);
    const user: IUser = await User.findById(decoded._id).select("-password");
    req.authUser = user;
    next();
  } catch (error) {
    console.error(
      "Auth middleware error:",
      error instanceof Error ? error.message : String(error),
    );
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};