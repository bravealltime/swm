# scripts/ — ตัวดึงและสร้างชุดข้อมูล

ทุกไฟล์ในโฟลเดอร์นี้ผลิตไฟล์ใน `src/data/` ที่เว็บใช้จริง หรือถูกเรียกจาก `package.json` / GitHub Actions / `vite.config.js`
สคริปต์แกะโค้ด/ลองยิง API ที่ใช้ครั้งเดียวตอนสร้างระบบอยู่ใน [`_archive/`](_archive/) — ไม่ได้ดูแลต่อ

รันจาก root ของโปรเจกต์เสมอ (`node scripts/<ไฟล์>`) เพราะหลายตัวอ้าง path แบบ relative
ไฟล์ดิบระหว่างทางอยู่ใน `swgt_raw/` และ `.cache/` (ทั้งคู่อยู่ใน `.gitignore`)

## รันอัตโนมัติทุกคืน (GitHub Actions `update-swrt-data.yml`, 03:00 ไทย)

ลำดับตาม workflow — ทำมือได้ด้วยคำสั่งเดียวกัน

| ลำดับ | สคริปต์ | แหล่ง | ผลิต | ใช้ที่หน้า |
|---|---|---|---|---|
| 1 | `extract_swrt_data.cjs` | swranking.com public API | `swrtTierList.json`, `swrtMetaMonsters.json`, `swrtRankCutoffs.json`, `swrtRecentReplays.json` | RTA Analytics |
| 2 | `fetch_more_replays.cjs` | swranking.com | เติม `swrtRecentReplays.json` | RTA Analytics |
| 3 | `fetch_swrt_players.cjs --pages=30 --top=100` | swranking.com (`replayallist`, `monster/topPlayer`) ~50 นาที | `swrtPlayersIndex.json`, `swrtGuardianMeta.json`, `public/data/swrt-matches/<id%32>.json` | Player Tracker, Guardian, My Box |
| 4 | `ai_patch_summaries.mjs` | โค้ช AI (ต้องมี `AI_*` ใน env) | `balancePatchAi.json` (cache ตาม hash แพตช์) | Balance Patch |
| 5 | `ai_player_summaries.mjs --limit=150` | โค้ช AI, CONCURRENCY 1 | `swrtPlayerSummaries.json` (cache ตาม hash สถิติ) | Player Tracker |

`fetch_swrt_players.cjs` บันทึกทีละหน้าลง `.cache/` หยุดกลางคันได้; `--quick` ทดสอบเร็ว, `--rebuild` สร้างไฟล์ใหม่จาก `.cache/` โดยไม่ดึงซ้ำ (ดู header ของไฟล์)

## ทำมือเป็นครั้งคราว

### มอนสเตอร์ + สกิล (swarfarm.com)

```bash
node scripts/download_monsters.cjs             # → swgt_raw/swarfarm_monsters.json
node scripts/download_skills_concurrent.cjs    # → swgt_raw/swarfarm_skills.json
node scripts/build_monster_skills.cjs          # + allMonsters.json → src/data/monsterSkillsDatabase.json (เต็ม, แปลไทย)
node scripts/optimize_skills_db.cjs            # → src/data/monsterSkillsData.json (compact ที่เว็บ/AI ใช้) แล้วลบไฟล์เต็ม
node scripts/fill_missing_monsters.cjs         # เติมมอนสเตอร์ที่ขาดใน allMonsters.json จาก swarfarm
```

`monsterSkillsData.json` ไม่ถูก import ในเบราว์เซอร์ตรง ๆ — `build_skill_shards.mjs` แตกเป็น `public/data/skills/*.json` + `src/data/monsterSkillsIndex.json` ให้เองตอน `vite` เริ่ม (dev/build) เมื่อไฟล์ต้นทางใหม่กว่า (`npm run skills:shards` ถ้าจะบังคับ) ทั้งสองอย่างไม่อยู่ใน git

### swgt.io (แคตตาล็อก, 3MDC, เทรนด์, แพตช์, ดันเจี้ยน)

