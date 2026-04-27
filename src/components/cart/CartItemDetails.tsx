import { getPatchById } from "@/lib/patches";
import type { CartItem } from "@/lib/cart";

/**
 * Renders the per-line "summary chips" — name+number, selected patch, etc.
 * Shared between the slide-out CartDrawer and the full /cart page.
 */
export default function CartItemDetails({ item }: { item: CartItem }) {
  const hasNameNumber =
    item.customization &&
    (item.customization.name || item.customization.number);
  const patch = getPatchById(item.selectedPatchId);

  if (!hasNameNumber && !patch) return null;

  return (
    <div className="mt-0.5 flex flex-wrap gap-1.5 text-[11px]">
      {hasNameNumber && item.customization && (
        <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 font-display font-bold uppercase tracking-tight text-accent">
          {item.customization.name} #{item.customization.number}
        </span>
      )}
      {patch && (
        <span className="inline-flex items-center gap-1 rounded-full border border-cyan/30 bg-cyan/10 px-2 py-0.5 font-display font-bold uppercase tracking-tight text-cyan">
          🏆 {patch.nameHe}
        </span>
      )}
    </div>
  );
}
