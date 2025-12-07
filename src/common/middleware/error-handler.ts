import { ErrorRequestHandler } from 'express';
import { env } from '../../config/env.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);

  const statusCode =
    err.statusCode || (err.message === 'Email already registered' ? 409 : 500);
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