หน้า HTML ของ swgt.io ต้องอยู่ใน `swgt_raw/` ก่อน — `fetch_patches.cjs` และ `fetch_all_dungeons.cjs` ดาวน์โหลดให้ ส่วนหน้าอื่น (`monsterCatalogGrid.html`, `trendingDefenses.html`, `tier_*_view.html`, `monster*Trending.html` ฯลฯ) บันทึกจากเบราว์เซอร์ตามชื่อไฟล์ที่แต่ละสคริปต์คาด

| สคริปต์ | อ่าน | ผลิต |
|---|---|---|
| `build_all_monsters.cjs` | `monsterCatalogGrid.html` | `allMonsters.json`, `monsters.js` (แคตตาล็อก 1,192 ตัว) |
| `extract_all.cjs` | หน้าหลัก ๆ ของ swgt | `trendingDefenses.json`, `defenseTrendingFull.json`, `monsterTrends.json`, `allPromoCodes.json`, `recruitingGuilds.json`, `latestSiegeBattles.json`, `balancePatches.json`, `runeArtifactOfTheDay.json`, `faqData.json`, `dungeonAbyssData.json` |
| `fetch_all_counters.cjs` | `trendingDefenses.json` → ยิง swgt 3MDC | `allCounterStrategies.json` |
| `merge_3mdc_teams.cjs` | `allCounterStrategies.json` + `allMonsters.json` | `allMdcData.json` (สูตรแก้ทาง 3MDC) |
| `parse_defense_trending.cjs` / `parse_offense_trending.cjs` | `monsterDefenseTrending.html` / `monsterOffenseTrending.html` | `monsterDefenseTrending.json` / `monsterOffenseTrending.json` |
| `export_exact_tiers.cjs` | `tier_defense_view.html`, `tier_offense_view.html` | `swgtDefenseTiers.json`, `swgtOffenseTiers.json` |
| `fetch_patches.cjs` → `parse_all_patches.cjs` | ดาวน์โหลดหน้าแพตช์ → แกะ | `balancePatchDetails.json` |
| `fetch_all_dungeons.cjs` → `parse_dungeons.cjs` | ดาวน์โหลดหน้าดันเจี้ยน Abyss Hard → แกะ | `dungeonRealStats.json` |

### อื่น ๆ

| สคริปต์ | ทำอะไร |
|---|---|
| `fetch_ss_highdata.cjs` | swranking `monster/highdata` ต่อมอนสเตอร์ใน tier list → `swrtMonsterHighdata.json` (ซีซั่นระบุในไฟล์ ต้องแก้เมื่อเปลี่ยนซีซั่น) |
| `syncToR2.js` (`npm run r2:sync`, `--dry-run`) | อัปโหลดรูป/ไฟล์ไป Cloudflare R2 ต้องมี `R2_*` ใน `.env` — เว็บมีโค้ดรองรับ (`src/services/r2Service.js` เปิดเมื่อตั้ง `VITE_R2_PUBLIC_URL`) แต่ตอนนี้ยังไม่ได้ตั้งค่าทั้งเครื่องนี้และ Vercel จึงยังใช้ CloudFront ของเกมตรง ๆ |
| `sync_all_sw_data.mjs` (`npm run sync:data`) | **แค่รายงาน**: เช็กว่าต่อ swarfarm ได้, นับทีม 3MDC และ % สกิลแปลไทย — ไม่ได้ดึงหรือเขียนอะไร |

## กติกา

- ข้อมูลทุกไฟล์มาจากแหล่งจริง ไม่มีตัวเลขแต่ง — ถ้าแหล่งเปลี่ยนโครง ให้แก้สคริปต์ ไม่ใช่แก้ JSON มือ
- สคริปต์ AI: provider เป็น reasoning model → `maxTokens` ≥ 300, รับ 1 คำขอค้าง/คีย์ → CONCURRENCY 1 (ดู HANDOFF §6)
- ห้ามให้สคริปต์เขียน dump บัญชีใครลง `public/data/` (ดู HANDOFF §5)
