import { Router } from 'express';
import { loginController, logoutController, refreshController, registerController, confirmEmailController } from '../controllers/authController.js';

const router = Router();

router.post('/register', registerController);
router.post('/login', loginController);
router.post('/refresh', refreshController);
router.post('/logout', logoutController);
router.get('/confirm', confirmEmailController);
router.post('/confirm', confirmEmailController);

export default router;
