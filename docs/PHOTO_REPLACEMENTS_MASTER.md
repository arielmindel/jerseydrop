# Master Photo Replacement List

Generated 2026-05-01 from screenshot session with user.

**Total scope**: ~114 photo replacements + 10 specials + 1 deletion + 2 verifications.

**Per-product rule**: every product must end up with FRONT + BACK photos that look good. If only one is needed per the table below, it's because the other already exists or user explicitly said optional.

**Pipeline per product**:
1. Find the matching jersey in the supplier Yupoo catalog
2. Capture FRONT + BACK image URLs
3. Update `data/sporthub-products.json`:
   - Set `images[]` to the new URLs (use `/api/yupoo-image?url=...` proxy)
   - Preserve `imagesOriginal[]` for rollback
   - Remove `imageQuality: "low"` so the product becomes publicly visible
   - Set `isSpecial: true` if marked in the table
4. Visual QA on the live site

## Supplier catalogs (provided by user)

| Catalog | URL |
|---|---|
| Player edition | https://512283458.x.yupoo.com/albums |
| Player edition | http://qiqirong.x.yupoo.com/albums |
| Fan edition | https://jianbo666888.x.yupoo.com/ |
| Fan edition | https://diyao508.x.yupoo.com/albums |
| Fan edition | https://lingshang88.x.yupoo.com/ |
| Short sleeve suit | https://xiaoyueliang0917.x.yupoo.com/albums |
| Retro jerseys | https://3072503479.x.yupoo.com/albums |

## Verifications pending

- **בטיס**: User suspects yp-short-suit-1070 (kids 25-26 home, "FOREVER GREEN" text on back) and yp-fan-2-478 (Naruto special, "LIVE THE LIFE…") are the same physical jersey shown front+back. Verify by inspecting `imagesOriginal[]` URLs of both before merging or treating as duplicates.
- **פלומיננסה**: yp-short-suit-1216 (kids 25-26, SUPERBET front) and yp-short-suit-899 (26-27 adult, no sponsor visible — likely back). User says same jersey two angles. Decide whether to merge.

## Deletion

- yp-fan-2-338 (Brazil 2026 Home, yellow WC2022 frame) — DELETE entirely.

## Specials (`isSpecial: true` + add to team page)

These products stay where they are AND get added to `/collections/special`:

| ID | Team | Description |
|---|---|---|
| yp-short-suit-1009 | Real Madrid | 25-26 3rd LS Kids |
| yp-short-suit-1193 | Barcelona | 05-06 Home LS |
| yp-fan-2-431 | Barcelona | Yamal collage |
| yp-short-suit-1247 | Manchester United | 07-08 Away black |
| yp-fan-2-472 | Juventus | Renaissance art |
| yp-fan-2-477 | Inter Milan | Betsson snake |
| yp-fan-2-478 | Real Betis | Naruto |
| yp-fan-2-494 | Porto | Year of Dragon blue/black |
| yp-fan-2-490 | Porto | Year of Dragon white/gold |

## Specials — no team listing

| ID | Description |
|---|---|
| yp-fan-2-480 | Ajax #70 retro Bob Marley "Live the Life You Love" — only in `/collections/special`, remove from Ajax team page |

## Photo replacements — by team

Format: `id` (description) — front | back | optional | skip

### Arsenal (7)
- yp-short-suit-1006 (25-26 Third LS Kids) — back
- yp-short-suit-1338 (24-25 Third Set) — front
- yp-short-suit-1324 (24-25 Away LS) — back
- yp-short-suit-1118 (25-26 Home Retro) — back
- yp-short-suit-1422 (24-25 Home Kids) — back
- yp-short-suit-1357 (24-25 Away Set) — back
- yp-short-suit-1347 (24-25 Third Kids) — back

### AC Milan (4)
- yp-short-suit-1056 (25-26 Away White) — front
- yp-short-suit-996 (25-26 Third Yellow) — back
- yp-short-suit-1210 (25-26 Home Set) — back
- yp-short-suit-1144 (25-26 Home Set) — back

### Real Madrid (6 + 1 special)
- yp-short-suit-992 (25-26 Home LS Kids) — front
- yp-short-suit-945 (25-26 Training) — front
- yp-short-suit-1325 (24-25 Away LS) — back
- yp-short-suit-1237 (11-12 Away) — optional
- yp-short-suit-1110 (25-26 Third Set) — front
- yp-short-suit-1339 (24-25 Home LS) — back

