

// FIX: Import Request, Response types from express
import express, { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import asyncHandler from 'express-async-handler';
import prisma from '../lib/prisma';
import { DEFAULT_PERMISSIONS } from '../../../components/constants';
import { validate } from '../middleware/validate';
import { loginSchema, registerSchema } from '../schemas/authSchemas';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Apply rate limiting to authentication routes to prevent brute-force attacks
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 10, // Limit each IP to 10 requests per windowMs
	standardHeaders: true,
	legacyHeaders: false, 
    message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
});

// POST /api/auth/register (For Students)
router.post('/register', authLimiter, validate(registerSchema), asyncHandler(async (req: Request, res: Response) => {
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
        },
    });

    // Create a corresponding Contact record
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
}));

// POST /api/auth/login
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(async (req: Request, res: Response) => {
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
    const permissions = (user.permissions as object) || DEFAULT_PERMISSIONS[user.role] || {};

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ user: { ...userToReturn, permissions }, token });
}));

export default router;
