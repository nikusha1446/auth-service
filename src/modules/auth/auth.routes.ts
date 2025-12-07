import { Router } from 'express';
import { validate } from '../../common/middleware/validate.js';
import { registerSchema } from './auth.types.js';
import { register } from './auth.controller.js';

const router = Router();

router.post('/register', validate(registerSchema), register);

export { router as authRouter };
