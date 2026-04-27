/**
 * Apply high-confidence corrections to the supplier catalog.
 *
 * For each product:
 *  - Detect team from sourceUrl + image filename + label (audit script logic).
 *  - If URL ↔ Image agree on a team that's DIFFERENT from the current label
 *    → AUTO-RELABEL (high confidence — two independent signals match).
 *  - If URL is detected and matches at least one image → trust URL.
 *  - If image-vs-url conflict → flag as `imageMismatch` (image likely wrong).
 *  - If unresolvable → flag as `noTeamDetected`.
 *
 * Outputs:
 *   data/product-corrections.json — { fixes, flags } applied at runtime
 *   data/needs-review.txt — human report
 */

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data");

const products = JSON.parse(
  await fs.readFile(path.join(DATA, "sporthub-products.json"), "utf8"),
);

// ---------------------------------------------------------------------------
// Same TEAMS dict + detection as audit-products.mjs (kept in sync)
// ---------------------------------------------------------------------------
const TEAMS = JSON.parse(
  await fs
    .readFile(path.join(__dirname, "team-dictionary.json"), "utf8")
    .catch(() => "[]"),
);

if (TEAMS.length === 0) {
  console.error(
    "ERROR: scripts/team-dictionary.json missing. Run scripts/extract-team-dict.mjs first or check the file.",
  );
  process.exit(1);
}

function normalize(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[\u0591-\u05C7]/g, "")
    .replace(/[״׳"'`]/g, "")
    .replace(/[-_./()[\]]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectTeam(text) {
  const t = normalize(text);
  if (!t) return null;
  const candidates = [];
  for (const team of TEAMS) {
    for (const variant of [...team.he, ...team.en]) {
      const n = normalize(variant);
      if (!n) continue;
      let matched = false;
      if (n.length <= 3) {
        const re = new RegExp(
          `(^|[^a-z\u0590-\u05FF])${n}([^a-z\u0590-\u05FF]|$)`,
          "i",
        );
        matched = re.test(t);
      } else {
        matched = t.includes(n);
      }
      if (matched) candidates.push({ team: team.slug, len: n.length });
    }
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.len - a.len);
  return candidates[0].team;
}

function teamFromSourceUrl(p) {
  if (!p.sourceUrl) return null;
  const handle = decodeURIComponent(p.sourceUrl.split("/").pop() || "");
  return detectTeam(handle);
}

function teamFromImageFilename(p) {
  for (const u of p.images || []) {
    const last = u.split("/").pop() || "";
    const fn = decodeURIComponent(last.split("?")[0]);
    const t = detectTeam(fn);
    if (t) return t;
  }
  return null;
}

function teamFromCurrentLabel(p) {
  return detectTeam(`${p.team || ""} ${p.nameHe || ""} ${p.teamSlug || ""}`);
}

function getCanonicalTeamMeta(slug) {
  const team = TEAMS.find((t) => t.slug === slug);
  if (!team) return null;
  return {
    slug,
    he: team.he?.[0] || slug,
    en: team.en?.find((s) => /^[a-z\s-]+$/i.test(s)) || slug,
  };
}

// ---------------------------------------------------------------------------
// Run fixer
// ---------------------------------------------------------------------------
const fixes = {}; // id -> { teamSlug, team }
const flags = {}; // id -> reason
const stats = {
  total: products.length,
  autoFixed: 0,
  flaggedImageMismatch: 0,
  flaggedNoTeam: 0,
  unchanged: 0,
};

for (const p of products) {
  const fromUrl = teamFromSourceUrl(p);
  const fromImg = teamFromImageFilename(p);
  const fromLabel = teamFromCurrentLabel(p);

  // CASE 1: URL & image agree → trust them (highest confidence)
  if (fromUrl && fromImg && fromUrl === fromImg) {
    if (fromLabel !== fromUrl) {
      // Label is wrong; relabel
      const meta = getCanonicalTeamMeta(fromUrl);
      if (meta) {
        fixes[p.id] = { teamSlug: meta.slug, team: meta.he };
        stats.autoFixed++;
        continue;
      }
    }
    stats.unchanged++;
    continue;
  }

  // CASE 2: only URL detected
  if (fromUrl && !fromImg) {
    if (fromLabel !== fromUrl) {
      const meta = getCanonicalTeamMeta(fromUrl);
      if (meta) {
        fixes[p.id] = { teamSlug: meta.slug, team: meta.he };
        stats.autoFixed++;
        continue;
      }
    }
    stats.unchanged++;
    continue;
  }

  // CASE 3: URL & image conflict — image likely WRONG (since URL was hand-chosen by supplier)
  if (fromUrl && fromImg && fromUrl !== fromImg) {
    flags[p.id] = {
      reason: "image-mismatch",
      detail: `URL says "${fromUrl}" but image filename mentions "${fromImg}"`,
      teamFromUrl: fromUrl,
      teamFromImage: fromImg,
      currentTeam: p.team,
    };
    stats.flaggedImageMismatch++;
    // Still relabel based on URL — at least the team will be correct
    if (fromLabel !== fromUrl) {
      const meta = getCanonicalTeamMeta(fromUrl);
      if (meta) fixes[p.id] = { teamSlug: meta.slug, team: meta.he };
    }
    continue;
  }

  // CASE 4: only image detected (fallback)
  if (!fromUrl && fromImg) {
    if (fromLabel !== fromImg) {
      const meta = getCanonicalTeamMeta(fromImg);
      if (meta) {
        fixes[p.id] = { teamSlug: meta.slug, team: meta.he };
        stats.autoFixed++;
        continue;
      }
    }
    stats.unchanged++;
    continue;
  }

  // CASE 5: nothing detected — leave label alone but flag if image is also missing
  if (!fromUrl && !fromImg && !fromLabel) {
    flags[p.id] = {
      reason: "no-team-detected",
      detail: "Could not detect team from URL, image, or label",
      currentTeam: p.team || "(empty)",
    };
    stats.flaggedNoTeam++;
    continue;
  }

  stats.unchanged++;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------
await fs.writeFile(
  path.join(DATA, "product-corrections.json"),
  JSON.stringify({ stats, fixes, flags }, null, 2),
);

const summary = `JerseyDrop Fixer — ${new Date().toISOString()}
=====================================

Total products: ${stats.total}
✅ Auto-fixed labels (URL + image agreement): ${stats.autoFixed}
⚠️  Flagged: image likely wrong (URL says one thing, image another): ${stats.flaggedImageMismatch}
⚠️  Flagged: no team could be detected from any signal: ${stats.flaggedNoTeam}
☑️  Unchanged: ${stats.unchanged}

The "image-mismatch" products WILL still be displayed (with relabeled team)
but the image may be incorrect — they're flagged for human review.

The "no-team-detected" products are HIDDEN from public listings until
reviewed (they have no detectable team to organize them under).

Top 10 flagged products to review:
${Object.entries(flags)
  .slice(0, 10)
  .map(
    ([id, f]) =>
      `  - [${f.reason}] ${f.currentTeam} → ${f.detail}\n    id: ${id}`,
  )
  .join("\n")}
`;

await fs.writeFile(path.join(DATA, "needs-review.txt"), summary);
console.log(summary);
