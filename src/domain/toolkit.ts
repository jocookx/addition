export type ToolkitItemType = "command" | "combo" | "course" | "resource";

export type ToolkitItem = {
  id: string;
  contentId: string;
  contentType: ToolkitItemType;
  savedAt: string;
};
