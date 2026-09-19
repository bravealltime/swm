# SWM — คู่มือส่งต่องาน (ย้ายเครื่อง / เริ่มเซสชันใหม่)

อ่านไฟล์นี้ก่อนแตะโค้ด ครอบคลุม: ตั้งเครื่องใหม่ใน 5 นาที, โครงสร้างระบบ, ข้อมูลมาจากไหน, ระบบ AI, AegisLink (เรียลไทม์), หลังบ้าน, งานอัตโนมัติ, และสิ่งที่ยังค้าง
อัปเดตล่าสุด: 2026-09-19 (ตั้งเครื่องใหม่เสร็จ, env บน Vercel ครบ, แก้ล็อก AI บน Vercel)

---

## 1. ตั้งเครื่องใหม่

```bash
git clone https://github.com/bravealltime/swm.git
cd swm
npm install
cp .env.example .env      # แล้วกรอกค่าตามข้อ 2
npm run dev               # http://localhost:5173
```

ต้องมี Node 20+ (เครื่องเดิมใช้ 26, เครื่องปัจจุบัน 24 LTS, CI ใช้ 22) และ Chrome/Edge สำหรับทดสอบ AegisLink
เช็กว่าพร้อม: `npm test` ต้องผ่านทั้งหมด และ `npm run build` ต้องเสร็จใน ~10 วิ

## 2. ตัวแปรลับ (.env — ห้าม commit, .gitignore กันไว้แล้ว)

| ตัวแปร | ใช้ทำอะไร | อยู่ที่ไหนอีก |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | ล็อกอิน / ซิงก์ข้ามเครื่อง (ฝั่งเบราว์เซอร์) **และฝั่งเซิร์ฟเวอร์ด้วย** (`api/_lib/admin.js` ใช้ URL นี้ต่อ Supabase REST + ตรวจ token) — เบราว์เซอร์มี default hard-code แต่ `api/` ไม่มี ถ้าหายบน Vercel หลังบ้าน/ล็อกอินแอดมินพังทั้งที่เว็บดูปกติ | Vercel ✅ (ใส่ 2026-09-19 — ก่อนหน้านั้นไม่มีจริง) |
| `SUPABASE_SERVICE_ROLE_KEY` | ฝั่งเซิร์ฟเวอร์: หลังบ้านบันทึกตั้งค่า, ล็อก AI, แชร์อันดับกิลด์ (ใช้คีย์รูปแบบใหม่ `sb_secret_…` ได้) | Vercel ✅ (2026-09-19) |
| `AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY` | โค้ช AI (OpenAI-compatible, ปัจจุบัน `https://ai.xaek.online/v1` + `xaek-coder`) | Vercel ✅, GitHub Actions secrets ✅ |
| `ADMIN_EMAILS` | เพิ่มผู้ดูแลนอกจาก pedictu@gmail.com (คั่นจุลภาค) | ไม่บังคับ |
| `ADMIN_DEV_BYPASS=1` | เปิด `/admin` บนเครื่อง dev โดยไม่ล็อกอิน — **ไม่มีผลบน Vercel** (โค้ดเช็ก `VERCEL` env) | เฉพาะเครื่อง |
| `GITHUB_TOKEN`, `GITHUB_REPO` | ให้หลังบ้านสั่งรัน/ดูสถานะ GitHub Actions | ไม่บังคับ |
| `SUPABASE_SCHEMA` | ค่าเริ่มต้น `public` (โปรเจกต์นี้ Data API default เป็น `api` เลยต้องปัก) | ไม่บังคับ |

คีย์ AI ฝั่งเซิร์ฟเวอร์เท่านั้น **ห้ามขึ้นต้นด้วย `VITE_`** ไม่งั้นหลุดไปเบราว์เซอร์

ค่าจริงทั้งหมดอยู่ใน `.env` ของเครื่องเดิม (คัดลอกไฟล์นี้ไปเครื่องใหม่ได้เลย) หรือดูใน Vercel → Settings → Environment Variables

## 3. Deploy

- push ไป `main` → Vercel deploy อัตโนมัติ → https://swm-blue.vercel.app
- เช็กผล deploy: `curl -s https://api.github.com/repos/bravealltime/swm/commits/main/status` (state `success`/`failure`)
- `vercel.json`: rewrite ทุกอย่างที่ไม่ใช่ `/api/` ไป `/` (SPA), ฟังก์ชัน `api/**/*.js` timeout 60 วิ
- **บทเรียน:** ห้ามเพิ่ม pattern ที่สองใน `functions` (เช่น `api/admin/*.js` + `includeFiles`) — deploy ล้มภายใน 3 วิ ถ้าฟังก์ชันต้องอ่านไฟล์ ให้เขียน `path.resolve(process.cwd(), 'ไฟล์ตรง ๆ')` ให้ Vercel trace ได้ (ดู `api/_lib/admin.js` `DATA_FILES`)

