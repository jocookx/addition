"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { SaveButton } from "@/components/legacy/SaveButton";
import { TagChips } from "@/components/legacy/TagChips";
import type { CommandListItem } from "@/domain/command";
import { getSoftwareTerms, type AccessType } from "@/lib/software-terminology";

// ── Helpers ──────────────────────────────────────────────────────────────────

function cleanName(name: string) {
  return name.split(/\s*\|/)[0]?.trim() || name;
}

/** Parse a shortcut string like "Ctrl+Shift+E" or "Cmd + Z" into individual key tokens. */
function parseKeys(shortcut: string): string[] {
  return shortcut
    .split(/\s*\+\s*/)
    .map((k) => k.trim())
    .filter(Boolean);
}

// ── Sub-components ───────────────────────────────────────────────────────────

/** Keyboard key combo chip — used for shortcut-type software. */
function KeyCombo({ shortcut }: { shortcut: string }) {
  const keys = parseKeys(shortcut);
  if (!keys.length) return null;
  return (
    <div className="tool-key-combo">
      {keys.map((key, i) => (
        <span key={`${key}-${i}`} className="tool-key-wrap">
          {i > 0 && <span className="tool-key-sep" aria-hidden="true">+</span>}
          <kbd className="tool-key">{key}</kbd>
        </span>
      ))}
    </div>
  );
}

/** Library path breadcrumb — used for Grasshopper components and Dynamo nodes. */
function LibraryPath({ path, isGrasshopper }: { path: string; isGrasshopper: boolean }) {
  if (isGrasshopper) {
    return (
      <div className="cmd-line-chip cmd-gh-chip cmd-gh-chip--modal">
        <span className="cmd-gh-chip-icon" aria-hidden="true">⬡</span>
        {path || "Grasshopper"}
      </div>
    );
  }
  const parts = path.split(/[>/|]/).map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return <span className="meta">—</span>;
  return (
    <div className="tool-library-path">
      {parts.map((part, i) => (
        <span key={`${part}-${i}`} className="tool-library-path-row">
          {i > 0 && <span className="tool-path-sep" aria-hidden="true">›</span>}
          <span className="tool-path-part">{part}</span>
        </span>
      ))}
    </div>
  );
}

