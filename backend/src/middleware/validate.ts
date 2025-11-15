

// FIX: Import Request, Response, NextFunction types from express
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// FIX: Use a more generic Zod Schema type to avoid version/import issues with AnyZodObject
export const validate = (schema: z.Schema) =>
  async (req: Request, res: Response, next: NextFunction) => {
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
