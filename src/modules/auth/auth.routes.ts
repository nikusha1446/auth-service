import { Router } from 'express';
import { validate } from '../../common/middleware/validate.js';
import {
  loginSchema,
  registerSchema,
  verifyEmailSchema,
} from './auth.types.js';
import { login, register, verifyEmail } from './auth.controller.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);
router.post('/login', validate(loginSchema), login);

export { router as authRouter };
