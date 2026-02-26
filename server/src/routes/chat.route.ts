import { Router } from "express";
import { getChatList, getMessages, getUsers } from "../controller/chat.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/users" , authMiddleware , getUsers);
router.get("/getChat" , authMiddleware , getChatList);
router.get("/messages/:userId" , authMiddleware , getMessages);

export default router;