## 4. โครงสร้างโค้ด

```
src/
  App.jsx            เชลล์แอป: lazy VIEWS map, router, Ctrl+K, แบนเนอร์ประกาศ, autoStart AegisLink
  router.js          path = /<viewId>, query q/tab/player/monster, VIEW_TITLES; /monster/<slug> = สารานุกรมเปิดตัวนั้น (monsterSlug ใช้ร่วมกับตัว prerender)
  views/*View.jsx    หน้าละไฟล์ (Dashboard, MyBox, GuildWarRoom, Admin, Leaderboards, PluginCompanion, Quiz…)
  views/mybox/       แท็บหนักของกล่องของฉันแยกไฟล์และโหลดเมื่อเปิด (lazy): PokedexCollection (ทำเนียบ LD5 — ระดับ/อัตราชนะดึงจาก swrtTierList ไม่ใช่ตัวเลขแต่ง), ArtifactSearchEngine, RuneEfficiencyAndQuads, SiegeDefenseBuilder, RuneCard; shared.js = monsterOf/ELEMENT_*/card/agoLabel
                     QuizView = "ทายมอนจากสกิล" เกมรายวัน: seed จากวันที่ (เวลาไทย) ใน utils/quiz.js ทุกคนได้โจทย์เดียวกัน, สระ = มอนเมต้า Guardian ที่ถูกเลือก ≥10 ครั้ง, ผล/streak เก็บ localStorage `swm:quiz:*`
  components/        AiChatPanel, AiAnswer, AiAdvisorPanel, MonsterDetailModal, RuneBoard, RuneIcon, Sidebar, Navbar…
  contexts/AuthContext.jsx   Supabase auth + isAdmin + adminMode
  services/
    aegisLive.js     ลิงก์เรียลไทม์กับปลั๊กอิน SWEX (SSE) → parse → saveBox → emit
    adminClient.js   fetch /api/admin/* พร้อม token; loadPublicSettings()
    aiClient.js      askAdvisor() → /api/ai/advise
    storageService.js IndexedDB (กล่อง, สถานะกิลด์วอร์) + BroadcastChannel
    supabaseClient.js lazy SDK (getSupabase() คืน Promise)
  utils/
    swexImport.js    parseSwexExport() ไฟล์/แพ็กเก็ต SWEX → box (BOX_VERSION 5), RUNE_SETS, สูตร SPD/efficiency; boxUnits()/boxRunes() อ่านกล่องทุกรูปแบบ; topSpeedRunes() = รูนเรียงตามซับ SPD ตามที่ออก (ขัด/เมน/ติดตัวแยกไว้ ไม่บวก) ให้การ์ดพาสปอร์ต; isNonSummonableLd5() จับ LD5 ฟิวชั่น/แจกฟรีด้วย id และชื่อแบบตรงตัวเท่านั้น
    boxStorage.js    loadBox/saveBox/clearBox (localStorage + IndexedDB) — แยกไว้ให้เชลล์ไม่ต้องโหลดแคตตาล็อก
    siegeLive.js     แกะแพ็กเก็ตกิลด์/Siege → สถานะห้องบัญชาการ
    guildRankings.js แกะแพ็กเก็ตอันดับกิลด์ + serverFromCountry()
    cardExporter.js  การ์ดแชร์ PNG (พาสปอร์ต, ตู้ LD5, มอนสเตอร์) วาดด้วย Canvas — พาสปอร์ตแถวล่างคือรูนสปีดสูงสุด 6 ใบ (ค่าซับตามที่ออก ขัดแสดงแยก) รูปตัวแทนใช้ wizard.repMonster ก่อน
    boxSummary.js    สรุปกล่องแบบย่อส่ง AI (ไม่มี id บัญชี)
    mdcMatch.js      จับทีมตั้งรับในห้องบัญชาการ (ชื่อ 3 ตัว) กับฐาน 3MDC: ตรงเป๊ะ → ใกล้เคียง 2/3 → ไม่มี; จัดอันดับสูตรแก้ที่กล่องมีครบขึ้นก่อน
    metaTeams.js     จับ duo/trio จริงจาก swrtGuardianMeta กับกล่องผู้ใช้ → ทีมที่เล่นได้ / ขาด 1 ตัว / ตัวที่ปลดล็อกทีมมากสุด
                     (UI: components/MetaTeamsFromBox.jsx ในแท็บ "เมต้า Guardian" ของกล่องของฉัน; ส่ง context.metaTeams ให้โค้ช AI)
    arenaMatcher.js  จับสูตร AO/AD (data/arenaMetaTeams.json) กับกล่อง: นับจำนวนตัวซ้ำ (Lushen ×2 ต้องมี 2 ตัว), ทีมครบ / ครบถ้าใช้ตัวแทน (swaps) / ขาดกี่ตัว — หน้า /arena (views/ArenaMetaView.jsx)
    arenaTraits.js   กลไกของมอน (ล้างบัฟ/ชุบ/สวนกลับ/CC/ลดเกจ/บอมบ์/ลีด…) อ่านจาก effects ในสกิลจริง — ไม่มี import ใช้ร่วมกันระหว่างสคริปต์กับเบราว์เซอร์; ผลลัพธ์ทั้ง 848 ตัวอยู่ใน data/arenaMonsterTraits.json (generated)
    arenaCounter.js  "เจอทีมรับนี้ บุกด้วยอะไร": โปรไฟล์ทีมรับจาก traits (ช่อง 1 = ลีด) → ให้คะแนนสูตร AO ตามกลไกที่ตอบโจทย์ + `counters` ที่ระบุไว้บนสูตร AD ที่ตรง ≥3/4 — คะแนนคือลำดับ ไม่ใช่ % ชนะ; ลิงก์แชร์ /arena?tab=counter&ad=A,B,C,D; มีโค้ช AI (kind 'arena' ใน api/_lib/advisor.js)
    cardExporter.js  … + exportArenaTeamCard (การ์ดทีม AO/AD 1200×675, พรีวิวก่อนดาวน์โหลด)
  hooks/useGuildRankings.js  รวมอันดับที่แชร์ (API) + ที่เห็นสดบนเครื่องนี้
  hooks/useMonsterSkills.js  สกิลรายตัวสำหรับสารานุกรม โหลด shard ตามต้องการ (data/monsterSkills.js เป็น store)
  data/*.json        ชุดข้อมูลที่ bundle มากับเว็บ (ดูข้อ 5)
  data/monsterSkillsIndex.json  (generated, ไม่อยู่ใน git) ดัชนีเล็ก ๆ สำหรับฟิลเตอร์กลไกสกิล
public/data/skills/<0-15>.json  (generated, ไม่อยู่ใน git) ข้อมูลสกิล 16 shard เรียงตามลำดับหน้าสารานุกรม (หน้าแรก = shard 0)
                     บีบรูปแบบ: effects เก็บเป็น [idx, chance] อ้างตารางในดัชนี, ไอคอนตัด prefix, ไม่มี description อังกฤษ —
                     expandRecord() ใน data/monsterSkills.js ประกอบกลับเป็น shape เดิม สร้างโดย scripts/build_skill_shards.mjs
                     ตอน vite เริ่ม (dev/build) ผ่าน plugin ใน vite.config.js เมื่อ monsterSkillsData.json/allMonsters.json ใหม่กว่า
api/                 Vercel serverless (ESM) — dev server มี middleware ใน vite.config.js เรียก handler เดียวกัน
  ai/advise.js       POST โค้ช AI (rate limit 3/นาที anon, 12/นาที ล็อกอิน) + ล็อกลง ai_logs
  admin/[action].js  หลังบ้าน: status, settings, logs, runs, actions, me
  guild-rankings.js  GET สาธารณะ / POST (ต้องล็อกอิน) อันดับกิลด์
  _lib/ai.js         chat() ต่อ provider, parseJson(), loadEnv()
  _lib/advisor.js    prompt ที่ grounded ด้วยสกิลจริง (mdc / draft / chat)
  _lib/admin.js      requireAdmin, Supabase REST (service role), settings, ai_logs, datasetReport, GitHub
plugins/aegislink/   ปลั๊กอิน SWEX (CommonJS ไฟล์เดียว) — หน้า /aegislink import ด้วย ?raw ให้ดาวน์โหลด
scripts/             ตัวดึง/สร้างข้อมูล 25 ตัวที่ใช้จริง — แผนที่ทั้ง pipeline อยู่ใน scripts/README.md (ดูข้อ 5)
scripts/_archive/    สคริปต์แกะโค้ด/ลอง API ครั้งเดียว 90 ตัว ไม่ได้ดูแลต่อ
supabase/admin_schema.sql  ตารางหลังบ้าน (รันแล้วในโปรเจกต์ปัจจุบัน)
.github/workflows/update-swrt-data.yml  งานรายคืน
.github/workflows/ci.yml   lint + test + build ทุก push/PR (Vercel deploy ไม่รอผลนี้ — ดูไว้เป็นสัญญาณว่าพัง)
tests/*.test.js      vitest (`npm test`) — parser SWEX, แพ็กเก็ต siege/อันดับกิลด์, กติกาเลือกกระดาน, handler API, parseJson ของ AI, shard สกิล round-trip
```

