export type CourseType = "course" | "combo" | "core";

export type CourseResource = {
  name: string;
  url: string;
};

export type CourseLesson = {
  id: string;
  title: string;
  video: string;
  videoId: string;
  accessLevel: string;
  image: string;
  content: string;
  durationMin: number | null;
  resources: CourseResource[];
};

export type CourseModule = {
  id: string;
  title: string;
  lessons: CourseLesson[];
};

export type CourseCatalogListItem = {
  id: string;
  title: string;
  type: CourseType;
  software: string;
  firstLessonId: string | null;
  moduleCount: number;
  lessonCount: number;
  /** Flattened lessons (with id + indices) for search indexing and deep-linking */
  lessons: Array<{ id: string; module: string; moduleIndex: number; lessonIndex: number; title: string; content: string }>;
};

export type CourseCatalogDetail = {
  id: string;
  title: string;
  type: CourseType;
  software: string;
  summary: string;
  image: string;
  content: string;
  commands: string[];
  combos: string[];
  resources: CourseResource[];
  modules: CourseModule[];
  firstLessonId: string | null;
  moduleCount: number;
  lessonCount: number;
  estimatedMinutes: number;
};
