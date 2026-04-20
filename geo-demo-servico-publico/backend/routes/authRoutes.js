import { Router } from 'express';
import { loginController, logoutController, refreshController, registerController, verifyEmailController } from '../controllers/authController.js';

const router = Router();

router.post('/register', registerController);
router.post('/verify-email', verifyEmailController);
router.get('/verify-email', verifyEmailController);
router.post('/login', loginController);
router.post('/refresh', refreshController);
router.post('/logout', logoutController);

export default router;
