import {Router} from 'express';
import { signin, signup } from '../controller/user.contoller';

const router = Router();

router.post("/signup" , signup );
router.post("/signin" , signin);

export default router;