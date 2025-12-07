import { RequestHandler } from 'express';
import { z } from 'zod';

export const validate = (schema: z.ZodType): RequestHandler => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));

      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });

      return;
    }

    req.body = result.data;
    next();
  };
};
