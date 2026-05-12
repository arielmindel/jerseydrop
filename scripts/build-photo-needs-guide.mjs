#!/usr/bin/env node
/* Build self-contained photo-needs guide with large clickable images. */

import fs from "node:fs";

const FILE = "data/sporthub-products.json";
const OUT = "docs/PHOTO_NEEDS.html";

const products = JSON.parse(fs.readFileSync(FILE, "utf8"));
const needs = products.filter((p) => p.imageQuality === "low");

const TEAM_EN = {
  "manchester-united": "Manchester United", "manchester-city": "Manchester City",
  liverpool: "Liverpool", arsenal: "Arsenal", chelsea: "Chelsea", tottenham: "Tottenham",
  newcastle: "Newcastle", "real-madrid": "Real Madrid", barcelona: "Barcelona",
  "atletico-madrid": "Atletico Madrid", "athletic-bilbao": "Athletic Bilbao",
  "real-betis": "Real Betis", "real-sociedad": "Real Sociedad",
  "ac-milan": "AC Milan", "inter-milan": "Inter Milan", juventus: "Juventus",
  napoli: "Napoli", roma: "AS Roma", fiorentina: "Fiorentina",
  "bayern-munich": "Bayern Munich", "borussia-dortmund": "Borussia Dortmund",
  "borussia-monchengladbach": "Borussia Monchengladbach",
  psg: "PSG Paris Saint-Germain", marseille: "Marseille", lyon: "Lyon",
  ajax: "Ajax Amsterdam", benfica: "Benfica", porto: "FC Porto",
  "sporting-lisbon": "Sporting CP", celtic: "Celtic FC",
  "inter-miami": "Inter Miami", flamengo: "Flamengo", santos: "Santos FC",
  "boca-juniors": "Boca Juniors", "river-plate": "River Plate",
  "atletico-mineiro": "Atletico Mineiro", fluminense: "Fluminense",
  "atletico-nacional": "Atletico Nacional", vasco: "Vasco da Gama",
  "sao-paulo": "Sao Paulo FC", "al-nassr": "Al Nassr", "al-hilal": "Al Hilal",
  argentina: "Argentina national team", brazil: "Brazil national team",
  france: "France national team", germany: "Germany national team",
  spain: "Spain national team", portugal: "Portugal national team",
  england: "England national team", italy: "Italy national team",
  netherlands: "Netherlands national team", japan: "Japan national team",
  mexico: "Mexico national team", morocco: "Morocco national team",
  "south-korea": "South Korea national team", croatia: "Croatia national team",
  panama: "Panama national team", tunisia: "Tunisia national team",
  nigeria: "Nigeria national team", ireland: "Ireland national team",
  malaga: "Malaga CF", mallorca: "RCD Mallorca", "celta-vigo": "Celta Vigo",
  "charlotte-fc": "Charlotte FC", "club-america": "Club America",
  "cruz-azul": "Cruz Azul", pumas: "Pumas UNAM", tigres: "Tigres UANL",
  "feyenoord": "Feyenoord", "psv": "PSV Eindhoven",
  "fulham": "Fulham", "everton": "Everton", "wolves": "Wolves",
  "leeds": "Leeds United", sunderland: "Sunderland",
  "rb-leipzig": "RB Leipzig", "bayer-leverkusen": "Bayer Leverkusen",
  "vfb-stuttgart": "VfB Stuttgart", "st-pauli": "St Pauli",
  "red-bull-salzburg": "RB Salzburg",
};

const byTeam = new Map();
for (const p of needs) {
  const key = p.teamSlug || "unknown";
  if (!byTeam.has(key)) byTeam.set(key, { name: p.team || key, items: [] });
  byTeam.get(key).items.push(p);
}
const sorted = [...byTeam.entries()].sort((a, b) => b[1].items.length - a[1].items.length);