กติกาเล็ก ๆ: view ใหม่ = เพิ่มใน `VIEWS` (App.jsx) + `VIEW_TITLES` (router.js) + เมนูใน `src/data/navigation.js` (+ `resolveView` ใน Sidebar ถ้า id ไม่ตรง)

## 5. ข้อมูลมาจากไหน (ของจริงทั้งหมด — ไม่มีตัวเลขแต่ง)

| ข้อมูล | ไฟล์ | แหล่ง / สคริปต์ |
|---|---|---|
| ผู้เล่น Guardian 2,000+ คน, รีเพลย์ | `src/data/swrtPlayersIndex.json`, `public/data/swrt-matches/<id%32>.json` | swranking.com public API (`replayallist`, `monster/topPlayer`) — `scripts/fetch_swrt_players.cjs --pages=30 --top=100` |
| เมต้า Guardian (pick/win/ban, duo/trio) | `swrtGuardianMeta.json` | สร้างพร้อมกันจากรีเพลย์ |
| เส้นแบ่งแรงค์, เมต้า SWRT, tier list | `swrtRankCutoffs.json`, `swrtMetaMonsters.json`, `swrtTierList.json`… | `scripts/extract_swrt_data.cjs` |
| แคตตาล็อกมอนสเตอร์ 1,192 ตัว (รูปจาก CloudFront ของเกม) | `allMonsters.json` | `scripts/build_all_monsters.cjs`, `fill_missing_monsters.cjs` (swarfarm) |
| สกิล 940 ตัว แปลไทย 100% | `monsterSkillsData.json` (`descriptionTh`) — ฝั่งเว็บ**ไม่ import ไฟล์นี้ตรง ๆ** (7 MB) แต่ใช้ shard ที่ generate จากมัน; ฝั่ง `api/` และสคริปต์ยังอ่านไฟล์เต็ม | `scripts/build_monster_skills.cjs` → shard สร้างเองตอน dev/build (`npm run skills:shards` ถ้าจะบังคับ) |
| 3MDC, dungeon, patch notes | `allMdcData.json`, `dungeonAbyssData.json`, `balancePatches.json` | สคริปต์ extract/fetch ต่าง ๆ |
| สรุป AI (แพตช์, สไตล์ผู้เล่น) | `balancePatchAi.json`, `swrtPlayerSummaries.json` | `scripts/ai_patch_summaries.mjs`, `ai_player_summaries.mjs` (cache ด้วย hash; CONCURRENCY 1) |
| อันดับกิลด์ Siege/WGB | Supabase `guild_rankings` (1 แถวต่อผู้ส่งต่อกระดาน `server:kind:uuid`) | **ไม่มี API สาธารณะ** → มาจากหน้าอันดับในเกมผ่าน AegisLink แล้วผู้เล่นที่ล็อกอินแชร์ ผู้ส่งเขียนทับกันไม่ได้ เซิร์ฟเวอร์เลือกกระดานที่แสดงใน `api/_lib/guildRankings.js pickBoards()`: ผู้ส่งที่เชื่อถือ (แอดมิน/ที่ติ๊กในหลังบ้าน) → ที่มีผู้ส่งอีกคนเห็นตรงกัน (top-10 ซ้ำ ≥ 60%) → ล่าสุดพร้อมป้าย "ยังไม่ยืนยัน"; ผู้ส่งที่บล็อกถูกตัด; เก่ากว่า 30 วันไม่แสดง รายชื่อ trusted/blocked อยู่ใน `site_settings` id `guildRankings` |
| กล่องของผู้ใช้ | localStorage `swm:mybox` + IndexedDB (เครื่องผู้ใช้เท่านั้น) | ไฟล์ SWEX / โฟลเดอร์ SWEX / AegisLink |
| สูตรทีมบุก/รับอารีน่า (AO/AD) 24+27 ทีม | `arenaMetaTeams.json` (**generated** — อย่าแก้ตรง) | **อารีน่าปกติไม่มีสถิติสาธารณะ** (swgt = Siege/3MDC, swranking = RTA) จึงเป็นสูตรคอมมูนิตี้ที่คัดไว้ใน `scripts/build_arena_teams.mjs`: ทุกชื่อ/ตัวแทนต้องมีใน `allMonsters.json`, ข้อความลีดดึงจาก `monsterSkillsData.json` (ตัวสร้าง fail ถ้าสะกดผิด), ธง `ld` คำนวณจากธาตุ; มี `tier` S/A/B เป็นความเห็นร่วม **ไม่มี % อัตราชนะ / เวลาเคลียร์** และ UI บอกไว้ชัด; เทสต์ยืนยันว่าไฟล์ตรงกับที่สคริปต์สร้าง — แก้สูตรแล้วรัน `node scripts/build_arena_teams.mjs` |

