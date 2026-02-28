import multer from "multer";
import path from "node:path";
import { Request } from "../types/request.type";

const uploadPath = path.join(__dirname, "../../uploads/profiles");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },

  filename: (req: Request, file, cb) => {
    const userId = req.authUser?._id; // from auth middleware
    const ext = path.extname(file.originalname);

    cb(null, `${userId}-${Date.now()}${ext}`);
  },
});

export const uploadProfile = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});
