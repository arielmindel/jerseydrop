"use client";

import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import JerseyPreview from "./JerseyPreview";
import PatchSelector from "./PatchSelector";
import CustomerNotes from "./CustomerNotes";
import { getAvailablePatches, NO_PATCH } from "@/lib/patches";
import type { Product } from "@/lib/types";

export type CustomizationState = {
  nameNumberEnabled: boolean;
  name: string;
  number: string;
  selectedPatchId: string;
  customerNotes: string;
};

export const initialCustomization: CustomizationState = {
  nameNumberEnabled: false,
  name: "",
  number: "",
  selectedPatchId: NO_PATCH.id,
  customerNotes: "",
};

type Props = {
  product: Product;
  value: CustomizationState;
  onChange: (next: CustomizationState) => void;
};

export default function CustomizationForm({ product, value, onChange }: Props) {
  const patches = getAvailablePatches(product);
  const update = (patch: Partial<CustomizationState>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      {/* Section header — emphasises the new "free" reality */}
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-h3 font-black uppercase">
          התאמה אישית — <span className="text-accent">חינם</span>
        </h3>
        <p className="text-body-sm text-muted">
          תוסיפו שם ומספר לחולצה ללא תוספת תשלום
        </p>
      </div>

      {/* Two-state radio: clean jersey vs custom name+number. Default = clean.
          Same fields as the previous checkbox approach, just framed as a
          binary choice now that there's no upcharge to "unlock". */}
      <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 edge-light">
        <div
          role="radiogroup"
          aria-label="התאמה אישית"
          className="grid grid-cols-2 gap-2"
        >
          {[
            { id: "off", label: "בלי שם ומספר", on: false },
            { id: "on", label: "עם שם ומספר", on: true },
          ].map((opt) => {
            const selected = value.nameNumberEnabled === opt.on;
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => update({ nameNumberEnabled: opt.on })}
                className={`rounded-xl border px-3 py-2.5 text-start font-display text-body-sm font-bold uppercase tracking-tight transition-all duration-base ease-emphasized ${
                  selected
                    ? "border-accent bg-accent/10 text-accent shadow-glow-sm"
                    : "border-border bg-surface text-foreground hover:-translate-y-0.5 hover:border-accent/40"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <p className="text-caption text-muted">
          הדפסה מקצועית בגב החולצה. עד 12 אותיות באנגלית + מספר 0-99.
        </p>
        {value.nameNumberEnabled && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-4 md:grid-cols-[1.2fr_1fr]"
          >
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="cust-name">שם (A-Z, מספרים)</Label>
                <Input
                  id="cust-name"
                  value={value.name}
                  onChange={(e) =>
                    update({
                      name: e.target.value
                        .replace(/[^A-Za-z0-9 ]/g, "")
                        .toUpperCase(),
                    })
                  }
                  maxLength={12}
                  placeholder="MESSI"
                />
                <div className="text-[10px] text-muted">{value.name.length}/12</div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cust-number">מספר</Label>
                <Input
                  id="cust-number"
                  value={value.number}
                  onChange={(e) =>
                    update({
                      number: e.target.value.replace(/\D/g, "").slice(0, 2),
                    })
                  }
                  inputMode="numeric"
                  placeholder="10"
                />
              </div>
            </div>
            <div className="relative aspect-square rounded-2xl border border-border bg-background p-2">
              <JerseyPreview name={value.name} number={value.number} />
              <span className="absolute bottom-2 end-2 rounded-full bg-background/80 px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-widest text-accent">
                תצוגה חיה
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Patch selector (free, dynamic per team) */}
      {patches.length > 1 && (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <PatchSelector
            patches={patches}
            selectedId={value.selectedPatchId}
            onSelect={(id) => update({ selectedPatchId: id })}
          />
        </div>
      )}

      {/* Customer notes (free, optional) */}
      <CustomerNotes
        value={value.customerNotes}
        onChange={(v) => update({ customerNotes: v })}
      />
    </div>
  );
}
