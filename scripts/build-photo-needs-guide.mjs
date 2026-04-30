#!/usr/bin/env node
/**
 * Build a self-contained HTML guide listing every product that needs a new
 * jersey photo. Each row shows:
 *   - The current bad image (so the user sees WHY it's flagged)
 *   - The Hebrew product name (which encodes team / season / home-away)
 *   - A pre-built Google Image Search query the user can click to find a
 *     replacement
 *   - The product ID (so the user can paste it back to me with a new photo)
 *
 * Output: docs/PHOTO_NEEDS.html
 */

import fs from "node:fs";

const FILE = "data/sporthub-products.json";
const OUT = "docs/PHOTO_NEEDS.html";

const products = JSON.parse(fs.readFileSync(FILE, "utf8"));
const needs = products.filter((p) => p.imageQuality === "low");

// Group by team
const byTeam = new Map();
for (const p of needs) {
  const key = p.teamSlug || "unknown";
  if (!byTeam.has(key)) byTeam.set(key, { name: p.team || key, items: [] });
  byTeam.get(key).items.push(p);
}

// Sort teams by item count desc
const sorted = [...byTeam.entries()].sort(
  (a, b) => b[1].items.length - a[1].items.length,
);

function imgUrl(p) {
  // Use the FIRST image even though it's bad — user wants to see what we have
  const i = p.images?.[0];
  if (!i) return "";
  if (i.startsWith("/api/yupoo-image")) {
    // We can render this only if Vercel proxy is up — fall back to direct
    try {
      const u = new URL(i, "https://jerseydrop.vercel.app");
      return u.toString();
    } catch {
      return "";
    }
  }
  return i;
}

function searchQuery(p) {
  // Use the Hebrew nameHe minus some noise — it usually describes the jersey
  // in plain language (team + season + home/away).
  // Build BOTH a Hebrew query and an English query for better Google coverage.
  const teamEn = TEAM_EN[p.teamSlug] || p.teamSlug.replace(/-/g, " ");
  let season = "";
  const m = (p.nameHe || "").match(/(\d{2,4})[-/](\d{2,4})/);
  if (m) season = `${m[1]}-${m[2]}`;
  let type = "";
  const nh = p.nameHe || "";
  if (nh.includes("בית")) type = "home";
  else if (nh.includes("חוץ")) type = "away";
  else if (nh.includes("שלישי") || nh.includes("נטרלית") || nh.includes("נטרילת")) type = "third";
  else if (nh.includes("שוער")) type = "goalkeeper";
  else if (nh.includes("רטרו") || nh.includes("רטרו")) type = "retro";
  else if (nh.includes("ארוך")) type = "long sleeve";
  else if (nh.includes("ילדים") || nh.includes("ילד")) type = "kids";
  const query = [teamEn, season, type, "jersey"].filter(Boolean).join(" ");
  return query;
}

const TEAM_EN = {
  "manchester-united": "Manchester United",
  "manchester-city": "Manchester City",
  liverpool: "Liverpool",
  arsenal: "Arsenal",
  chelsea: "Chelsea",
  tottenham: "Tottenham",
  newcastle: "Newcastle",
  "real-madrid": "Real Madrid",
  barcelona: "Barcelona",
  "atletico-madrid": "Atletico Madrid",
  "athletic-bilbao": "Athletic Bilbao",
  "real-betis": "Real Betis",
  "ac-milan": "AC Milan",
  "inter-milan": "Inter Milan",
  juventus: "Juventus",
  napoli: "Napoli",
  roma: "AS Roma",
  fiorentina: "Fiorentina",
  "bayern-munich": "Bayern Munich",
  "borussia-dortmund": "Borussia Dortmund",
  "borussia-monchengladbach": "Borussia Monchengladbach",
  psg: "PSG Paris Saint-Germain",
  marseille: "Marseille",
  lyon: "Lyon",
  ajax: "Ajax Amsterdam",
  benfica: "Benfica",
  porto: "FC Porto",
  "sporting-lisbon": "Sporting CP",
  celtic: "Celtic FC",
  "inter-miami": "Inter Miami",
  flamengo: "Flamengo",
  santos: "Santos FC",
  "boca-juniors": "Boca Juniors",
  "river-plate": "River Plate",
  "atletico-mineiro": "Atletico Mineiro",
  fluminense: "Fluminense",
  "atletico-nacional": "Atletico Nacional",
  vasco: "Vasco da Gama",
  "sao-paulo": "Sao Paulo FC",
  "al-nassr": "Al Nassr",
  "al-hilal": "Al Hilal",
  argentina: "Argentina national team",
  brazil: "Brazil national team",
  france: "France national team",
  germany: "Germany national team",
  spain: "Spain national team",
  portugal: "Portugal national team",
  england: "England national team",
  italy: "Italy national team",
  netherlands: "Netherlands national team",
  japan: "Japan national team",
  mexico: "Mexico national team",
  morocco: "Morocco national team",
  "south-korea": "South Korea national team",
  croatia: "Croatia national team",
  panama: "Panama national team",
  tunisia: "Tunisia national team",
  nigeria: "Nigeria national team",
  ireland: "Ireland national team",
  malaga: "Malaga CF",
  mallorca: "RCD Mallorca",
  "celta-vigo": "Celta Vigo",
  "charlotte-fc": "Charlotte FC",
  "club-america": "Club America",
  "cruz-azul": "Cruz Azul",
  pumas: "Pumas UNAM",
  tigres: "Tigres UANL",
  "feyenoord": "Feyenoord",
  "psv": "PSV Eindhoven",
  "fulham": "Fulham",
  "everton": "Everton",
  "wolves": "Wolves",
  "leeds": "Leeds United",
  sunderland: "Sunderland",
  "rb-leipzig": "RB Leipzig",
  "bayer-leverkusen": "Bayer Leverkusen",
  "vfb-stuttgart": "VfB Stuttgart",
  "st-pauli": "St Pauli",
  "red-bull-salzburg": "RB Salzburg",
  "as-roma": "AS Roma",
};