รหัสแรงค์ Com2uS: 3001-3003 Fighter, 3501-3503 Conqueror, 4001-4003 Guardian, 5001 Legend
รหัสมอนสเตอร์ `com2usId` รูปแบบ FFF-A-E (หลักสิบ = ระดับตื่น: 0 ยังไม่ตื่น, 1 = 1A, 3 = 2A)

**ห้าม** commit `public/data/my_profile.json` หรือ dump บัญชีใคร (เคยหลุดครั้งหนึ่ง ลบออกแล้ว; ประวัติ git ยังมีอยู่ใน `8d4f26d`, `53f60e3` — ถ้าจะล้างต้อง force-push ซึ่งยังไม่ได้รับอนุญาต)

## 6. โค้ช AI

- ทุกคำตอบ **grounded**: เซิร์ฟเวอร์แนบสกิล/สเตตัสจริงจาก `monsterSkillsData.json` ของมอนสเตอร์ที่ถูกเอ่ยถึง + สรุปกล่องผู้ใช้ (ถ้ามี) + สถิติผู้เล่น SWRT ที่ถูกเอ่ยชื่อ
- ขอบเขต: ตอบเฉพาะ Summoners War (นอกเรื่องจะบอกปัด 1 บรรทัด) ห้ามเดาชื่อคล้าย
- provider เป็น reasoning model: ใช้ `reasoning_effort:'low'` และ `maxTokens` ≥ 300 (ถ้าน้อยจะได้คำตอบว่างเพราะโทเค็นหมดไปกับการคิด); รับได้ 1 คำขอค้าง/คีย์ → สคริปต์ batch ต้อง CONCURRENCY 1; ตอบยาวอาจ 504 → แบ่ง chunk
- ปิด/เปิดจากหลังบ้าน (`features.ai`) และดูล็อกคำถามได้ที่แท็บ "โค้ช AI"
- **สิทธิ์ (2026-09-20)**: เฉพาะสมาชิก (`settings.ai.requireLogin`, ค่าเริ่มต้น true) และ **โควตา `settings.ai.dailyLimit` = 3 คำตอบต่อวันไทย นับต่อบัญชี *และ* ต่อ IP** (ตัวไหนถึงก่อนก็ติด) นับจากแถว `ai_logs` ที่ `ok=true` จึงใช้ได้ข้าม instance; แอดมินไม่ติดโควตา; ถ้าอ่านตารางไม่ได้จะปล่อยผ่าน (fail-open) — กติกาอยู่ใน `api/_lib/aiQuota.js` (pure, มีเทสต์) และ `api/ai/advise.js`; ยังมี burst 6 ครั้ง/นาทีในหน่วยความจำ
- ทุกคำถามบันทึก **IP จริง + ประเทศ/จังหวัด/เมือง/timezone** จาก header ของ Vercel (`x-vercel-ip-*`) ลง `ai_logs` — คอลัมน์เหล่านี้เพิ่มด้วย `supabase/admin_schema.sql` (รันซ้ำได้) ถ้ายังไม่รัน API จะเขียนแถวแบบไม่มี geo ให้แทน และหลังบ้านขึ้นเตือน
- ฝั่งเว็บ: `aiClient.askAdvisor` โยน Error ที่มี `code` (`LOGIN_REQUIRED` / `DAILY_LIMIT` / `RATE_LIMIT`) + `quota`; แผง AI ทั้งสองใช้ `useOptionalAuth()` แสดงปุ่มเข้าสู่ระบบ (event `swm:open-auth` → App เปิด AuthModal) และ "เหลือ x/3 คำถามวันนี้"