/** Command line chip — Rhino-specific, with copy button. */
function CommandLineChip({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    void navigator.clipboard.writeText(name).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <div className="cmd-line-chip cmd-line-chip--modal">
      <span className="cmd-line-prompt">_</span>
      <span className="cmd-line-name">{name}</span>
      <button
        type="button"
        className={`cmd-copy-btn${copied ? " copied" : ""}`}
        aria-label={`Copy ${name}`}
        onClick={copy}
      >
        {copied ? (
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <rect x="4" y="1" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <path d="M1 4h2v6a1 1 0 001 1h5v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </div>
  );
}

/** Renders the access chip appropriate for the software type. */
function AccessChip({
  accessType,
  name,
  shortcut,
  addon,
  isGrasshopper,
  menuPath,
}: {
  accessType: AccessType;
  name: string;
  shortcut: string;
  addon: string;
  isGrasshopper: boolean;
  menuPath: string;
}) {
  if (accessType === "command-line") {
    return <CommandLineChip name={name} />;
  }
  if (accessType === "shortcut") {
    if (!shortcut) return <span className="meta">No shortcut assigned</span>;
    return <KeyCombo shortcut={shortcut} />;
  }
  if (accessType === "library") {
    // For Grasshopper: addon = library name; for others: use menu path
    const path = isGrasshopper ? (addon || "Grasshopper") : (addon || menuPath);
    return <LibraryPath path={path} isGrasshopper={isGrasshopper} />;
  }
  return null;
}

/** Intent row — only shown when intent/object data is available. */
function IntentRow({ intentCategories, objectTypes, outcomes }: {
  intentCategories: string[];
  objectTypes: string[];
  outcomes: string[];
}) {
  const verb = intentCategories[0];
  const obj = objectTypes[0];
  const result = outcomes[0];

  if (!verb && !obj) return null;

  return (
    <div className="tool-intent-row">
      {verb && <span className="tool-intent-chip tool-intent-chip--verb">{verb}</span>}
      {obj && <span className="tool-intent-chip tool-intent-chip--obj">{obj}</span>}
      {result && (
        <>
          <span className="tool-intent-arrow" aria-hidden="true">→</span>
          <span className="tool-intent-chip tool-intent-chip--result">{result}</span>
        </>
      )}
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

type Props = {
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

type PreviewProps = Omit<Props, "onClose"> & {
  onOpenFull?: (command: CommandListItem) => void;
};

export function ToolActionPreviewPanel({
  command,
  commands,
  onOpenCommand,
  onOpenFull,
  learned,
  onToggleLearned,
  saved,
  onToggleSaved,
  accessToken,
}: PreviewProps) {
  const terms = getSoftwareTerms(command.software);
  const name = cleanName(command.name);
  const isGrasshopper = command.software === "Grasshopper";
  const relatedCommands = commands
    .filter((item) => item.id !== command.id && item.software === command.software)
    .filter((item) => {
      if (isGrasshopper) return item.addon && item.addon === command.addon;
      const itemGroup = item.menu.split(/[>/|]/)[0]?.trim() || "";
      const commandGroup = command.menu.split(/[>/|]/)[0]?.trim() || "";
      return Boolean(itemGroup) && itemGroup === commandGroup;
    })
    .slice(0, 6);
  const hasIntentData = (command.intentCategories?.length ?? 0) > 0 || (command.objectTypes?.length ?? 0) > 0;

  return (
    <aside className="cmd-preview-panel" aria-label={`${name} preview`}>
      <div className="cmd-preview-media">
        {command.gif || command.icon ? (
          <Image src={command.gif || command.icon} alt={name} width={900} height={520} unoptimized />
        ) : (
          <div className="cmd-modal-empty">No preview available</div>
        )}
      </div>

      <div className="cmd-preview-body">
        <div className="cmd-preview-head">
          <div className="legacy-tag-row">
            <span className="legacy-tag primary">{command.software}</span>
            {command.addon && !isGrasshopper ? <span className="legacy-tag muted">{command.addon}</span> : null}
            {learned ? <span className="legacy-tag success">Learned</span> : null}
          </div>
          <h3>{name}</h3>
          <TagChips tags={command.tags} />
        </div>

        {hasIntentData ? (
          <div className="cmd-modal-section">
            <IntentRow
              intentCategories={command.intentCategories ?? []}
              objectTypes={command.objectTypes ?? []}
              outcomes={command.outcomes ?? []}
            />
          </div>
        ) : null}

        {terms.accessType !== "none" ? (
          <div className="cmd-modal-section">
            <div className="cmd-modal-section-label">{terms.accessLabel}</div>
            <AccessChip
              accessType={terms.accessType}
              name={name}
              shortcut={command.shortcut ?? ""}
              addon={command.addon ?? ""}
              isGrasshopper={isGrasshopper}
              menuPath={command.menu ?? ""}
            />
          </div>
        ) : null}

        {!isGrasshopper && command.menu ? (
          <div className="cmd-modal-section">
            <div className="cmd-modal-section-label">{terms.menuGroupLabel}</div>
            <p className="meta">{command.menu}</p>
          </div>
        ) : null}

        <div className="cmd-modal-section">
          <div className="cmd-modal-section-label">Description</div>
          <p className="cmd-modal-copy">{command.description || "No description yet."}</p>
        </div>

        {relatedCommands.length > 0 && onOpenCommand ? (
          <div className="cmd-modal-section">
            <div className="cmd-modal-section-label">Related {terms.itemPlural.toLowerCase()}</div>
            <div className="cmd-modal-related">
              {relatedCommands.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="cmd-modal-related-chip"
                  onClick={() => onOpenCommand(item)}
                >
                  {cleanName(item.name)}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="cmd-modal-actions">
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
          {onOpenFull ? (
            <button type="button" className="ghost-btn" onClick={() => onOpenFull(command)}>
              Open full details
            </button>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

export function ToolActionDetailModal({
  command,
  commands,
  onClose,
  onOpenCommand,
  learned,
  onToggleLearned,
  saved,
  onToggleSaved,
  accessToken,
}: Props) {
  const terms = getSoftwareTerms(command.software);
  const name = cleanName(command.name);
  const isGrasshopper = command.software === "Grasshopper";

  // The phone back gesture / Android back button must close the modal, not
  // navigate away from the site. Push a history entry while the modal is
  // open; popping it (back gesture) closes the modal, and closing the modal
  // any other way consumes the entry.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const handlePop = () => onCloseRef.current();
    window.history.pushState({ cmdModal: true }, "");
    window.addEventListener("popstate", handlePop);
    return () => {
      window.removeEventListener("popstate", handlePop);
      if (window.history.state?.cmdModal) window.history.back();
    };
  }, []);

  // Related: same software, same top-level menu group (or same library for GH/Dynamo)
  const relatedCommands = commands
    .filter((item) => item.id !== command.id && item.software === command.software)
    .filter((item) => {
      if (isGrasshopper) return item.addon && item.addon === command.addon;
      const itemGroup = item.menu.split(/[>/|]/)[0]?.trim() || "";
      const commandGroup = command.menu.split(/[>/|]/)[0]?.trim() || "";
      return Boolean(itemGroup) && itemGroup === commandGroup;
    })
    .slice(0, 8);

  const hasIntentData = (command.intentCategories?.length ?? 0) > 0 || (command.objectTypes?.length ?? 0) > 0;

  return (
    <div className="cmd-modal-backdrop" onClick={onClose} role="presentation">
      <section
        className="cmd-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tool-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="cmd-modal-head">
          <div className="cmd-modal-title-wrap">
            <div className="legacy-tag-row">
              <span className="legacy-tag primary">{command.software}</span>
              {command.addon && !isGrasshopper
                ? <span className="legacy-tag muted">{command.addon}</span>
                : null}
              {learned ? <span className="legacy-tag success">Learned</span> : null}
            </div>
            <h3 id="tool-modal-title">{name}</h3>
            <TagChips tags={command.tags} />
          </div>
          <button type="button" className="ghost-btn" onClick={onClose}>
            Close
          </button>
        </div>

        {/* ── Body ── */}
        <div className="cmd-modal-layout">
          {/* Media */}
          <div className="cmd-modal-media">
            {command.gif || command.icon ? (
              <Image src={command.gif || command.icon} alt={name} width={1200} height={800} unoptimized />
            ) : (
              <div className="cmd-modal-empty">No preview available</div>
            )}
          </div>

          <div className="cmd-modal-body">

            {/* Intent row — what it does, with what, result */}
            {hasIntentData && (
              <div className="cmd-modal-section">
                <IntentRow
                  intentCategories={command.intentCategories ?? []}
                  objectTypes={command.objectTypes ?? []}
                  outcomes={command.outcomes ?? []}
                />
              </div>
            )}

            {/* Access / invocation */}
            {terms.accessType !== "none" && (
              <div className="cmd-modal-section">
                <div className="cmd-modal-section-label">{terms.accessLabel}</div>
                <AccessChip
                  accessType={terms.accessType}
                  name={name}
                  shortcut={command.shortcut ?? ""}
                  addon={command.addon ?? ""}
                  isGrasshopper={isGrasshopper}
                  menuPath={command.menu ?? ""}
                />
              </div>
            )}

            {/* Menu path — hide for Grasshopper (the library chip already shows path context) */}
            {!isGrasshopper && command.menu && (
              <div className="cmd-modal-section">
                <div className="cmd-modal-section-label">{terms.menuGroupLabel}</div>
                <p className="meta">{command.menu}</p>
              </div>
            )}

            {/* Description */}
            <div className="cmd-modal-section">
              <div className="cmd-modal-section-label">Description</div>
              <p className="cmd-modal-copy">{command.description || "No description yet."}</p>
            </div>

            {/* Related */}
            {relatedCommands.length > 0 && onOpenCommand ? (
              <div className="cmd-modal-section">
                <div className="cmd-modal-section-label">Related {terms.itemPlural.toLowerCase()}</div>
                <div className="cmd-modal-related">
                  {relatedCommands.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="cmd-modal-related-chip"
                      onClick={() => onOpenCommand(item)}
                    >
                      {cleanName(item.name)}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Actions */}
            {(onToggleLearned || typeof saved !== "undefined") ? (
              <div className="cmd-modal-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {onToggleLearned ? (
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => onToggleLearned(command)}
                  >
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
