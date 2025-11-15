
import express, { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createCourseSchema, updateCourseSchema, createModuleSchema, createLessonSchema } from '../../schemas/lmsSchemas';

const router = express.Router();

// GET /api/data/lms/courses
router.get('/courses', asyncHandler(async (req: Request, res: Response) => {
    const courses = await prisma.lmsCourse.findMany({
        include: {
            modules: { include: { lessons: true }, orderBy: { createdAt: 'asc' } },
            discussions: { include: { posts: { orderBy: { timestamp: 'asc' } } } }
        }
    });
    res.json(courses);
}));

// POST /api/data/lms/courses
router.post('/courses', validate(createCourseSchema), asyncHandler(async (req: Request, res: Response) => {
    await prisma.lmsCourse.create({ data: { ...req.body, id: `course-${Date.now()}` } });
    const courses = await prisma.lmsCourse.findMany({ include: { modules: { include: { lessons: true } }, discussions: { include: { posts: true } } } });
    res.status(201).json(courses);
}));

// PUT /api/data/lms/courses/:id
router.put('/courses/:id', validate(updateCourseSchema), asyncHandler(async (req: Request, res: Response) => {
    const { id, ...courseData } = req.body;
    await prisma.lmsCourse.update({ where: { id: req.params.id }, data: courseData });
    const courses = await prisma.lmsCourse.findMany({ include: { modules: { include: { lessons: true } }, discussions: { include: { posts: true } } } });
    res.json(courses);
}));

// DELETE /api/data/lms/courses/:id
router.delete('/courses/:id', asyncHandler(async (req: Request, res: Response) => {
    await prisma.lmsCourse.delete({ where: { id: req.params.id } });
    const courses = await prisma.lmsCourse.findMany({ include: { modules: { include: { lessons: true } }, discussions: { include: { posts: true } } } });
    res.json(courses);
}));

// POST /api/data/lms/courses/:courseId/modules
router.post('/courses/:courseId/modules', validate(createModuleSchema), asyncHandler(async (req: Request, res: Response) => {
    await prisma.lmsModule.create({
        data: { title: req.body.title, courseId: req.params.courseId, id: `mod-${Date.now()}` }
    });
    const courses = await prisma.lmsCourse.findMany({ include: { modules: { include: { lessons: true } }, discussions: { include: { posts: true } } } });
    res.status(201).json(courses);
}));

// PUT /api/data/lms/courses/:courseId/modules/:moduleId
router.put('/courses/:courseId/modules/:moduleId', validate(createModuleSchema), asyncHandler(async (req: Request, res: Response) => {
    await prisma.lmsModule.update({ where: { id: req.params.moduleId }, data: { title: req.body.title } });
    const courses = await prisma.lmsCourse.findMany({ include: { modules: { include: { lessons: true } }, discussions: { include: { posts: true } } } });
    res.json(courses);
}));

// DELETE /api/data/lms/courses/:courseId/modules/:moduleId
router.delete('/courses/:courseId/modules/:moduleId', asyncHandler(async (req: Request, res: Response) => {
    await prisma.lmsModule.delete({ where: { id: req.params.moduleId } });
    const courses = await prisma.lmsCourse.findMany({ include: { modules: { include: { lessons: true } }, discussions: { include: { posts: true } } } });
    res.json(courses);
}));

// POST /api/data/lms/courses/:courseId/modules/:moduleId/lessons
router.post('/courses/:courseId/modules/:moduleId/lessons', validate(createLessonSchema), asyncHandler(async (req: Request, res: Response) => {
    const { id, ...lessonData } = req.body;
    await prisma.lmsLesson.create({
        data: { ...lessonData, id: `les-${Date.now()}`, moduleId: req.params.moduleId }
    });
    const courses = await prisma.lmsCourse.findMany({ include: { modules: { include: { lessons: true } }, discussions: { include: { posts: true } } } });
    res.status(201).json(courses);
}));

// PUT /api/data/lms/courses/:courseId/lessons/:lessonId
router.put('/courses/:courseId/lessons/:lessonId', validate(createLessonSchema), asyncHandler(async (req: Request, res: Response) => {
    const { id, ...lessonData } = req.body;
    await prisma.lmsLesson.update({ where: { id: req.params.lessonId }, data: lessonData });
    const courses = await prisma.lmsCourse.findMany({ include: { modules: { include: { lessons: true } }, discussions: { include: { posts: true } } } });
    res.json(courses);
}));

// DELETE /api/data/lms/courses/:courseId/lessons/:lessonId
router.delete('/courses/:courseId/lessons/:lessonId', asyncHandler(async (req: Request, res: Response) => {
    await prisma.lmsLesson.delete({ where: { id: req.params.lessonId } });
    const courses = await prisma.lmsCourse.findMany({ include: { modules: { include: { lessons: true } }, discussions: { include: { posts: true } } } });
    res.json(courses);
}));

// GET /api/data/lms/coupons
router.get('/coupons', asyncHandler(async (req: Request, res: Response) => {
    const coupons = await prisma.coupon.findMany();
    res.json(coupons);
}));

// POST /api/data/lms/coupons
router.post('/coupons', asyncHandler(async (req: Request, res: Response) => {
    const { code, discountPercentage, ...data } = req.body;
    await prisma.coupon.upsert({
        where: { code },
        update: { discountPercentage, ...data },
        create: { code, discountPercentage, ...data }
    });
    const coupons = await prisma.coupon.findMany();
    res.json(coupons);
}));

// DELETE /api/data/lms/coupons/:code
router.delete('/coupons/:code', asyncHandler(async (req: Request, res: Response) => {
    await prisma.coupon.delete({ where: { code: req.params.code } });
    const coupons = await prisma.coupon.findMany();
    res.json(coupons);
}));

// POST /api/data/lms/courses/:courseId/discussions/:threadId
router.post('/courses/:courseId/discussions/:threadId', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { courseId, threadId } = req.params;
    const { title, content } = req.body;
    if (!content) { res.status(400).json({ message: 'Content is required.' }); return; }
    
    const user = await prisma.user.findUnique({ where: { id: req.user?.userId } });
    if (!user) { res.status(401).send(); return; }

    if (threadId === 'new') {
        if (!title) { res.status(400).json({ message: 'Title is required for a new thread.' }); return; }
        await prisma.discussionThread.create({
            data: {
                id: `thread-${Date.now()}`, title, courseId,
                posts: { create: {
                    id: `post-${Date.now()}`, content, authorId: user.id, authorName: user.name, timestamp: new Date().toISOString()
                }}
            }
        });
    } else {
         await prisma.discussionPost.create({
            data: {
                id: `post-${Date.now()}`, content, authorId: user.id, authorName: user.name, timestamp: new Date().toISOString(), threadId
            }
        });
    }
    
    const courses = await prisma.lmsCourse.findMany({ include: { modules: { include: { lessons: true } }, discussions: { include: { posts: true } } } });
    res.status(201).json(courses);
}));

export default router;