## 7. AegisLink (เรียลไทม์)

- ปลั๊กอิน v2.1: เก็บกล่องตอน `HubUserLogin` แล้วอัปเดตตามทุกแพ็กเก็ตที่มี `unit_info/rune/artifact` (จับจากชื่อฟิลด์ ไม่ผูกชื่อคำสั่ง) เปิดเซิร์ฟเวอร์ `http://127.0.0.1:7391` (`/status`, `/snapshot`, `/guild`, `/events` SSE) ตอบเฉพาะ Origin ของ swm-blue.vercel.app / localhost
- ฝั่งเว็บ `aegisLive.js`: เปิดไว้ = localStorage `swm:aegis-live=1` (App autoStart), พอร์ตใน `swm:aegis-port`; หลุด 5 ครั้งจะรอ 30 วิ
- ห้องบัญชาการกิลด์: พอมีแพ็กเก็ตจริงจะ**ล้างข้อมูลตัวอย่าง**ทิ้ง (`siegeLive.js applyLiveToWar`); ใต้ทีมตั้งรับทุกทีมมีสูตรแก้จากฐาน 3MDC จริง (`mdcMatch.js`, โหลด `allMdcData.json` แบบ lazy) — ฐานมี 29 ทีมรับ ถ้าไม่ตรงจะให้ปุ่มค้นหาแทน
- ทดสอบโดยไม่ต้องมีเกม: สคริปต์จำลองอยู่นอก repo (scratchpad `plugin_sim.cjs`) — แนวคิดคือ `require('plugins/aegislink/index.js')` แล้ว `init()` ด้วย proxy ปลอมที่ `emit('apiCommand', req, resp)`
- **ยังไม่เคยเจอแพ็กเก็ตจริง**: รูปแบบ Siege/อันดับกิลด์แกะจากชื่อฟิลด์มาตรฐาน ถ้าผู้ใช้จริงเปิดหน้า Siege แล้วส่วนไหนว่าง ให้ดูชื่อคำสั่งจากคอนโซลหน้า /aegislink แล้วปรับ `siegeLive.js` / `guildRankings.js`

