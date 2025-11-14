import express, { Request, Response } from 'express';
// FIX: Changed require to import for PrismaClient to resolve module resolution issues with TypeScript.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DEFAULT_PERMISSIONS } from '../../../components/constants'; 
import { AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// POST /api/auth/register (For Students)
router.post('/register', async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
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
        const contactId = `LA${new Date().getFullYear()}${(await prisma.contact.count()) + 1}`;
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
        
        // Don't send password back
        const { password: _, ...userToReturn } = newUser;

        // Generate a token for immediate login
        const token = jwt.sign({ userId: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ user: { ...userToReturn, permissions: DEFAULT_PERMISSIONS['Student'] }, contact: newContact, token });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error during registration.' });
    }
});


// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        
        const { password: _, ...userToReturn } = user;
        
        // Add permissions to user object based on role
        const permissions = user.permissions ? user.permissions : DEFAULT_PERMISSIONS[user.role] || {};

        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({ user: { ...userToReturn, permissions }, token });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error during login.' });
    }
});

export default router;