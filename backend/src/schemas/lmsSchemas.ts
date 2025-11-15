
import { z } from 'zod';

export const createCourseSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    instructor: z.string().min(1, "Instructor is required"),
    price: z.number().nonnegative(),
  }),
});

export const updateCourseSchema = z.object({
    body: createCourseSchema.shape.body.partial(),
    params: z.object({
      id: z.string(),
    })
});


export const createModuleSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
  }),
});

export const createLessonSchema = z.object({
    body: z.object({
        title: z.string().min(1, "Title is required"),
        content: z.string().min(1, "Content is required"),
        videoUrl: z.string().url().optional().or(z.literal('')),
        attachments: z.array(z.object({
            id: z.string(),
            name: z.string(),
            url: z.string().url(),
        })).optional(),
        quiz: z.array(z.object({
            id: z.string(),
            question: z.string(),
            options: z.array(z.string()).length(4),
            correctAnswerIndex: z.number().min(0).max(3),
        })).optional(),
    })
});
