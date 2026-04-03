import { Router } from 'express';
import { loginController, logoutController, refreshController } from '../controllers/authController.js';

const router = Router();

router.post('/login', loginController);
router.post('/refresh', refreshController);
router.post('/logout', logoutController);

export default router;
