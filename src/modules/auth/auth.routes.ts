import { Router } from 'express';
import { validate } from '../../common/middleware/validate.js';
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  verifyEmailSchema,
} from './auth.types.js';
import { login, refresh, register, verifyEmail } from './auth.controller.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshTokenSchema), refresh);

export { router as authRouter };
