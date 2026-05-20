export type PathLevel = "explorer" | "improver" | "refiner";

export type LearningPathListItem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  outcome: string;
  level: PathLevel;
  audience: string;
  software: string[];
  image: string;
  courseCount: number;
  sortOrder: number;
};

export type LearningPathCourse = {
  id: string;
  title: string;
  type: string;
  software: string;
  lessonCount: number;
  estimatedMinutes: number;
};

export type LearningPathDetail = LearningPathListItem & {
  courses: LearningPathCourse[];
};

export type PathEnrolment = {
  pathId: string;
  enrolledAt: string;
};
