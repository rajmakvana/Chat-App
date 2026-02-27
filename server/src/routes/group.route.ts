import { Router  } from "express";
import { createGroup, getAllGroups, getGroupMessage } from "../controller/group.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/create", authMiddleware , createGroup);
router.get("/" , authMiddleware , getAllGroups);
router.get("/message/:groupId" , authMiddleware , getGroupMessage);

export default router;