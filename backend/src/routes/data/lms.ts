
import express from 'express';
import prisma from '../../lib/prisma';
import { validate } from '../../middleware/validate';
import { createCourseSchema, updateCourseSchema, createModuleSchema, createLessonSchema } from '../../schemas/lmsSchemas';

const router = express.Router();

// GET /api/data/lms/courses
// FIX: Use express.Request, express.Response, and express.NextFunction to ensure correct type resolution.
router.get('/courses', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const courses = await prisma.lmsCourse.findMany({
            include: {
                modules: { include: { lessons: true }, orderBy: { createdAt: 'asc' } },
                discussions: { include: { posts: { orderBy: { timestamp: 'asc' } } } }
            }
        });
        res.json(courses);
    } catch (error) {
        next(error);
    }
});

// POST /api/data/lms/courses
// FIX: Use express.Request, express.Response, and express.NextFunction to ensure correct type resolution.
router.post('/courses', validate(createCourseSchema), async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        await prisma.lmsCourse.create({ data: { ...req.body, id: `course-${Date.now()}` } });
        const courses = await prisma.lmsCourse.findMany({ include: { modules: { include: { lessons: true } }, discussions: { include: { posts: true } } } });
        res.status(201).json(courses);
    } catch (error) {
        next(error);
    }
});

// PUT /api/data/lms/courses/:id
// FIX: Use express.Request, express.Response, and express.NextFunction to ensure correct type resolution.
router.put('/courses/:id', validate(updateCourseSchema), async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const { id, ...courseData } = req.body;
        await prisma.lmsCourse.update({ where: { id: req.params.id }, data: courseData });
        const courses = await prisma.lmsCourse.findMany({ include: { modules: { include: { lessons: true } }, discussions: { include: { posts: true } } } });
        res.json(courses);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/data/lms/courses/:id
// FIX: Use express.Request, express.Response, and express.NextFunction to ensure correct type resolution.
router.delete('/courses/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        await prisma.lmsCourse.delete({ where: { id: req.params.id } });
        const courses = await prisma.lmsCourse.findMany({ include: { modules: { include: { lessons: true } }, discussions: { include: { posts: true } } } });
        res.json(courses);
    } catch (error) {
        next(error);
    }
});

// POST /api/data/lms/courses/:courseId/modules
// FIX: Use express.Request, express.Response, and express.NextFunction to ensure correct type resolution.
router.post('/courses/:courseId/modules', validate(createModuleSchema), async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        await prisma.lmsModule.create({
            data: { title: req.body.title, courseId: req.params.courseId, id: `mod-${Date.now()}` }
        });
        const courses = await prisma.lmsCourse.findMany({ include: { modules: { include: { lessons: true } }, discussions: { include: { posts: true } } } });
        res.status(201).json(courses);
    } catch (error) {
        next(error);
    }
});

// PUT /api/data/lms/courses/:courseId/modules/:moduleId
// FIX: Use express.Request, express.Response, and express.NextFunction to ensure correct type resolution.
router.put('/courses/:courseId/modules/:moduleId', validate(createModuleSchema), async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        await prisma.lmsModule.update({ where: { id: req.params.moduleId }, data: { title: req.body.title } });
        const courses = await prisma.lmsCourse.findMany({ include: { modules: { include: { lessons: true } }, discussions: { include: { posts: true } } } });
        res.json(courses);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/data/lms/courses/:courseId/modules/:moduleId
// FIX: Use express.Request, express.Response, and express.NextFunction to ensure correct type resolution.
router.delete('/courses/:courseId/modules/:moduleId', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        await prisma.lmsModule.delete({ where: { id: req.params.moduleId } });
        const courses = await prisma.lmsCourse.findMany({ include: { modules: { include: { lessons: true } }, discussions: { include: { posts: true } } } });
        res.json(courses);
    } catch (error) {
        next(error);
    }
});

// POST /api/data/lms/courses/:courseId/modules/:moduleId/lessons
// FIX: Use express.Request, express.Response, and express.NextFunction to ensure correct type resolution.
router.post('/courses/:courseId/modules/:moduleId/lessons', validate(createLessonSchema), async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const { id, ...lessonData } = req.body;
        await prisma.lmsLesson.create({
            data: { ...lessonData, id: `les-${Date.now()}`, moduleId: req.params.moduleId }
        });
        const courses = await prisma.lmsCourse.findMany({ include: { modules: { include: { lessons: true } }, discussions: { include: { posts: true } } } });
        res.status(201).json(courses);
    } catch (error) {
        next(error);
    }
});

// PUT /api/data/lms/courses/:courseId/lessons/:lessonId
// FIX: Use express.Request, express.Response, and express.NextFunction to ensure correct type resolution.
router.put('/courses/:courseId/lessons/:lessonId', validate(createLessonSchema), async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const { id, ...lessonData } = req.body;
        await prisma.lmsLesson.update({ where: { id: req.params.lessonId }, data: lessonData });
        const courses = await prisma.lmsCourse.findMany({ include: { modules: { include: { lessons: true } }, discussions: { include: { posts: true } } } });
        res.json(courses);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/data/lms/courses/:courseId/lessons/:lessonId
// FIX: Use express.Request, express.Response, and express.NextFunction to ensure correct type resolution.
router.delete('/courses/:courseId/lessons/:lessonId', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        await prisma.lmsLesson.delete({ where: { id: req.params.lessonId } });
        const courses = await prisma.lmsCourse.findMany({ include: { modules: { include: { lessons: true } }, discussions: { include: { posts: true } } } });
        res.json(courses);
    } catch (error) {
        next(error);
    }
});

// GET /api/data/lms/coupons
// FIX: Use express.Request, express.Response, and express.NextFunction to ensure correct type resolution.
router.get('/coupons', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const coupons = await prisma.coupon.findMany();
        res.json(coupons);
    } catch (error) {
        next(error);
    }
});

// POST /api/data/lms/coupons
// FIX: Use express.Request, express.Response, and express.NextFunction to ensure correct type resolution.
router.post('/coupons', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const { code, discountPercentage, ...data } = req.body;
        await prisma.coupon.upsert({
            where: { code },
            update: { discountPercentage, ...data },
            create: { code, discountPercentage, ...data }
        });
        const coupons = await prisma.coupon.findMany();
        res.json(coupons);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/data/lms/coupons/:code
// FIX: Use express.Request, express.Response, and express.NextFunction to ensure correct type resolution.
router.delete('/coupons/:code', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        await prisma.coupon.delete({ where: { code: req.params.code } });
        const coupons = await prisma.coupon.findMany();
        res.json(coupons);
    } catch (error) {
        next(error);
    }
});

// POST /api/data/lms/courses/:courseId/discussions/:threadId
// FIX: Use express.Request, express.Response, and express.NextFunction to ensure correct type resolution.
router.post('/courses/:courseId/discussions/:threadId', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
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
    } catch (error) {
        next(error);
    }
});

export default router;
