
import { z } from 'zod';

const userRoleSchema = z.union([
    z.literal('Admin'),
    z.literal('Employee'),
    z.literal('Student'),
]);

export const updateUserSchema = z.object({
    params: z.object({
        // FIX: Parameter name should be 'id' to match route '/:id'
        id: z.string().regex(/^\d+$/, "User ID must be a number"),
    }),
    body: z.object({
        name: z.string().min(2, 'Name is required'),
        // FIX: Changed Zod message from object to string for compatibility
        email: z.string().email('Invalid email address'),
    }),
});

export const setInitialPasswordSchema = z.object({
    body: z.object({
        newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
    }),
});

export const changePasswordSchema = z.object({
    params: z.object({
        userId: z.string().regex(/^\d+$/, "User ID must be a number"),
    }),
    body: z.object({
        current: z.string().min(1, 'Current password is required'),
        newPass: z.string().min(6, 'New password must be at least 6 characters long'),
    }),
});

export const updateUserRoleSchema = z.object({
    params: z.object({
        userId: z.string().regex(/^\d+$/, "User ID must be a number"),
    }),
    body: z.object({
        role: userRoleSchema,
    }),
});

export const updateUserPermissionsSchema = z.object({
    params: z.object({
        userId: z.string().regex(/^\d+$/, "User ID must be a number"),
    }),
    body: z.object({
        permissions: z.record(z.object({
            read: z.boolean().optional(),
            create: z.boolean().optional(),
            update: z.boolean().optional(),
            delete: z.boolean().optional(),
        })),
    }),
});

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    // FIX: Added default validation message.
    email: z.string().email('Invalid email address'),
    role: userRoleSchema,
    password: z.string().min(1, 'Password is required'), // Temporary password
    mustResetPassword: z.boolean().optional(),
  }),
});
