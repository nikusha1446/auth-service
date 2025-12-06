import express from 'express';
import { healthRouter } from './modules/health/health.routes.js';
import { errorHandler } from './common/middleware/error-handler.js';

const app = express();

app.use(express.json());

// routes
app.use('/health', healthRouter);

// error handler
app.use(errorHandler);

export { app };
