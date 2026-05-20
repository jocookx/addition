import { z } from "zod";

export const StudioLessonSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().default("Untitled lesson"),
    video: z.string().optional().default(""),
    image: z.string().optional().default(""),
    content: z.string().optional().default(""),
    durationMin: z.number().int().nullable().optional().default(null),
    resources: z.array(z.object({ name: z.string(), url: z.string() })).optional().default([]),
  })
  .passthrough();

export const StudioModuleSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().default("Untitled module"),
    lessons: z.array(StudioLessonSchema).default([]),
  })
  .passthrough();

export const StudioCourseSchema = z
  .object({
    bucket: z.enum(["core", "courses"]),
    id: z.string().min(1),
    title: z.string().default("Untitled course"),
    type: z.string().default("general"),
    software: z.string().default(""),
    summary: z.string().optional().default(""),
    image: z.string().optional().default(""),
    draft: z.boolean().optional().default(false),
    category: z.string().optional().default(""),
    level: z.string().optional().default(""),
    projectDomain: z.string().optional().default(""),
    pathKind: z.string().optional().default(""),
    courseIds: z.array(z.string()).optional().default([]),
    modules: z.array(StudioModuleSchema).default([]),
  })
  .passthrough();

export const StudioPayloadSchema = z.object({
  categories: z.array(z.string()).default([]),
  softwareOptions: z.array(z.string()).default([]),
  items: z.array(StudioCourseSchema).default([]),
});

export type StudioLesson = z.infer<typeof StudioLessonSchema>;
export type StudioModule = z.infer<typeof StudioModuleSchema>;
export type StudioCourse = z.infer<typeof StudioCourseSchema>;
export type StudioPayload = z.infer<typeof StudioPayloadSchema>;
