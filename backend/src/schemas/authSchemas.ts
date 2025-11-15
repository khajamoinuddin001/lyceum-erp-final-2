
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    // FIX: Changed Zod message from object to string for compatibility.
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    // FIX: Changed Zod message from object to string for compatibility.
    email: z.string().email('Invalid email address'),
    // FIX: Changed Zod message from object to string for compatibility.
    password: z.string().min(6, 'Password must be at least 6 characters long'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    // FIX: Changed Zod message from object to string for compatibility.
    email: z.string().email('Invalid email address'),
    // FIX: Changed Zod message from object to string for compatibility.
    password: z.string().min(1, 'Password is required'),
  }),
});
