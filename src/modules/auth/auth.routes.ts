import { Router } from 'express';
import { validate } from '../../common/middleware/validate.js';
import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.types.js';
import {
  forgotPassword,
  login,
  logout,
  logoutAll,
  me,
  refresh,
  register,
  resetPassword,
  verifyEmail,
} from './auth.controller.js';
import { authenticate } from '../../common/middleware/auth.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshTokenSchema), refresh);
router.post('/logout', validate(logoutSchema), logout);
router.post('/logout-all', authenticate, logoutAll);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.get('/me', authenticate, me);

export { router as authRouter };
