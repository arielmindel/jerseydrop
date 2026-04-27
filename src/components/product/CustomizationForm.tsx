"use client";

import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import JerseyPreview from "./JerseyPreview";
import PatchSelector from "./PatchSelector";
import CustomerNotes from "./CustomerNotes";
import { CUSTOMIZATION_FEE } from "@/lib/constants";
import { formatILS } from "@/lib/utils";
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
      {/* Name + number (paid +30₪) */}
      <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={value.nameNumberEnabled}
            onChange={(e) => update({ nameNumberEnabled: e.target.checked })}
            className="mt-1 h-5 w-5 accent-[#00FF88]"
          />
          <span className="space-y-0.5">
            <span className="block font-display text-sm font-bold uppercase tracking-tight">
              הוספת שם ומספר{" "}
              <span className="text-accent">
                +{formatILS(CUSTOMIZATION_FEE)}
              </span>
            </span>
            <span className="block text-xs text-muted">
              הדפסה מקצועית בגב החולצה. עד 12 אותיות באנגלית + מספר 0-99.
            </span>
          </span>
        </label>
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
