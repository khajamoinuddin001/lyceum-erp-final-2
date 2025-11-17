
import { z } from 'zod';

export const checkInSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    company: z.string().min(1, 'Company is required'),
    host: z.string().min(1, 'Host is required'),
    cardNumber: z.string().optional(),
  }),
});

export const updateVisitorSchema = checkInSchema.extend({
    params: z.object({
        id: z.string().regex(/^\d+$/, "ID must be a number"),
    }),
});


export const scheduleVisitorSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    company: z.string().min(1, 'Company is required'),
    host: z.string().min(1, 'Host is required'),
    scheduledCheckIn: z.string().datetime({ message: 'Invalid datetime format' }),
  }),
});
