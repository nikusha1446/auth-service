import { Router } from 'express';
import { validate } from '../../common/middleware/validate.js';
import { registerSchema, verifyEmailSchema } from './auth.types.js';
import { register, verifyEmail } from './auth.controller.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);

export { router as authRouter };
