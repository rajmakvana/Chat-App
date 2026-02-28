import { Router  } from "express";
import { createGroup, getAllGroups, getGroupMessage, uploadGroupImage } from "../controller/group.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { uploadProfile } from "../config/multer";

const router = Router();

router.post("/create", authMiddleware , createGroup);
router.get("/" , authMiddleware , getAllGroups);
router.get("/message/:groupId" , authMiddleware , getGroupMessage);
router.post("/groupImage/:groupId", authMiddleware , uploadProfile.single('profileImage'), uploadGroupImage);

export default router;