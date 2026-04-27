import { readFileSync } from "fs";

const yupoo = JSON.parse(
  readFileSync("./data/yupoo-final-catalog.json", "utf8"),
);
const sporthub = JSON.parse(
  readFileSync("./data/sporthub-products.json", "utf8"),
);

const slugByHebrew = new Map();
for (const p of sporthub) {
  if (p.team && p.teamSlug && !slugByHebrew.has(p.team)) {
    slugByHebrew.set(p.team, p.teamSlug);
  }
}

// Same alias map as merge
const TEAM_ALIASES = {
  "ריאל": "ריאל מדריד",
  "ברסה": "ברצלונה",
  "אטלטיקו": "אתלטיקו מדריד",
  "סוסיאדד": "ריאל סוסיאדד",
  "סיטי": "מנצ׳סטר סיטי",
  "ספרס": "טוטנהאם",
  "באירן": "באיירן מינכן",
  "באיירן": "באיירן מינכן",
  "פסז": "פריז",
  "מילן": "מילאן",
  "מיאמי": "אינטר מיאמי",
};

const COLORS = ["ירוק","אדום","כחול","לבן","שחור","צהוב","סגול","ורוד","כתום","אפור","חום","בורדו","תכלת","נייבי","כסף","זהב"];
const TYPES = ["שלישי","שוער","רטרו","מיוחד","מיוחדת","בית","חוץ"];
function stripHebrewWord(str, word) {
  return str.replace(new RegExp(`(^|[\\s.,:()'"״׳-])${word}(?=[\\s.,:()'"״׳-]|$)`, "g"), "$1");
}
function extract(s) {
  let str = s || "";
  str = str.replace(/^\d{2,4}[-/]\d{2,4}\s*/, "").trim();
  str = str.replace(/^\d{4}\s+/, "").trim();
  str = str.replace(/^\d{2}\s+/, "").trim();
  for (const c of COLORS) str = stripHebrewWord(str, c);
  for (const t of TYPES) str = stripHebrewWord(str, t);
  str = str.replace(/ילדים|שרוול ארוך|חליפה|POLO|polo|（[^）]*）|\([^)]*\)/g, " ");
  str = stripHebrewWord(str, "סט");
  str = str.replace(/[\u4e00-\u9fa5]/g, "");
  str = str.replace(/(^|\s)\d{1,2}(\s|$)/g, " ");
  str = str.replace(/[״׳"'.,:()-]+/g, " ").replace(/\s+/g, " ").trim();
  return str;
}
function findTeamSlug(t) {
  if (!t) return null;
  const aliased = TEAM_ALIASES[t];
  if (aliased && slugByHebrew.has(aliased)) return slugByHebrew.get(aliased);
  if (slugByHebrew.has(t)) return slugByHebrew.get(t);
  return null;
}

// Show unmatched extracted strings + their original nameHe
const seen = new Set();
const samples = [];
for (const e of yupoo) {
  const t = extract(e.nameHe);
  const slug = findTeamSlug(t);
  if (!slug && !seen.has(t)) {
    seen.add(t);
    samples.push({ extracted: t, nameHe: e.nameHe, title: e.title });
  }
}
console.log("Total unique unmatched extracted strings:", seen.size);
console.log("");
console.log("Showing first 50:");
samples.slice(0, 50).forEach((s, i) => {
  console.log(`  [${i + 1}] extracted="${s.extracted}" | nameHe="${s.nameHe}" | title="${s.title}"`);
});
console.log("");
const isInSporthub = (t) => slugByHebrew.has(t);
const knowable = samples.filter(s => isInSporthub(s.extracted));
console.log("Of these, in sporthub but missed:", knowable.length);
knowable.forEach(s => console.log(`  ${s.extracted}`));
