

// FIX: Import Response type from express
import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import asyncHandler from 'express-async-handler';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { DEFAULT_PERMISSIONS } from '../../../components/constants';
import { validate } from '../middleware/validate';
import { updateUserSchema, setInitialPasswordSchema, changePasswordSchema, updateUserRoleSchema, updateUserPermissionsSchema, createUserSchema } from '../schemas/userSchemas';

const router = express.Router();

// PUT /api/users/:id (for profile updates)
router.put('/:id', validate(updateUserSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, email } = req.body;
    const requesterId = req.user?.userId;
    const requesterRole = req.user?.role;

    if (requesterRole !== 'Admin' && parseInt(id, 10) !== requesterId) {
        res.status(403).json({ message: 'You are not authorized to update this profile.' });
        return;
    }

    const updatedUserRaw = await prisma.user.update({
        where: { id: parseInt(id, 10) },
        data: { name, email },
        select: { id: true, name: true, email: true, role: true, permissions: true, mustResetPassword: true }
    });

    const permissions = (updatedUserRaw.permissions as object) || DEFAULT_PERMISSIONS[updatedUserRaw.role] || {};
    res.json({ ...updatedUserRaw, permissions });
}));

// POST /api/users/set-initial-password
router.post('/set-initial-password', validate(setInitialPasswordSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { newPassword } = req.body;
    const userId = req.user?.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mustResetPassword) {
        res.status(403).json({ message: 'Not authorized or password reset not required.' });
        return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword, mustResetPassword: false },
        select: { id: true, name: true, email: true, role: true, permissions: true, mustResetPassword: true }
    });

    res.json({ updatedUser: { ...updatedUser, permissions: (updatedUser.permissions as object) || DEFAULT_PERMISSIONS[updatedUser.role] } });
}));

// POST /api/users/:userId/change-password
router.post('/:userId/change-password', validate(changePasswordSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const { current, newPass } = req.body;
    const requesterId = req.user?.userId;

    if (parseInt(userId, 10) !== requesterId) {
        res.status(403).json({ message: 'You can only change your own password.' });
        return;
    }

    const user = await prisma.user.findUnique({ where: { id: requesterId } });
    if (!user) {
        res.status(404).json({ message: 'User not found.' });
        return;
    }

    const isPasswordValid = await bcrypt.compare(current, user.password);
    if (!isPasswordValid) {
        res.status(400).json({ message: 'Incorrect current password.' });
        return;
    }

    const hashedPassword = await bcrypt.hash(newPass, 10);
    const updatedUserRaw = await prisma.user.update({
        where: { id: requesterId },
        data: { password: hashedPassword },
        select: { id: true, name: true, email: true, role: true, permissions: true, mustResetPassword: true }
    });
    
    const permissions = (updatedUserRaw.permissions as object) || DEFAULT_PERMISSIONS[updatedUserRaw.role] || {};
    res.json({ updatedUser: {...updatedUserRaw, permissions} });
}));

// PUT /api/users/:userId/role
router.put('/:userId/role', validate(updateUserRoleSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== 'Admin') {
        res.status(403).json({ message: 'Only admins can change roles.' });
        return;
    }
    const { userId } = req.params;
    const { role } = req.body;

    if (parseInt(userId, 10) === req.user?.userId && role !== 'Admin') {
         const adminCount = await prisma.user.count({ where: { role: 'Admin' } });
         if (adminCount <= 1) {
             res.status(400).json({ message: 'Cannot demote the only administrator.' });
             return;
         }
    }

    await prisma.user.update({
        where: { id: parseInt(userId, 10) },
        data: { role, permissions: DEFAULT_PERMISSIONS[role] as any },
    });

    const allUsers = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, permissions: true, mustResetPassword: true }
    });
    res.json(allUsers);
}));

// PUT /api/users/:userId/permissions
router.put('/:userId/permissions', validate(updateUserPermissionsSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
     if (req.user?.role !== 'Admin') {
        res.status(403).json({ message: 'Only admins can change permissions.' });
        return;
    }
    const { userId } = req.params;
    const { permissions } = req.body;

    await prisma.user.update({
        where: { id: parseInt(userId, 10) },
        data: { permissions: permissions as any },
    });

    const allUsers = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, permissions: true, mustResetPassword: true }
    });
    res.json(allUsers);
}));

// POST /api/users (Add new staff)
router.post('/', validate(createUserSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== 'Admin') {
        res.status(403).json({ message: 'Only admins can add new users.' });
        return;
    }
    const { name, email, role, password, mustResetPassword } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        res.status(409).json({ message: 'User with this email already exists.' });
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await prisma.user.create({
        data: {
            name, email, role, password: hashedPassword, mustResetPassword: mustResetPassword ?? true,
            permissions: DEFAULT_PERMISSIONS[role] as any,
        },
        select: { id: true, name: true, email: true, role: true, permissions: true, mustResetPassword: true }
    });
    
    const allUsers = await prisma.user.findMany({
         select: { id: true, name: true, email: true, role: true, permissions: true, mustResetPassword: true }
    });
    res.status(201).json({ allUsers, addedUser: newUser });
}));

export default router;
