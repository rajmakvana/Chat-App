import { Router  } from "express";
import { createGroup } from "../controller/group.controller";

const router = Router();

router.post("/create" , createGroup);

export default router;