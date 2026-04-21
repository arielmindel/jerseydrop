"use client";

import { useEffect, useState } from "react";
import { WORLD_CUP_START_UTC } from "@/lib/constants";

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isLive: boolean;
};

function computeTimeLeft(): TimeLeft {
  const now = Date.now();
  const diff = WORLD_CUP_START_UTC - now;
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isLive: true };
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, isLive: false };
}

function pad(n: number, width = 2): string {
  return n.toString().padStart(width, "0");
}

export default function WorldCupCountdown({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState<TimeLeft>(() => computeTimeLeft());

  useEffect(() => {
    setMounted(true);
    const tick = () => setTime(computeTimeLeft());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const display: TimeLeft = mounted
    ? time
    : { days: 0, hours: 0, minutes: 0, seconds: 0, isLive: false };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 font-display text-xs font-bold uppercase tracking-widest text-accent">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
        {display.isLive
          ? "מונדיאל 2026 חי!"
          : `${pad(display.days, 3)}d : ${pad(display.hours)}h : ${pad(display.minutes)}m`}
      </div>
    );
  }

  const boxes: [string, number, string][] = [
    ["days", display.days, "ימים"],
    ["hours", display.hours, "שעות"],
    ["minutes", display.minutes, "דקות"],
    ["seconds", display.seconds, "שניות"],
  ];

  return (
    <div
      role="timer"
      aria-live="off"
      aria-label="ספירה לאחור לפתיחת מונדיאל 2026"
      className="rounded-3xl border border-accent/20 bg-surface/70 p-5 shadow-glow-sm backdrop-blur-md md:p-6"
    >
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
        <span className="section-eyebrow">עד פתיחת המונדיאל · June 11, 2026</span>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 md:gap-3">
        {boxes.map(([key, value, label], idx) => (
          <div
            key={key}
            className="flex flex-col items-center justify-center rounded-2xl border border-border bg-background px-2 py-4 md:py-5"
          >
            <span
              className="font-display text-3xl font-black leading-none tabular-nums text-accent md:text-5xl"
              style={{ textShadow: "0 0 24px rgba(0,255,136,0.45)" }}
            >
              {pad(value, idx === 0 ? 3 : 2)}
            </span>
            <span className="mt-2 font-display text-[10px] font-bold uppercase tracking-widest text-muted md:text-xs">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
