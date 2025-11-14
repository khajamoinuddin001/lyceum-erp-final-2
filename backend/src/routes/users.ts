import * as express from 'express';
// FIX: Changed require to import for PrismaClient to resolve module resolution issues with TypeScript.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth';
import { DEFAULT_PERMISSIONS } from '../../../components/constants';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/users/set-initial-password
// FIX: Changed handler signature to use Request and Response from express to match RequestHandler type.
router.post('/set-initial-password', async (req: express.Request, res: express.Response) => {
    const { newPassword } = req.body;
    // FIX: Cast req to AuthRequest to access the user property.
    const userId = (req as AuthRequest).user?.userId;

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.mustResetPassword) {
            return res.status(403).json({ message: 'Not authorized or password reset not required.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                mustResetPassword: false,
            },
            select: { id: true, name: true, email: true, role: true, permissions: true, mustResetPassword: true }
        });

        res.json({ updatedUser: { ...updatedUser, permissions: updatedUser.permissions || DEFAULT_PERMISSIONS[updatedUser.role] } });
    } catch (error) {
        console.error('Initial password set error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// POST /api/users/:userId/change-password
// FIX: Changed handler signature to use Request and Response from express.
router.post('/:userId/change-password', async (req: express.Request, res: express.Response) => {
    const { userId } = req.params;
    const { current, newPass } = req.body;
    // FIX: Cast req to AuthRequest to access the user property.
    const requesterId = (req as AuthRequest).user?.userId;

    if (parseInt(userId, 10) !== requesterId) {
        return res.status(403).json({ message: 'You can only change your own password.' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: requesterId } });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const isPasswordValid = await bcrypt.compare(current, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Incorrect current password.' });
        }

        const hashedPassword = await bcrypt.hash(newPass, 10);
        const updatedUserRaw = await prisma.user.update({
            where: { id: requesterId },
            data: { password: hashedPassword },
            select: { id: true, name: true, email: true, role: true, permissions: true, mustResetPassword: true }
        });
        
        const permissions = updatedUserRaw.permissions || DEFAULT_PERMISSIONS[updatedUserRaw.role] || {};

        res.json({ updatedUser: {...updatedUserRaw, permissions} });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// PUT /api/users/:userId/role
router.put('/:userId/role', async (req: express.Request, res: express.Response) => {
    if ((req as AuthRequest).user?.role !== 'Admin') {
        return res.status(403).json({ message: 'Only admins can change roles.' });
    }
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !['Admin', 'Employee', 'Student'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role provided.' });
    }

    try {
        if (parseInt(userId, 10) === (req as AuthRequest).user?.userId && role !== 'Admin') {
             const adminCount = await prisma.user.count({ where: { role: 'Admin' } });
             if (adminCount <= 1) {
                 return res.status(400).json({ message: 'Cannot demote the only administrator.' });
             }
        }

        await prisma.user.update({
            where: { id: parseInt(userId, 10) },
            data: { 
                role,
                permissions: DEFAULT_PERMISSIONS[role] as any,
            },
        });

        const allUsers = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, permissions: true, mustResetPassword: true }
        });

        res.json(allUsers);

    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// PUT /api/users/:userId/permissions
router.put('/:userId/permissions', async (req: express.Request, res: express.Response) => {
     if ((req as AuthRequest).user?.role !== 'Admin') {
        return res.status(403).json({ message: 'Only admins can change permissions.' });
    }
    const { userId } = req.params;
    const { permissions } = req.body;

    if (!permissions) {
        return res.status(400).json({ message: 'Permissions object is required.' });
    }

    try {
        await prisma.user.update({
            where: { id: parseInt(userId, 10) },
            data: { permissions: permissions as any },
        });

        const allUsers = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, permissions: true, mustResetPassword: true }
        });

        res.json(allUsers);

    } catch (error) {
        console.error('Update permissions error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// POST /api/users (Add new staff)
router.post('/', async (req: express.Request, res: express.Response) => {
    if ((req as AuthRequest).user?.role !== 'Admin') {
        return res.status(403).json({ message: 'Only admins can add new users.' });
    }
    const { name, email, role, password, mustResetPassword } = req.body;

    if (!name || !email || !role || !password) {
        return res.status(400).json({ message: 'Name, email, role, and password are required.' });
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                role,
                password: hashedPassword,
                mustResetPassword: mustResetPassword ?? true,
                permissions: DEFAULT_PERMISSIONS[role] as any,
            },
            select: { id: true, name: true, email: true, role: true, permissions: true, mustResetPassword: true }
        });
        
        const allUsers = await prisma.user.findMany({
             select: { id: true, name: true, email: true, role: true, permissions: true, mustResetPassword: true }
        });

        res.status(201).json({ allUsers, addedUser: newUser });
    } catch (error) {
        console.error('Add user error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

export default router;