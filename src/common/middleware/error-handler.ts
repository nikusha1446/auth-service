import { ErrorRequestHandler } from 'express';
import { env } from '../../config/env.js';

const getStatusCode = (message: string): number => {
  const errorStatusMap: Record<string, number> = {
    'Email already registered': 409,
    'Invalid verification token': 400,
    'Email already verified': 400,
    'Invalid credentials': 401,
    'Please verify your email before logging in': 403,
  };

  return errorStatusMap[message] || 500;
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);

  const statusCode = err.statusCode || getStatusCode(err.message);
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
