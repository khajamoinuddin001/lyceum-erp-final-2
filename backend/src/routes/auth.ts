import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import prisma from '../lib/prisma';
import { DEFAULT_PERMISSIONS } from '../constants';
import { validate } from '../middleware/validate';
import { loginSchema, registerSchema } from '../schemas/authSchemas';
import { UserRole } from '../types';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, 
	max: 10, 
	standardHeaders: true,
	legacyHeaders: false, 
    message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
});

router.post('/register', authLimiter, validate(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(409).json({ message: 'An account with this email already exists.' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'Student',
                permissions: DEFAULT_PERMISSIONS['Student'] as any,
            },
        });

        const contactCount = await prisma.contact.count();
        const contactId = `LA${new Date().getFullYear()}${String(contactCount + 1).padStart(4, '0')}`;
        const newContact = await prisma.contact.create({
            data: {
                name,
                email,
                contactId,
                department: 'Unassigned',
                major: 'Unassigned',
                phone: '',
                userId: newUser.id
            }
        });
        
        const { password: _, ...userToReturn } = newUser;
        const token = jwt.sign({ userId: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ user: { ...userToReturn, permissions: DEFAULT_PERMISSIONS['Student'] }, contact: newContact, token });
    } catch (error) {
        next(error);
    }
});

router.post('/login', authLimiter, validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials.' });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ message: 'Invalid credentials.' });
            return;
        }
        
        const { password: _, ...userToReturn } = user;
        const role = user.role as UserRole;
        const permissions = (user.permissions && typeof user.permissions === 'object' && Object.keys(user.permissions).length > 0) 
            ? user.permissions 
            : DEFAULT_PERMISSIONS[role] || {};

        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({ user: { ...userToReturn, permissions }, token });
    } catch (error) {
        next(error);
    }
});

export default router;