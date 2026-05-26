"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppFrame } from "@/components/legacy/AppFrame";
import { TagChips } from "@/components/legacy/TagChips";
import { SaveButton } from "@/components/legacy/SaveButton";
import { getToolkit } from "@/lib/api/toolkit";
import { getCommands } from "@/lib/api/commands";
import { getCombos } from "@/lib/api/combos";
import { getCourseCatalog } from "@/lib/api/catalog";
import { getResources } from "@/lib/api/resources";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import type { CommandListItem } from "@/domain/command";
import type { ComboListItem } from "@/domain/combo";
import type { CourseCatalogListItem } from "@/domain/catalog";
import type { ToolkitItem } from "@/domain/toolkit";
import type { ResourceListItem } from "@/domain/resource";

export default function ToolkitPage() {
  const [session, setSession] = useState<string | null>(null);
  const [items, setItems] = useState<ToolkitItem[]>([]);
  const [commands, setCommands] = useState<CommandListItem[]>([]);
  const [combos, setCombos] = useState<ComboListItem[]>([]);
  const [courses, setCourses] = useState<CourseCatalogListItem[]>([]);
  const [resources, setResources] = useState<ResourceListItem[]>([]);
  const [booted, setBooted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session?.access_token ?? null);
      setBooted(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession?.access_token ?? null);
      setBooted(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!booted) return;
    if (!session) return;

    let canceled = false;

    Promise.all([getToolkit(session), getCommands(), getCombos(), getCourseCatalog(), getResources(session)])
      .then(([toolkit, commandData, comboData, courseData, resourceData]) => {
        if (canceled) return;
        setItems(toolkit);
        setCommands(commandData);
        setCombos(comboData);
        setCourses(courseData);
        setResources(resourceData);
        setError("");
      })
      .catch((err) => {
        if (canceled) return;
        setError(err instanceof Error ? err.message : "Failed to load toolkit.");
      });

    return () => {
      canceled = true;
    };
  }, [booted, session]);

  const itemRows = useMemo(() => {
    return items.map((item) => {
      let title = item.contentId;
      let subtitle: string = item.contentType;
      let tags: string[] = [];
      let href = "/";

      if (item.contentType === "command") {
        const command = commands.find((commandItem) => commandItem.id === item.contentId);
        title = command?.name || item.contentId;
        subtitle = command ? `${command.software} command` : "Command";
        tags = command?.tags ?? [];
        href = "/commands";
      }

      if (item.contentType === "combo") {
        const combo = combos.find((comboItem) => comboItem.id === item.contentId);
        title = combo?.title || item.contentId;
        subtitle = combo ? `${combo.software} combo` : "Combo";
        tags = combo?.tags ?? [];
        href = "/combos";
      }

      if (item.contentType === "course") {
        const course = courses.find((courseItem) => courseItem.id === item.contentId);
        title = course?.title || item.contentId;
        subtitle = course ? `${course.software} ${course.type}` : "Course";
        href = `/learn?course=${encodeURIComponent(item.contentId)}`;
      }

      if (item.contentType === "resource") {
        const resource = resources.find((resourceItem) => resourceItem.id === item.contentId);
        title = resource?.title || item.contentId;
        subtitle = resource ? `${resource.software || "General"} ${resource.type}` : "Resource";
        tags = resource?.tags ?? [];
        href = "/resources";
      }

      return {
        ...item,
        title,
        subtitle,
        tags,
        href,
      };
    });
  }, [items, commands, combos, courses, resources]);

  if (!booted) return null;

  return (
    <AppFrame
      title="Toolkit"
      subtitle="Your saved commands, combos, courses and resources for quick access."
      topTabs={[]}
    >
      <section className="panel">
        <div className="legacy-panel-head">
          <div>
            <h3>Toolkit</h3>
            <p className="meta">Save items while browsing and return to them instantly.</p>
          </div>
          <div className="meta">{items.length} saved</div>
        </div>

        {error ? (
          <div style={{ color: "var(--danger)", padding: "16px 0" }}>{error}</div>
        ) : null}

        {itemRows.length === 0 ? (
          <div style={{ padding: "28px 0", textAlign: "center" }}>
            <p className="meta">Your toolkit is empty. Save a command, combo, course or resource to see it here.</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              <Link href="/commands" className="ghost-btn">Browse commands</Link>
              <Link href="/combos" className="ghost-btn">Browse combos</Link>
              <Link href="/learn" className="ghost-btn">Browse courses</Link>
              <Link href="/resources" className="ghost-btn">Browse resources</Link>
            </div>
          </div>
        ) : (
          <div className="toolkit-grid">
            {itemRows.map((item) => (
              <article key={item.id} className="panel toolkit-card">
                <div className="legacy-tag-row">
                  <span className="legacy-tag primary">{item.contentType}</span>
                  <span className="legacy-tag muted">{item.subtitle}</span>
                </div>
                <h3>{item.title}</h3>
                <p className="meta">Saved {new Date(item.savedAt).toLocaleDateString()}</p>
                <TagChips tags={item.tags} />
                <div className="legacy-card-actions">
                  <Link href={item.href} className="primary-button">Open</Link>
                  {session ? (
                    <SaveButton
                      contentId={item.contentId}
                      contentType={item.contentType}
                      accessToken={session}
                      saved
                      onSavedChange={(next) => {
                        if (!next) setItems((prev) => prev.filter((i) => i.id !== item.id));
                      }}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppFrame>
  );
}
