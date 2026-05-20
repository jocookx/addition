"use client";

import { useEffect, useState } from "react";
import type { ToolkitItemType } from "@/domain/toolkit";
import { saveToolkitItem, removeToolkitItem } from "@/lib/api/toolkit";

type SaveButtonProps = {
  contentId: string;
  contentType: ToolkitItemType;
  accessToken?: string;
  saved: boolean;
  onSavedChange?: (next: boolean) => void;
};

export function SaveButton({ contentId, contentType, accessToken, saved, onSavedChange }: SaveButtonProps) {
  const [busy, setBusy] = useState(false);
  const [internalSaved, setInternalSaved] = useState(saved);

  useEffect(() => {
    setInternalSaved(saved);
  }, [saved]);

  async function handleClick() {
    if (!accessToken) return;
    setBusy(true);
    try {
      if (internalSaved) {
        await removeToolkitItem(contentId, contentType, accessToken);
        setInternalSaved(false);
        onSavedChange?.(false);
      } else {
        await saveToolkitItem(contentId, contentType, accessToken);
        setInternalSaved(true);
        onSavedChange?.(true);
      }
    } catch {
      // silently ignore; the parent state will remain the source of truth on refresh
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={`ghost-btn${internalSaved ? " active" : ""}`}
      onClick={handleClick}
      disabled={busy || !accessToken}
      aria-pressed={internalSaved}
    >
      {busy ? "Saving…" : internalSaved ? "Saved" : "Save"}
    </button>
  );
}