## 8. หลังบ้าน `/admin`

- ผู้ดูแลในตัว: `pedictu@gmail.com` (hard-code ใน `api/_lib/admin.js` `OWNER_EMAILS`) + `ADMIN_EMAILS`
- ล็อกอินแล้วมีสวิตช์บนแถบเมนู "ผู้ใช้ปกติ ⇄ โหมดแอดมิน" (จำใน localStorage `swm:admin-mode`) เปิดแล้วเมนู "หลังบ้าน SWM" โผล่
- แท็บ: ภาพรวม (สุขภาพระบบ), โค้ช AI (สถิติ+ล็อก+ทดสอบโมเดล), ข้อมูล (ความสด/ขนาดทุกชุด), ตั้งค่าเว็บ (ประกาศ, โหมดปรับปรุง, สวิตช์ฟีเจอร์), อันดับกิลด์ (snapshot ทุกผู้ส่ง + เชื่อถือ/บล็อก/ลบ), งานอัตโนมัติ (GitHub Actions)
- ตาราง Supabase (schema `public`): `site_settings`, `ai_logs`, `guild_rankings` — RLS เปิดโดยไม่มี policy = เบราว์เซอร์อ่านไม่ได้ เซิร์ฟเวอร์ (service role) เท่านั้น

## 9. งานอัตโนมัติ

**ชั้นข้อมูลสด (2026-09-20)** — ข้อมูลที่เปลี่ยนบ่อยไม่ต้องรอ deploy: งานเขียนเอกสาร JSON ลง Supabase `live_data(key, value)` → เว็บอ่าน `/api/live/<key>` (edge cache 5 นาที) ผ่าน hook `useLiveData(key, bundledFallback)` และแท็บที่เปิดอยู่รับการเปลี่ยนแปลงผ่าน Supabase Realtime (`src/services/liveData.js`); JSON ใน `src/data` ยังเป็นค่าสำรอง/ตอนโหลดครั้งแรก
- `.github/workflows/update-live-data.yml` **ทุกชั่วโมง** (นาที 17): `extract_swrt_data.cjs` → `scripts/publish_live_data.mjs` (เขียนเฉพาะ key ที่ hash เปลี่ยน) ไม่ commit ไม่ deploy — ต้องมี secret `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` ใน GitHub
- งานคืน (`update-swrt-data.yml`) ยัง commit เหมือนเดิม + publish ทุก key (รวม guardian-meta, patches)
- key ที่มี: `rta-tierlist`, `rta-cutoffs`, `rta-meta`, `guardian-meta`, `patches`, `patches-ai`, `codes` (ของแอดมิน — สคริปต์ seed ครั้งแรกจาก `promoCodes.js` แล้วไม่ทับ)
- หน้าที่ต่อแล้ว: โค้ดแจกไอเทม (`codes` + ผู้ใช้ส่งโค้ดเข้าคิว `code_submissions` วันละ 5/IP → แอดมินอนุมัติในแท็บ "ข้อมูลสด & โค้ด" ขึ้นเว็บทันที), ทำเนียบ LD5 ในกล่องของฉัน (`rta-tierlist`), Where to Use (`rta-meta`); **ยังไม่ต่อ**: RtaAnalyticsView / MetaTeamsFromBox / GuardianView (อีก session แก้ไฟล์เหล่านี้ค้างอยู่ตอนทำ) — ต่อด้วย `useLiveData` บรรทัดเดียวต่อชุดข้อมูล
- ประกาศ/โหมดปรับปรุงจากหลังบ้านถึงแท็บที่เปิดอยู่ทันที (Realtime บน `site_settings` → โหลด public settings ใหม่)
- **ไม่แสดงชื่อแหล่งข้อมูลภายนอกบนหน้าเว็บ** (นโยบายเจ้าของ 2026-09-20) — ใช้คำว่า "สถิติการแข่งขันจริง / RTA World Arena" แทน

