"use client";

import Image from "next/image";
import { useState } from "react";
import { SaveButton } from "@/components/legacy/SaveButton";
import { TagChips } from "@/components/legacy/TagChips";
import type { CommandListItem } from "@/domain/command";

function cleanCommandName(name: string) {
  return name.split(/\s*\|/)[0]?.trim() || name;
}

type CommandDetailModalProps = {
  command: CommandListItem;
  commands: CommandListItem[];
  onClose: () => void;
  onOpenCommand?: (command: CommandListItem) => void;
  learned?: boolean;
  onToggleLearned?: (command: CommandListItem) => void;
  saved?: boolean;
  onToggleSaved?: (command: CommandListItem, next: boolean) => void;
  accessToken?: string;
};

export function CommandDetailModal({
  command,
  commands,
  onClose,
  onOpenCommand,
  learned,
  onToggleLearned,
  saved,
  onToggleSaved,
  accessToken,
}: CommandDetailModalProps) {
  const cleanName = cleanCommandName(command.name);
  const [copied, setCopied] = useState(false);

  function copyCommand() {
    void navigator.clipboard.writeText(cleanName).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const relatedCommands = commands
    .filter((item) => item.id !== command.id && item.software === command.software)
    .filter((item) => {
      if (command.software === "Grasshopper") return item.addon && item.addon === command.addon;
      const itemGroup = item.menu.split(/[>/|]/)[0]?.trim() || "";
      const commandGroup = command.menu.split(/[>/|]/)[0]?.trim() || "";
      return Boolean(itemGroup) && itemGroup === commandGroup;
    })
    .slice(0, 8);

  return (
    <div className="cmd-modal-backdrop" onClick={onClose} role="presentation">
      <section
        className="cmd-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cmd-modal-head">
          <div className="cmd-modal-title-wrap">
            <div className="legacy-tag-row">
              <span className="legacy-tag primary">{command.software}</span>
              {command.addon ? <span className="legacy-tag muted">{command.addon}</span> : null}
              {learned ? <span className="legacy-tag success">Learned</span> : null}
            </div>
            <h3 id="command-modal-title">{cleanName}</h3>
            <TagChips tags={command.tags} />
          </div>
          <button type="button" className="ghost-btn" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="cmd-modal-layout">
          <div className="cmd-modal-media">
            {command.gif || command.icon ? (
              <Image src={command.gif || command.icon} alt={cleanName} width={1200} height={800} unoptimized />
            ) : (
              <div className="cmd-modal-empty">No preview available</div>
            )}
          </div>

          <div className="cmd-modal-body">
            <div className="cmd-modal-section">
              <div className="cmd-modal-section-label">Command line</div>
              {command.software === "Grasshopper" ? (
                <div className="cmd-line-chip cmd-gh-chip">
                  <span className="cmd-gh-chip-icon">⬡</span>
                  {command.addon || "Grasshopper"}
                </div>
              ) : (
                <div className="cmd-line-chip cmd-line-chip--modal">
                  <span className="cmd-line-prompt">_</span>
                  <span className="cmd-line-name">{cleanName}</span>
                  <button
                    type="button"
                    className={`cmd-copy-btn${copied ? " copied" : ""}`}
                    aria-label={`Copy ${cleanName} command`}
                    onClick={copyCommand}
                  >
                    {copied ? (
                      <svg width="13" height="13" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <rect x="4" y="1" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M1 4h2v6a1 1 0 001 1h5v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="cmd-modal-section">
              <div className="cmd-modal-section-label">Menu path</div>
              <p className="meta">{command.menu || "No menu path available."}</p>
            </div>

            {command.shortcut ? (
              <div className="cmd-modal-section">
                <div className="cmd-modal-section-label">Shortcut</div>
                <p className="meta">{command.shortcut}</p>
              </div>
            ) : null}

            <div className="cmd-modal-section">
              <div className="cmd-modal-section-label">Description</div>
              <p className="cmd-modal-copy">{command.description || "No description yet."}</p>
            </div>

            {relatedCommands.length && onOpenCommand ? (
              <div className="cmd-modal-section">
                <div className="cmd-modal-section-label">Related</div>
                <div className="cmd-modal-related">
                  {relatedCommands.map((item) => (
                    <button key={item.id} type="button" className="cmd-modal-related-chip" onClick={() => onOpenCommand(item)}>
                      {cleanCommandName(item.name)}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {onToggleLearned || typeof saved !== "undefined" ? (
              <div className="cmd-modal-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {onToggleLearned ? (
                  <button type="button" className="primary-button" onClick={() => onToggleLearned(command)}>
                    {learned ? "Mark as not learned" : "Mark as learned"}
                  </button>
                ) : null}
                {typeof saved !== "undefined" ? (
                  <SaveButton
                    contentId={command.id}
                    contentType="command"
                    accessToken={accessToken}
                    saved={saved}
                    onSavedChange={(next) => onToggleSaved?.(command, next)}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
