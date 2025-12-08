import { ErrorRequestHandler } from 'express';
import { env } from '../../config/env.js';

const getStatusCode = (message: string): number => {
  const errorStatusMap: Record<string, number> = {
    'Email already registered': 409,
    'Invalid verification token': 401,
    'Invalid credentials': 401,
    'Email already verified': 400,
    'Please verify your email before logging in': 403,
    'Invalid refresh token': 401,
    'Refresh token expired': 401,
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
