"use client";

import { Label } from "@/components/ui/label";

const MAX = 200;

type Props = {
  value: string;
  onChange: (next: string) => void;
};

export default function CustomerNotes({ value, onChange }: Props) {
  const handle = (next: string) => {
    onChange(next.slice(0, MAX));
  };

  return (
    <div className="space-y-2 rounded-2xl border border-border bg-surface p-4">
      <div className="space-y-0.5">
        <Label
          htmlFor="customer-notes"
          className="font-display text-sm font-bold uppercase tracking-tight"
        >
          הערות מיוחדות{" "}
          <span className="text-muted">(אופציונלי)</span>
        </Label>
        <p className="text-xs text-muted">
          מתנה? בקשה מיוחדת? נשמח לדעת
        </p>
      </div>
      <textarea
        id="customer-notes"
        value={value}
        onChange={(e) => handle(e.target.value)}
        maxLength={MAX}
        rows={3}
        placeholder="למשל: 'יום הולדת שמח לאבא, עם לב על השרוול'"
        className="block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/70 focus:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      />
      <div className="flex justify-end text-[10px] text-muted">
        {value.length}/{MAX}
      </div>
    </div>
  );
}