### Spain (5)
- yp-short-suit-901 (2026 GK) — front
- yp-short-suit-868 (2026 Home) — back
- yp-fan-2-348 (Home WC2022) — back
- yp-short-suit-942 (2026 Home LS) — back
- yp-short-suit-905 (2026 GK LS) — back

### Barcelona (2 + 2 specials)
- yp-short-suit-1307 (24-25 Home LS UNHCR) — back optional
- yp-short-suit-1246 (10-11 Home) — front

### Manchester United (3 + 1 special)
- yp-short-suit-977 (25-26 Away LS Kids) — back
- yp-fan-2-465 (2026 Blue Special) — optional
- yp-retro-1790 (13-14 Away retro) — front

### Liverpool (5)
- yp-short-suit-1004 (25-26 Away LS Kids) — verify it IS Liverpool + front
- yp-short-suit-982 (25-26 Home LS Kids) — back
- yp-fan-2-493 (Liverpool Special Mexico-themed) — front
- yp-short-suit-1326 (24-25 Home LS) — front
- yp-short-suit-1031 (25-26 Third) — front

### Santos (3)
- yp-fan-2-467 (Neymar #11 mashup) — front (paired with 461 below)
- yp-fan-2-461 (Neymar Special) — back (paired with 467 — same jersey two views)
- yp-fan-2-458 (Santos QATAR mashup) — front optional

### Paris (PSG) (4)
- yp-short-suit-986 (25-26 Third Kids) — back
- yp-fan-2-498 (25-26 White Special) — back
- yp-fan-2-491 (25-26 Black) — front
- yp-short-suit-1476 (23-24 Third Set, beige/blue print) — front

### Inter Miami (4)
- yp-short-suit-1270 (25-26 Home LS Kids, pink) — back
- yp-short-suit-1213 (25-26 Away Kids, light blue) — back
- yp-short-suit-1198 (25-26 Away Set, light blue) — back
- yp-short-suit-1468 (23-24 Home Set, pink) — front

### Brazil (2 + 1 deletion)
- yp-short-suit-1257 (24-25 special with Christ the Redeemer art) — front
- yp-short-suit-1238 (2004 Home retro, crest closeup) — try to find (optional)

### Germany (3)
- yp-short-suit-1321 (24-25 Home LS Set) — front
- yp-short-suit-869 (2026 Away, dark blue) — front
- yp-fan-2-344 (2026 Home, white WC2022) — back

### Flamengo (3)
- yp-short-suit-1137 (25-26 Away Kids, white) — back
- yp-short-suit-895 (26-27 Home, black/red striped) — front
- yp-fan-2-471 (Special, pink swirl) — back

### Juventus (2 + 1 special)
- yp-short-suit-1083 (25-26 Away black) — back
- yp-short-suit-1122 (25-26 Home white) — front

### Inter Milan (2 + 1 special)
- yp-short-suit-1116 (25-26 Away Kids, white) — front
- yp-short-suit-1131 (25-26 Home Set, blue/black striped) — front

### Real Betis (2 + 1 special + verification)
- yp-short-suit-1070 (25-26 Home Kids) — VERIFY if same as yp-fan-2-478 (Naruto)
- yp-short-suit-1072 (25-26 Home Adult Set) — TBD pending verification

### Mexico (3)
- yp-short-suit-904 (2026 GK LS, pink) — front
- yp-short-suit-903 (2026 GK, pink) — front
- yp-short-suit-866 (2026 Away, white) — front

### England (3)
- yp-short-suit-1460 (24-25 Home Kids) — front
- yp-short-suit-1314 (24-25 Home LS Set) — back
- yp-short-suit-937 (1998 Home LS retro) — back

### Manchester City (3)
- yp-short-suit-1336 (24-25 GK Set, white/orange) — back
- yp-short-suit-1327 (24-25 Home LS Set, light blue) — back
- yp-short-suit-981 (25-26 Home LS Kids, light blue) — back

### Al Nassr (3)
- yp-short-suit-1335 (24-25 Home Set, yellow/blue) — back
- yp-short-suit-1018 (25-26 Home Set KAFD, yellow) — back
- yp-short-suit-998 (25-26 Away Set KAFD, navy) — front

### Atletico Madrid (3 — all optional, both sides)
- yp-player-2-1759 (25-26 Away LS, Nike swoosh closeup) — both if possible
- yp-short-suit-1197 (04-05 Away retro, neckline closeup) — both if possible
- yp-short-suit-1196 (04-05 Home retro, neckline closeup) — both if possible

### Portugal (3)
- yp-short-suit-1311 (24-25 Home LS Set, red) — back
- yp-short-suit-1312 (24-25 Away LS Set, white/blue tile) — back
- yp-short-suit-1463 (24-25 Home Kids, red) — back

### Porto (2 — both specials)
- yp-fan-2-494 (Year of Dragon blue/black, Betano) — back + Specials + Porto
- yp-fan-2-490 (Year of Dragon white/gold, Betano) — back + Specials + Porto

### Mallorca (2)
- yp-fan-2-511 (24-25 Home, black/red) — front
- yp-fan-2-504 (Red Home) — front

### Atletico Mineiro (2)
- yp-short-suit-1272 (25-26 Home Kids, black/white striped) — front
- yp-short-suit-897 (26-27 Home, black) — front

### Fluminense (2 — verify duplicate)
- yp-short-suit-1216 (25-26 Home Kids, SUPERBET) — front (currently)
- yp-short-suit-899 (26-27 Home) — back (currently)
- VERIFY: are these actually the same jersey?

### Roma (2)
- yp-short-suit-1097 (25-26 Home Set, dark red/orange) — front
- yp-short-suit-997 (25-26 Away Set, orange flames) — back

### Panama (2)
- yp-short-suit-1399 (24-25 Away Kids, white Reebok) — back
- yp-short-suit-1065 (25-26 Away 2 Kids, black Reebok) — back

### Tottenham (2)
- yp-short-suit-1309 (24-25 Home LS Set, AIA) — front
- yp-short-suit-1084 (25-26 Home Set, white/khaki) — back

### Dortmund (2)
- yp-short-suit-1419 (24-25 Home Kids, yellow 1&1) — back
- yp-short-suit-1105 (25-26 Home S-2XL, yellow/black) — back

### Atletico Nacional (2)
- yp-short-suit-1145 (24-25 Set, green/white POSTOBON) — front
- yp-short-suit-1127 (25-26 Away Set, black/yellow) — front

### Sao Paulo (2)
- yp-short-suit-1300 (24-25 Away 2 Kids, black/red SUPERBET) — front
- yp-short-suit-1138 (25-26 Away Kids, red/white striped SUPERBET) — front

### Chelsea (2)
- yp-short-suit-1363 (24-25 Home Kids, blue London tag) — front
- yp-short-suit-1211 (25-26 Home Set, blue abstract) — back

### Argentina (1)
- yp-fan-2-340 (2026 Home with FIFA Gold Cup) — back

### Tunisia (1)
- yp-fan-2-500 (Tunisia pink with Arabic text) — back

### Malaga (1)
- yp-fan-2-513 (24-25 Home with BENAHAVIS) — front

### Benfica (1)
- yp-short-suit-1080 (25-26 Home Kids, red Emirates) — back

### Newcastle (1)
- yp-short-suit-1096 (25-26 Home Set, black/white striped Sela) — back

### Celtic (1)
- yp-short-suit-1098 (25-26 Home Set, green/white hooped) — front

### Gremio (1)
- yp-short-suit-1174 (25-26 Home Kids, light blue/black striped Umbro) — back

### Chivas (1)
- yp-short-suit-1206 (24-25 Away 2 Set, navy graffiti Caliente) — back

### Marseille (1)
- yp-short-suit-1313 (24-25 Away 2 Kids, white CMA CGM) — needs both? user wasn't sure of identification

## Notes on workflow

- Use the `/api/yupoo-image?url=<encoded>` proxy for all new image URLs (Vercel route handler with Referer)
- DO NOT run rembg — past attempts over-cropped sleeves; use the supplier's clean photos as-is
- Save & commit every ~30 products processed
- If a Yupoo album page changes IDs, the original URL must still be valid (Yupoo URLs are stable)