`update-swrt-data.yml` รันทุกคืน 03:00 (ไทย) หรือกดเองใน GitHub → Actions: extract_swrt_data → fetch_more_replays → fetch_swrt_players → (ถ้ามี AI secrets) ai_patch_summaries + ai_player_summaries → commit → Vercel deploy
Secrets ที่ต้องมีใน GitHub: `AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY`

## 10. สิ่งที่ค้าง / ควรทำต่อ

1. ~~ใส่ `SUPABASE_SERVICE_ROLE_KEY` ใน Vercel~~ — ทำแล้ว 2026-09-19 พร้อม `VITE_SUPABASE_*` ตรวจแล้วว่า prod อ่าน/เขียน `site_settings` และ `guild_rankings` ได้
2. ~~ทดสอบหลังบ้านบนเว็บจริงด้วยบัญชี pedictu@gmail.com~~ — ผ่านแล้ว 2026-09-19: ล็อกอินจริง → โหมดแอดมิน → ทั้ง 5 แท็บ, ทดสอบโมเดล, บันทึกตั้งค่าลง Supabase และคืนค่า
3. ติดตั้งปลั๊กอิน v2.1 ใน SWEX ของผู้ใช้จริง แล้วเปิดหน้ากิลด์/Siege/อันดับในเกม → ปรับตัวแกะแพ็กเก็ตตามของจริง
4. หมุนคีย์ AI (`xaek_sk_…`) เพราะเคยถูกวางในแชต — อัปเดตทั้ง .env, Vercel, GitHub secrets
5. (ถ้าอยาก) ล้าง `public/data/my_profile.json` ออกจากประวัติ git ด้วย filter-branch + force-push
6. ปุ่มการ์ดแชร์: ทดสอบกับกล่องจริง 553 ตัว (ทดสอบแล้วกับกล่องจำลอง 5 ตัว)
7. **รัน `supabase/admin_schema.sql` ใน Supabase SQL Editor อีกครั้ง** — เพิ่มคอลัมน์ geo ให้ `ai_logs` **และสร้าง `live_data` + `code_submissions` + เปิด Realtime** (จนกว่าจะรัน: หน้าเว็บใช้ JSON ในตัวเหมือนเดิม, ส่งโค้ดจะบอกว่าระบบยังไม่พร้อม)
8. ใส่ secret `SUPABASE_URL` และ `SUPABASE_SERVICE_ROLE_KEY` ใน GitHub → Settings → Secrets → Actions แล้วกด Run workflow "Update live data" (หรือปุ่ม "รีเฟรชข้อมูลสดตอนนี้" ในหลังบ้าน ถ้ามี `GITHUB_TOKEN`) — ครั้งแรกจะ seed โค้ดด้วย

## 11. เทคนิคที่เจอบ่อย

