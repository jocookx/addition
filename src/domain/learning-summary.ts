export type LearningSummaryEvent = {
  id: number;
  type: string;
  createdAt: string;
  payload: Record<string, unknown>;
};

export type LearningSummaryCourse = {
  courseId: string;
  title: string;
  software: string;
  status: "active" | "completed" | "archived" | "dropped";
  percentComplete: number;
  completedLessons: number;
  totalLessons: number;
};

export type LearningSummary = {
  userId: string;
  generatedAt: string;
  totals: {
    activeCourses: number;
    completedCourses: number;
    completedLessons: number;
    masteredCommands: number;
    practicedCommands: number;
    eventsLast7Days: number;
    streakDays: number;
  };
  activity: {
    days: Array<{ day: string; count: number }>;
  };
  nextUp: {
    courseId: string;
    title: string;
    software: string;
    percentComplete: number;
    nextLessonId: string | null;
  } | null;
  recentEvents: LearningSummaryEvent[];
  courses: LearningSummaryCourse[];
};
