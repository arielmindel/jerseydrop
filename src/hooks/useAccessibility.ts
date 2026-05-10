"use client";

import { useEffect, useState } from "react";

/**
 * useAccessibility — central store for the accessibility-panel preferences.
 *
 * State:
 *   • textSize: "normal" | "large" | "xlarge" | "huge"  (cycles)
 *   • contrast: bool — high-contrast mode (black/white/cyan)
 *   • motion:   bool — TRUE = motion DISABLED (epilepsy-safe)
 *   • links:    bool — emphasize all links (underline + bold + yellow)
 *   • cursor:   bool — large cursor mode
 *
 * Side effects:
 *   • Reads/writes localStorage (key: 'jd-a11y-v1')
 *   • Applies the corresponding classes to <html> on every change
 *
 * Required by Israeli law (חוק שוויון זכויות לאנשים עם מוגבלות + תקנות 2013).
 */

export type TextSize = "normal" | "large" | "xlarge" | "huge";

const TEXT_CYCLE: TextSize[] = ["normal", "large", "xlarge", "huge"];

const TEXT_FONT_SIZE: Record<TextSize, string> = {
  normal: "100%",
  large: "110%",
  xlarge: "125%",
  huge: "150%",
};

export const TEXT_LABEL: Record<TextSize, string> = {
  normal: "רגיל",
  large: "גדול",
  xlarge: "גדול מאוד",
  huge: "ענק",
};

type State = {
  textSize: TextSize;
  contrast: boolean;
  motion: boolean;
  links: boolean;
  cursor: boolean;
};

const DEFAULT_STATE: State = {
  textSize: "normal",
  contrast: false,
  motion: false,
  links: false,
  cursor: false,
};

const STORAGE_KEY = "jd-a11y-v1";

function loadState(): State {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: State) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full / quota — silently ignore */
  }
}

function applyToDocument(state: State) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  const body = document.body;
  // Text size on <html> so rem units cascade properly
  html.style.fontSize = TEXT_FONT_SIZE[state.textSize];
  // Class flags on <body>
  body.classList.toggle("high-contrast", state.contrast);
  body.classList.toggle("no-motion", state.motion);
  body.classList.toggle("emphasize-links", state.links);
  body.classList.toggle("big-cursor", state.cursor);
}

export function useAccessibility() {
  const [state, setState] = useState<State>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage exactly once on the client
  useEffect(() => {
    const fromStorage = loadState();
    setState(fromStorage);
    applyToDocument(fromStorage);
    setHydrated(true);
  }, []);

  // Persist + apply on every change after hydration
  useEffect(() => {
    if (!hydrated) return;
    saveState(state);
    applyToDocument(state);
  }, [state, hydrated]);

  return {
    textSize: state.textSize,
    contrast: state.contrast,
    motion: state.motion,
    links: state.links,
    cursor: state.cursor,
    cycleTextSize: () =>
      setState((s) => {
        const idx = TEXT_CYCLE.indexOf(s.textSize);
        const next = TEXT_CYCLE[(idx + 1) % TEXT_CYCLE.length];
        return { ...s, textSize: next };
      }),
    toggleContrast: () =>
      setState((s) => ({ ...s, contrast: !s.contrast })),
    toggleMotion: () => setState((s) => ({ ...s, motion: !s.motion })),
    toggleLinks: () => setState((s) => ({ ...s, links: !s.links })),
    toggleCursor: () => setState((s) => ({ ...s, cursor: !s.cursor })),
    reset: () => setState(DEFAULT_STATE),
  };
}