- รูปจาก `do9d4mpqk497d.cloudfront.net` ใช้บน Canvas ต้อง `crossOrigin='anonymous'` + ใส่ `?swm-card=1` กันแคชแบบไม่มี CORS (`cardExporter.js loadImage`)
- Windows ไม่มี glyph ธงอีโมจิ → บน Canvas ใช้รหัสประเทศแทน
- Vite dev: API ทั้งหมดทำงานผ่าน middleware ใน `vite.config.js` (import handler เดียวกับ Vercel) — เพิ่ม endpoint ใหม่ต้องเพิ่ม route ตรงนั้นด้วย
- ESM ใน `api/`: ต้องใส่นามสกุล `.js` ตอน import และ `with { type: 'json' }` สำหรับ JSON
- **Vercel freeze ฟังก์ชันทันทีที่ส่ง response** — งานหลัง response แบบ fire-and-forget (เช่น insert ล็อก) จะไม่ถึง Supabase ต้อง `await` ก่อน return (ดู `logAiCall` มี timeout 4 วิ) ในเครื่อง dev ไม่เจอเพราะ process ไม่ freeze
- Supabase โปรเจกต์นี้ Data API default schema เป็น `api` — ถ้ายิง REST ตรง ๆ ต้องใส่ header `Accept-Profile: public` (โค้ดใน `admin.js rest()` ใส่ให้แล้ว)
- `loadEnv()` ใน `api/_lib/ai.js` อ่าน `.env` ครั้งเดียวต่อ process → แก้ `.env` แล้วต้องรีสตาร์ต `npm run dev`
- เช็ก prod ว่า Supabase ฝั่งเซิร์ฟเวอร์ใช้ได้โดยไม่ต้องล็อกอิน: `GET https://swm-blue.vercel.app/api/guild-rankings` ต้องไม่มีฟิลด์ `error`
- lint: `npm run lint` (oxlint) — warning `set-state-in-effect`/`no-unused-vars` ที่ค้างเป็นของเดิม ไม่ต้องไล่แก้
- test: `npm test` (vitest, ~3 วิ, ไม่ต้องมี .env) / `npm run test:watch` — แก้ parser ใน `src/utils/` หรือ `api/_lib/` แล้วรันก่อน commit; fixture แพ็กเก็ตใน `tests/siegeLive.test.js` เป็นรูปแบบที่*เดา*จากชื่อฟิลด์ พอเจอแพ็กเก็ตจริงให้แก้ fixture ตาม
- build: `npm run build` (main bundle ~280 kB gzip 87 kB — อย่า import แคตตาล็อก/Supabase SDK เข้าเชลล์)
- **SEO / หน้ามอนสเตอร์:** `vite build` จบแล้ว plugin `swm-prerender` เขียน `dist/monster/<slug>.html` 940 หน้า (title/description/OG/canonical + สกิลไทยเป็น HTML ใน `#root`), `dist/sitemap.xml`, `dist/robots.txt` (`npm run prerender` รันซ้ำบน dist เดิมได้) — Vercel เสิร์ฟไฟล์ static ก่อน SPA rewrite และ `cleanUrls: true` ทำให้ `/monster/lushen` = `lushen.html`; ฝั่ง SPA `router.js` แปลง path นั้นเป็น catalog + เปิด modal และตอนเปิด modal จะ `replaceState` เป็น URL เดียวกัน ถ้าแก้ชื่อมอนสเตอร์ใน `allMonsters.json` URL จะเปลี่ยนตาม (ไม่มี redirect ของเก่า)
- **ฟีเจอร์ที่อ่านกล่องผู้ใช้ต้องผ่าน `boxUnits(box)` / `boxRunes(box)` ใน `utils/swexImport.js`** — กล่องที่เว็บเก็บเป็นแบบย่อ (`units[].masterId/spd`, `runes[].set/main/q0` เป็นตัวเลข) ไม่ใช่ไฟล์ SWEX ดิบ (`unit_list`, `pri_eff`) เคยมีโค้ดเดาฟิลด์เอง (siegeAutoBuilder, reappEvaluator, SiegePlanner) แล้วเห็นว่าผู้ใช้ไม่มีมอนสเตอร์เลย/ทุกรูนเป็น Violent — และ `MONSTERS[].id` เป็น string `m-13413` ห้ามเทียบกับเลข com2us ใช้ `getMonsterCatalogInfo(masterId)`
- ฟีเจอร์ที่ต้องมีกล่องก่อน (ไม่ต้องล็อกอิน): กล่องของฉัน, จัด 10 ทีม Siege (ไม่มีกล่อง = สูตรเมต้าล้วน + แจ้งเตือน), Arena AO/AD matcher (มีปุ่มกล่องตัวอย่าง), สแกนรูนรีออปชั่น, Radar พลังบัญชี — ทุกหน้ามี CTA ไปหน้ากล่องของฉัน; ที่ต้องล็อกอิน: /admin, แชร์อันดับกิลด์, โควตา AI 12/นาที
- **อย่า `import monsterSkillsData.json` ใน `src/`** — chunk จะบวม 5 MB ทันที (เคยเป็นแบบนั้นกับหน้าสารานุกรม) ใช้ `useMonsterSkills(monster)` / `loadMonsterSkills()` / `getSkillTags()` จาก `src/data/monsterSkills.js` แทน
- Vite dev จำรายชื่อไฟล์ใน `public/` ตอนสร้าง server — ไฟล์ที่ plugin สร้างต้องเกิดใน `configResolved` (ไม่ใช่ `buildStart`) และเขียนทับแทนลบ-สร้างใหม่ ไม่งั้น request จะได้ index.html แทนไฟล์
