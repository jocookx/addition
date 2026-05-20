"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AppFrame } from "@/components/legacy/AppFrame";
import { CommandDetailModal } from "@/components/legacy/CommandDetailModal";
import { SaveButton } from "@/components/legacy/SaveButton";
import { rankBySmartMatch } from "@/lib/search/smart-match";
import { TagChips } from "@/components/legacy/TagChips";
import type { ComboListItem } from "@/domain/combo";
import type { CommandListItem } from "@/domain/command";
import { getCombos } from "@/lib/api/combos";
import { getCommands } from "@/lib/api/commands";
import { getToolkit } from "@/lib/api/toolkit";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { SOFTWARE_LIST, normalizeSoftwareLabel, useSoftwareContext } from "@/lib/software-context";

const difficultyTone: Record<string, string> = {
  beginner: "combo-badge-success",
  intermediate: "combo-badge-warn",
  advanced: "combo-badge-danger",
};

function comboSkeletonCard(key: string) {
  return (
    <div key={key} className="skeleton-card">
      <div className="skeleton-thumb" />
      <div className="skeleton-line h-lg w-60" />
      <div className="skeleton-line w-80" />
      <div className="skeleton-line w-40" />
    </div>
  );
}

export default function CombosPage() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [combos, setCombos] = useState<ComboListItem[]>([]);
  const [commands, setCommands] = useState<CommandListItem[]>([]);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [activeSoftware, setActiveSoftware] = useSoftwareContext();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Loading combos...");
  const [selectedCombo, setSelectedCombo] = useState<ComboListItem | null>(null);
  const [selectedCommand, setSelectedCommand] = useState<CommandListItem | null>(null);
  const [previewById, setPreviewById] = useState<Record<string, string>>({});

  useEffect(() => {
    let canceled = false;
    async function load() {
      try {
        const [comboData, commandData] = await Promise.all([getCombos(), getCommands()]);
        if (canceled) return;
        setCombos(comboData);
        setCommands(commandData);
        setStatus(`${comboData.length} combos loaded.`);
      } catch (error) {
        if (canceled) return;
        setStatus(error instanceof Error ? error.message : "Failed to load combos.");
      }
    }
    void load();
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSessionToken(data.session?.access_token ?? null);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSessionToken(nextSession?.access_token ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!sessionToken) return;
    let canceled = false;
    getToolkit(sessionToken)
      .then((items) => {
        if (canceled) return;
        setSavedIds(Object.fromEntries(items.map((item) => [item.contentId, true])));
      })
      .catch(() => {
        if (canceled) return;
      });
    return () => { canceled = true; };
  }, [sessionToken]);

  const filteredCombos = useMemo(() => {
    // Software filter first (non-text)
    const prefiltered = combos.filter((combo) => {
      if (activeSoftware) {
        const norm = normalizeSoftwareLabel(combo.software ?? "");
        if (norm !== activeSoftware && combo.software !== activeSoftware) return false;
      }
      return true;
    });
    // Smart text search — ranked by relevance (title > commands > summary > tags)
    return rankBySmartMatch(prefiltered, query, {
      target: (c) => ({
        id: c.id,
        title: c.title,
        software: c.software,
        summary: `${c.description ?? ""} ${(c.tags ?? []).join(" ")}`,
        commands: c.commands.map((step) => step.name),
      }),
    });
  }, [combos, query, activeSoftware]);

  function resolveCommand(combo: ComboListItem, commandName: string) {
    return commands.find((item) => item.software === combo.software && item.name === commandName) || null;
  }

  function commandMedia(combo: ComboListItem, commandName: string) {
    const match = resolveCommand(combo, commandName);
    return match?.gif || match?.icon || "";
  }

  function comboPreview(combo: ComboListItem) {
    if (previewById[combo.id]) return previewById[combo.id];
    if (combo.gif) return combo.gif;
    const firstStepWithMedia = combo.commands.find((step) => commandMedia(combo, step.name));
    return firstStepWithMedia ? commandMedia(combo, firstStepWithMedia.name) : "";
  }

  function openCommandFromCombo(combo: ComboListItem, commandName: string) {
    const match = resolveCommand(combo, commandName);
    if (!match) return;
    setSelectedCombo(null);
    setSelectedCommand(match);
  }

  return (
    <AppFrame
      title="Combos"
      subtitle="Multi-step command combinations and repeatable workflows."
      toolbarQuery={query}
      onToolbarQueryChange={setQuery}
    >
      <div className="reference-view">
        <div className="commands-toolbar">
          <div className="commands-toolbar-left">
            <span className="meta">{status}</span>
          </div>
        </div>

        {/* No software selected — prompt */}
        {!!combos.length && !activeSoftware && !query.trim() && (
          <div className="sw-context-prompt">
            <div className="sw-context-prompt-icon">⚡</div>
            <p className="sw-context-prompt-title">Pick a software to explore combos</p>
            <p className="meta">Choose your tool to discover multi-step workflows, or use the switcher above.</p>
            <div className="sw-context-prompt-actions">
              {SOFTWARE_LIST.slice(0, 8).map((sw) => (
                <button key={sw.id} type="button" className="sw-quick-btn" onClick={() => setActiveSoftware(sw.id)}>
                  <span className="sw-quick-abbr" style={{ background: `${sw.color}22`, color: sw.color }}>{sw.abbr}</span>
                  {sw.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {!combos.length ? (
          <div className="legacy-card-grid combo-card-grid">{Array.from({ length: 4 }, (_, index) => comboSkeletonCard(`combo-skeleton-${index}`))}</div>
        ) : filteredCombos.length ? (
          <div className="legacy-card-grid combo-card-grid">
            {filteredCombos.map((combo) => {
              const preview = comboPreview(combo);
              return (
                <article key={combo.id} className="card combo-card">
                  <div className={`combo-gif-panel${preview ? "" : " combo-gif-panel--empty"}`}>
                    {preview ? (
                      <Image className="combo-gif-img" src={preview} alt={`${combo.title} preview`} width={1200} height={720} unoptimized />
                    ) : (
                      <div className="combo-gif-placeholder">No preview</div>
                    )}
                  </div>
                  <div className="card-body">
                    <div className="combo-meta-row">
                      {combo.software ? <span className="combo-badge">{combo.software}</span> : null}
                      {combo.difficulty ? <span className={`combo-badge ${difficultyTone[combo.difficulty] || ""}`}>{combo.difficulty}</span> : null}
                      <span className="combo-badge">{combo.commands.length} steps</span>
                    </div>
                    <h3 className="combo-title">{combo.title}</h3>
                    {combo.description ? <p className="combo-desc">{combo.description}</p> : null}
                    <TagChips tags={combo.tags} />
                    {combo.commands.length ? (
                      <div className="combo-steps">
                        {combo.commands.map((step, index) => {
                          const stepPreview = commandMedia(combo, step.name);
                          return (
                            <div key={`${combo.id}-${step.name}-${index}`} className="combo-step-wrap">
                              <button
                                type="button"
                                className={`combo-step-chip${stepPreview ? " combo-step-chip--has-gif" : ""}`}
                                title={step.name}
                                onMouseEnter={() => {
                                  if (stepPreview) setPreviewById((current) => ({ ...current, [combo.id]: stepPreview }));
                                }}
                                onMouseLeave={() => setPreviewById((current) => ({ ...current, [combo.id]: combo.gif || "" }))}
                                onClick={() => openCommandFromCombo(combo, step.name)}
                              >
                                <span className="combo-step-num">{index + 1}</span>
                                <span className="combo-step-name">{step.name}</span>
                                {stepPreview ? <span className="combo-step-gif-dot" aria-hidden="true" /> : null}
                              </button>
                              {index < combo.commands.length - 1 ? <span className="combo-step-arrow">→</span> : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="meta">No commands added yet.</p>
                    )}
                    <div className="legacy-card-actions">
                      <button type="button" className="ghost-btn" onClick={() => setSelectedCombo(combo)}>
                        Open combo
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="reference-software-prompt">
            <p className="meta reference-software-copy">No combos match this filter yet. Try another software or search term.</p>
          </div>
        )}
      </div>

      {selectedCombo ? (
        <div className="cmd-modal-backdrop" onClick={() => setSelectedCombo(null)} role="presentation">
          <section className="cmd-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="cmd-modal-head">
              <div className="cmd-modal-title-wrap">
                <div className="legacy-tag-row">
                  {selectedCombo.software ? <span className="legacy-tag primary">{selectedCombo.software}</span> : null}
                  {selectedCombo.difficulty ? <span className="legacy-tag muted">{selectedCombo.difficulty}</span> : null}
                </div>
                <h3>{selectedCombo.title}</h3>
                <TagChips tags={selectedCombo.tags} />
              </div>
              <button type="button" className="ghost-btn" onClick={() => setSelectedCombo(null)}>
                Close
              </button>
            </div>

            <div className="cmd-modal-layout">
              <div className="cmd-modal-media">
                {comboPreview(selectedCombo) ? (
                  <Image src={comboPreview(selectedCombo)} alt={selectedCombo.title} width={1200} height={720} unoptimized />
                ) : (
                  <div className="cmd-modal-empty">No preview available</div>
                )}
              </div>
              <div className="cmd-modal-body">
                {selectedCombo.description ? (
                  <div className="cmd-modal-section">
                    <div className="cmd-modal-section-label">Description</div>
                    <p className="cmd-modal-copy">{selectedCombo.description}</p>
                  </div>
                ) : null}
                <div className="cmd-modal-section">
                  <div className="cmd-modal-section-label">Steps</div>
                  <div className="combo-modal-steps">
                    {selectedCombo.commands.map((step, index) => (
                      <button
                        key={`${selectedCombo.id}-${step.name}-${index}`}
                        type="button"
                        className="combo-modal-step combo-modal-step-button"
                        onClick={() => openCommandFromCombo(selectedCombo, step.name)}
                      >
                        <span className="combo-step-num">{index + 1}</span>
                        <div>
                          <strong>{step.name}</strong>
                          {step.note ? <p className="meta">{step.note}</p> : null}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="cmd-modal-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {sessionToken ? (
                    <SaveButton
                      contentId={selectedCombo.id}
                      contentType="combo"
                      accessToken={sessionToken}
                      saved={Boolean(savedIds[selectedCombo.id])}
                      onSavedChange={(next) => setSavedIds((current) => ({ ...current, [selectedCombo.id]: next }))}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {selectedCommand ? (
        <CommandDetailModal
          command={selectedCommand}
          commands={commands}
          onClose={() => setSelectedCommand(null)}
          onOpenCommand={(command) => setSelectedCommand(command)}
        />
      ) : null}
    </AppFrame>
  );
}