// Build HTML
const html = `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<title>JerseyDrop — מוצרים שצריכים תמונות חדשות</title>
<style>
  body { font-family: -apple-system, "Heebo", sans-serif; max-width: 1100px; margin: 0 auto; padding: 24px; background: #0B1220; color: #f0f0f0; }
  h1 { font-size: 28px; margin: 0 0 8px; }
  .lede { color: #a0a0a0; margin-bottom: 32px; }
  .team { margin-bottom: 40px; padding: 18px; border: 1px solid #1f2937; border-radius: 12px; background: #0f1623; }
  .team h2 { margin: 0 0 14px; font-size: 20px; color: #00FF88; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
  .card { background: #131c2c; border: 1px solid #1f2937; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
  .card img { width: 100%; aspect-ratio: 1/1; object-fit: cover; border-radius: 6px; background: #1a2333; }
  .name { font-size: 13px; line-height: 1.4; min-height: 36px; }
  .id { font-family: ui-monospace, monospace; font-size: 11px; color: #6b7280; }
  .actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: auto; }
  .btn { display: inline-block; font-size: 11px; padding: 6px 10px; border-radius: 6px; text-decoration: none; background: #00FF88; color: #0B1220; font-weight: 600; }
  .btn.alt { background: #1f2937; color: #f0f0f0; }
  .copy { font-size: 11px; padding: 6px 10px; border-radius: 6px; background: #1f2937; color: #a0a0a0; border: none; cursor: pointer; }
  .summary { background: #11192a; padding: 16px; border-radius: 10px; margin-bottom: 24px; border: 1px solid #1f2937; }
  .summary strong { color: #00FF88; }
</style>
</head>
<body>
<h1>📸 מוצרים שצריכים תמונות חדשות</h1>
<p class="lede">לחץ על "Google" כדי לחפש את החולצה הספציפית. כשתמצא תמונה טובה (חולצה מלאה על קולב, רקע נקי), שלח לי אותה עם ה-ID של המוצר.</p>

<div class="summary">
  <strong>${needs.length}</strong> מוצרים סומנו כצריכים תמונות חדשות, מ-<strong>${sorted.length}</strong> קבוצות.<br>
  הסיבה: התמונות הקיימות בקטלוג הן close-up של פרטי בד / סמלים / לוגואים, לא חולצה מלאה.<br>
  עד שתביא תמונות, המוצרים האלה <strong>מוסתרים</strong> מהאתר הציבורי.
</div>

${sorted
  .map(
    ([slug, info]) => `
<section class="team">
  <h2>${info.name} <span style="color:#6b7280;font-weight:400;">— ${info.items.length} מוצרים</span></h2>
  <div class="grid">
    ${info.items
      .map((p) => {
        const q = searchQuery(p);
        const url = imgUrl(p);
        const gImg = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`;
        return `<div class="card">
          ${url ? `<img loading="lazy" src="${url}" alt="">` : ""}
          <div class="name">${p.nameHe || ""}</div>
          <div class="id">${p.id}</div>
          <div class="actions">
            <a class="btn" href="${gImg}" target="_blank" rel="noopener">🔍 Google Images</a>
            <button class="copy" onclick="navigator.clipboard.writeText('${p.id}'); this.textContent='הועתק'; setTimeout(()=>this.textContent='העתק ID',1200);">העתק ID</button>
          </div>
        </div>`;
      })
      .join("\n")}
  </div>
</section>`,
  )
  .join("\n")}

</body>
</html>`;

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync(OUT, html);
console.log(`Wrote guide: ${OUT} (${needs.length} products, ${sorted.length} teams)`);
