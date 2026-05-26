import type { AccessDecision } from "@/domain/access";

export type ResourceType =
  | "File"
  | "Template"
  | "Cheat Sheet"
  | "Script"
  | "Dataset"
  | "Exercise File"
  | "Recording"
  | "Link";

export type ResourceListItem = {
  id: string;
  title: string;
  type: ResourceType | string;
  software: string;
  accessLevel: string;
  tags: string[];
  saved?: boolean;
  url?: string;
  access: AccessDecision;
};