function escAttr(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escText(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function imgUrl(p) {
  const original = (p.imagesOriginal && p.imagesOriginal[0]) || null;
  const candidate = original || (p.images && p.images[0]);
  if (!candidate) return "";
  if (candidate.startsWith("/api/yupoo-image") || candidate.startsWith("/")) {
    return `https://jerseydrop.co.il${candidate}`;
  }
  return candidate;
}

function searchQuery(p) {
  const teamEn = TEAM_EN[p.teamSlug] || (p.teamSlug || "").replace(/-/g, " ");
  let season = "";
  const m = (p.nameHe || "").match(/(\d{2,4})[-/](\d{2,4})/);
  if (m) season = `${m[1]}-${m[2]}`;
  let type = "";
  const nh = p.nameHe || "";
  if (nh.includes("בית")) type = "home";
  else if (nh.includes("חוץ")) type = "away";
  else if (nh.includes("שלישי") || nh.includes("נטרלית") || nh.includes("נטרילת")) type = "third";
  else if (nh.includes("שוער")) type = "goalkeeper";
  else if (nh.includes("רטרו")) type = "retro";
  else if (nh.includes("ארוך")) type = "long sleeve";
  else if (nh.includes("ילדים") || nh.includes("ילד")) type = "kids";
  return [teamEn, season, type, "jersey"].filter(Boolean).join(" ");
}

const head = `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<title>JerseyDrop — מוצרים שצריכים תמונות חדשות</title>
<style>
* { box-sizing: border-box; }
body { font-family: -apple-system, "Heebo", system-ui, sans-serif; max-width: 1400px; margin: 0 auto; padding: 24px; background: #0B1220; color: #f0f0f0; }
h1 { font-size: 28px; margin: 0 0 8px; }
.lede { color: #a0a0a0; margin-bottom: 24px; line-height: 1.5; }
.summary { background: #11192a; padding: 16px 20px; border-radius: 12px; margin-bottom: 28px; border: 1px solid #1f2937; }
.summary strong { color: #00FF88; font-size: 18px; }
.team { margin-bottom: 36px; }
.team h2 { margin: 0 0 14px; font-size: 22px; color: #00FF88; padding-bottom: 8px; border-bottom: 1px solid #1f2937; }
.team h2 .count { color: #6b7280; font-weight: 400; font-size: 16px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; }
.card { background: #131c2c; border: 1px solid #1f2937; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.imgwrap { position: relative; width: 100%; aspect-ratio: 4/5; background: #1a2333; border-radius: 8px; overflow: hidden; cursor: zoom-in; }
.imgwrap img { width: 100%; height: 100%; object-fit: contain; transition: transform .25s; }
.imgwrap:hover img { transform: scale(1.03); }
.imgwrap .zoom { position: absolute; inset: auto 8px 8px auto; padding: 4px 8px; border-radius: 6px; background: rgba(11,18,32,.85); font-size: 11px; color: #00FF88; pointer-events: none; }
.name { font-size: 14px; line-height: 1.5; min-height: 40px; }
.id { font-family: ui-monospace, "SF Mono", monospace; font-size: 11px; color: #6b7280; word-break: break-all; }
.actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: auto; }
.btn { display: inline-block; font-size: 12px; padding: 7px 12px; border-radius: 6px; text-decoration: none; background: #00FF88; color: #0B1220; font-weight: 600; }
.btn:hover { background: #00e07a; }
.copy { font-size: 11px; padding: 7px 12px; border-radius: 6px; background: #1f2937; color: #a0a0a0; border: none; cursor: pointer; }
.copy:hover { background: #2a3548; color: #f0f0f0; }
.toc { background: #11192a; padding: 14px 20px; border-radius: 12px; border: 1px solid #1f2937; margin-bottom: 28px; }
.toc-title { font-size: 13px; color: #6b7280; margin-bottom: 8px; }
.toc a { color: #00FF88; text-decoration: none; margin-left: 12px; font-size: 14px; }
.toc a:hover { text-decoration: underline; }
.modal { position: fixed; inset: 0; background: rgba(0,0,0,.85); display: none; align-items: center; justify-content: center; z-index: 999; cursor: zoom-out; padding: 30px; }
.modal.open { display: flex; }
.modal img { max-width: 100%; max-height: 100%; object-fit: contain; box-shadow: 0 0 40px rgba(0,255,136,.25); border-radius: 8px; }
.modal-info { position: fixed; top: 16px; right: 16px; background: #11192a; padding: 10px 16px; border-radius: 8px; border: 1px solid #1f2937; font-size: 13px; max-width: 380px; }
.modal-info .modal-name { color: #00FF88; font-weight: 600; margin-bottom: 6px; }
.modal-info .modal-id { font-family: ui-monospace, monospace; font-size: 11px; color: #a0a0a0; }
</style>
</head>
<body>
<h1>\u{1f4f8} מוצרים שצריכים תמונות חדשות</h1>
<p class="lede">לחץ על תמונה כדי להגדיל ולראות את הבעיה. אז תחפש בגוגל את החולצה הספציפית (יש כפתור), שלח לי תמונה איכותית + ID של המוצר.</p>
<div class="summary"><strong>${needs.length}</strong> מוצרים מוסתרים מהאתר עד שתביא תמונות חדשות.<br><span style="color:#a0a0a0;font-size:14px;">הסיבה: התמונות הקיימות הן close-up של בד / סמלים / לוגואות, לא חולצה מלאה.</span></div>
<div class="toc"><div class="toc-title">דילוג מהיר לפי קבוצה:</div>`;

const tocItems = sorted.map(([slug, info]) => `<a href="#team-${escAttr(slug)}">${escText(info.name)} (${info.items.length})</a>`).join("");

const sections = sorted.map(([slug, info]) => {
  const cards = info.items.map((p) => {
    const q = searchQuery(p);
    const url = imgUrl(p);
    const gImg = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`;
    const idAttr = escAttr(p.id);
    return `<div class="card">
  <div class="imgwrap" data-fullsrc="${escAttr(url)}" data-name="${escAttr(p.nameHe || "")}" data-id="${idAttr}">
    ${url ? `<img loading="lazy" src="${escAttr(url)}" alt="" onerror="this.style.opacity=0.2">` : ""}
    <span class="zoom">\u{1f50d} לחץ להגדלה</span>
  </div>
  <div class="name">${escText(p.nameHe || "")}</div>
  <div class="id">${escText(p.id)}</div>
  <div class="actions">
    <a class="btn" href="${escAttr(gImg)}" target="_blank" rel="noopener">\u{1f50d} Google Images</a>
    <button class="copy" data-copy-id="${idAttr}">העתק ID</button>
  </div>
</div>`;
  }).join("");
  return `<section class="team" id="team-${escAttr(slug)}">
  <h2>${escText(info.name)} <span class="count">— ${info.items.length} מוצרים</span></h2>
  <div class="grid">${cards}</div>
</section>`;
}).join("");

const tail = `</div>${sections}
<div class="modal" id="modal">
  <img id="modal-img" src="" alt="">
  <div class="modal-info"><div class="modal-name" id="modal-name"></div><div class="modal-id" id="modal-id"></div></div>
</div>
<script>
document.querySelectorAll('.imgwrap').forEach(function(el){
  el.addEventListener('click', function(){
    var src = el.dataset.fullsrc, name = el.dataset.name || '', id = el.dataset.id || '';
    if (!src) return;
    document.getElementById('modal-img').src = src;
    document.getElementById('modal-name').textContent = name;
    document.getElementById('modal-id').textContent = id;
    document.getElementById('modal').classList.add('open');
  });
});
document.getElementById('modal').addEventListener('click', function(){ this.classList.remove('open'); });
document.addEventListener('keydown', function(e){ if (e.key === 'Escape') document.getElementById('modal').classList.remove('open'); });
document.querySelectorAll('.copy').forEach(function(b){
  b.addEventListener('click', function(){
    var id = b.dataset.copyId || '';
    navigator.clipboard.writeText(id);
    var t = b.textContent;
    b.textContent = 'הועתק ✓';
    setTimeout(function(){ b.textContent = t; }, 1400);
  });
});
</script>
</body>
</html>`;

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync(OUT, head + tocItems + tail);
fs.copyFileSync(OUT, "public/photo-needs.html");
console.log(`Wrote: ${OUT} (and public/photo-needs.html)`);
console.log(`Products: ${needs.length} across ${sorted.length} teams`);
