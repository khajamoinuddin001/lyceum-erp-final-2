import express, { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';
import type { Channel } from '../../types';

const router = express.Router();

// GET /api/data/discuss/channels
router.get('/channels', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const channels = await prisma.channel.findMany();
        res.json(channels);
    } catch (error) {
        next(error);
    }
});

// POST /api/data/discuss/channels/group
router.post('/channels/group', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, memberIds } = req.body;
        if (!name || !Array.isArray(memberIds) || memberIds.length === 0) {
            res.status(400).json({ message: 'Valid name and at least one member are required.' });
            return;
        }
        const members = [req.user!.userId, ...memberIds];
        const user = await prisma.user.findUnique({ where: { id: req.user?.userId }});
        
        await prisma.channel.create({
            data: {
                id: `group-${Date.now()}`,
                name,
                type: 'private',
                members,
                messages: [{
                    id: Date.now(),
                    author: 'System',
                    text: `${user?.name} created the group "${name}".`,
                    timestamp: new Date().toISOString(),
                }] as any
            }
        });
        const channels = await prisma.channel.findMany();
        res.status(201).json(channels);
    } catch (error) {
        next(error);
    }
});

// PUT /api/data/discuss/channels
router.put('/channels', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const channels: Channel[] = req.body;
        if (!Array.isArray(channels)) {
            res.status(400).json({ message: 'Invalid data format.' });
            return;
        }

        // This is a simplified "save all" endpoint. A real-world app would have more granular updates.
        for (const channel of channels) {
            await prisma.channel.upsert({
                where: { id: channel.id },
                update: { messages: channel.messages as any },
                create: { 
                    id: channel.id,
                    name: channel.name,
                    type: channel.type,
                    members: channel.members,
                    messages: channel.messages as any
                }
            });
        }
        const updatedChannels = await prisma.channel.findMany();
        res.json(updatedChannels);
    } catch (error) {
        next(error);
    }
});

export default router;