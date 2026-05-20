export type CommandGroupMode = "toolbar" | "az" | "function";

export type CommandListItem = {
  id: string;
  name: string;
  software: string;
  menu: string;
  description: string;
  source: string;
  icon: string;
  gif: string;
  shortcut: string;
  addon: string;
  tags: string[];
  intentCategories: string[];
  objectTypes: string[];
  outcomes: string[];
  difficulty: string;
};
