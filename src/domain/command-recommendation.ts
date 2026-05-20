import type { CommandProgressStatusSchema } from "@/domain/learning-progress";
import type { z } from "zod";

export type CommandProgressStatus = z.infer<typeof CommandProgressStatusSchema>;

export type RecommendedCommand = {
  id: string;
  name: string;
  software: string;
  menu: string;
  description: string;
  status: CommandProgressStatus;
  proficiency: number;
  repetitions: number;
  lastPracticedAt: string | null;
  reason: "course_direct" | "combo_expanded";
};
