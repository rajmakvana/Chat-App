import {Router} from 'express';
import { signin, signup, uploadProfileImage } from '../controller/user.controller';
import { uploadProfile } from '../config/multer';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post("/signup" , signup );
router.post("/signin" , signin);
router.post("/profile", authMiddleware , uploadProfile.single('profileImage'), uploadProfileImage);

export default router;