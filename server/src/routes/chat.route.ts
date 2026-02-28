import { Router } from "express";
import { getChatList, getMessages, getUsers, sendFileMessage } from "../controller/chat.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { uploadChatFile } from "../config/uploadFile";

const router = Router();

router.get("/users" , authMiddleware , getUsers);
router.get("/getChat" , authMiddleware , getChatList);
router.get("/messages/:userId" , authMiddleware , getMessages);
router.post("/send-file",authMiddleware, uploadChatFile.single("file"), sendFileMessage);

export default router;