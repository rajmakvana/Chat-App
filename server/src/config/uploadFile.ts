import multer from "multer";
import path from "node:path";
import { Request } from "../types/request.type";

const uploadPath = path.join(__dirname, "../../uploads/files");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },

  filename: (req: Request, file, cb) => {
    const userId = req.authUser?._id;
    const ext = path.extname(file.originalname);

    const uniqueName = `${userId}-${Date.now()}${ext}`;

    cb(null, uniqueName);
  },
});

export const uploadChatFile = multer({
  storage,
  limits: {
    fileSize: 120 * 1024 * 1024, // 20MB
  },
});