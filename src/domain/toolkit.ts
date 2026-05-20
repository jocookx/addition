export type ToolkitItemType = "command" | "combo" | "course";

export type ToolkitItem = {
  id: string;
  contentId: string;
  contentType: ToolkitItemType;
  savedAt: string;
};
