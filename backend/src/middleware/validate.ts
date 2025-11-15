
import express from 'express';
import { z } from 'zod';

// FIX: Added explicit types for middleware parameters.
export const validate = (schema: z.ZodObject<any>) =>
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      // The global error handler will catch ZodError instances
      return next(error);
    }
  };
