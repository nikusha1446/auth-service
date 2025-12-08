import express from 'express';
import { healthRouter } from './modules/health/health.routes.js';
import { errorHandler } from './common/middleware/error-handler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { generalLimiter } from './common/middleware/rate-limit.js';

const app = express();

app.use(express.json());
app.use(generalLimiter);

// routes
app.use('/health', healthRouter);
app.use('/auth', authRouter);

// error handler
app.use(errorHandler);

export { app };
