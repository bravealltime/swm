# ⚔️ SWM (Summoners War Master)

> **ศูนย์รวมยุทธวิธีกิลด์วอร์, สารานุกรมสกิลมอนสเตอร์ฉบับภาษาไทย, วิเคราะห์ RTA & สถิติเมต้าระดับโลก**

🌐 **Official Live Website:** [https://swm-blue.vercel.app/](https://swm-blue.vercel.app/)

---

## 🌟 ฟีเจอร์หลักของระบบ (Key Features)

1. **🎯 ระบบค้นหาทีมแก้ทาง 3MDC (Siege & Guild War)**
   - ค้นหาสูตรเจาะหอ 4★ และ 5★ คำนวณ Winrate % จากการรบจริง พร้อมคลิกดูทีมบุกเคาน์เตอร์
2. **🏆 วิเคราะห์เวิลด์อารีน่า RTA & SWRT Intelligence (Season 38)**
   - RTA Tier List แยกตามระดับการ์เดียน (Guardian G1-G3), คอนเคอเรอร์ (C1-C3) และทุกระดับ
   - ตารางสถิติ Pick / Win / Ban Rate จาก 6.8 ล้านแมตช์
   - รีเพลย์แข่งสดพร้อมป้ายแบน และจุดตัดคะแนน Rank Cutoffs เรียลไทม์
3. **📊 สถิติเมต้าโลก & Tier List แบบแถบสี (All Server Analytics)**
   - สลับมุมมองระหว่าง **Table** และ **Tier List (SSS ถึง Other)** คำนวณด้วยทฤษฎี Bayesian Theorem ตามแบบ SWGT
   - อันดับมอนสเตอร์ฝั่งตั้งรับ (202 ตัว) และฝั่งบุก (247 ตัว)
4. **📖 สารานุกรมสกิลมอนสเตอร์ 940 ตัว (Skill Encyclopedia)**
   - ชี้เมาส์ (Hover) ดู Tooltip สกิลได้ทันที พร้อมสูตรตัวคูณความเสียหาย (Multiplier) และดีบัฟ
5. **💥 ดาเมจเสริมอาร์ติแฟกต์ (Artifact Additional Damage Optimizer)**
   - คำนวณดาเมจเสริม Multi-hit, SPD/HP/ATK/DEF scaling
6. **🎁 คลังโค้ดแจกไอเทม (Active Game Codes)**
   - โค้ดแท้พร้อมปุ่มก็อปและลิงก์รับของรางวัลเข้าเกมผ่าน WithHive ทันที
7. **🛡️ AegisLink Plugin Companion**
   - ปลั๊กอินดักจับข้อมูลการรบแบบเรียลไทม์สำหรับโปรแกรม SWEX

---

## 🚀 เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend:** React 19, Vite 8, Tailwind CSS 3
- **Icons & UI:** Lucide React, Custom SVG Tactical HUD
- **Deployment:** Vercel (Auto-deployment via GitHub CI/CD)
- **Data Engine:** Pre-compiled Client Datasets for 0ms Latency Instant Search


---

## 📡 แหล่งข้อมูล RTA (SWRT) และการอัปเดต

ข้อมูล RTA ดึงจาก endpoint **สาธารณะ** ของ [swranking.com](https://www.swranking.com) (`https://m.swranking.com/api`) เท่านั้น — ไม่ใช้บัญชี/token และไม่แตะ endpoint ค้นหาผู้เล่นที่ต้อง login (`/player/list`, `/player/detail`, `/player/searchPlayer`)

| ข้อมูล | Endpoint | ไฟล์ | สคริปต์ |
|---|---|---|---|
| Tier list, Pick/Win/Ban, รีเพลย์ล่าสุด, คะแนนตัดแรงค์ | `monsterBase/getMonsterLevel`, `monster/statistical`, `player/replayallist`, `player/nowline` | `swrtTierList.json`, `swrtMetaMonsters.json`, `swrtRecentReplays.json`, `swrtRankCutoffs.json` | `node scripts/extract_swrt_data.cjs` |
| โปรไฟล์ผู้เล่น Guardian (สร้างจากรีเพลย์สาธารณะ + ผู้เล่นท็อปต่อมอนสเตอร์) | `player/replayallist?level=1`, `monster/topPlayer` | `swrtPlayersIndex.json` (ค้นหา, อยู่ใน bundle) + `public/data/swrt-matches/*.json` (รีเพลย์ 32 shard โหลดเฉพาะคนที่เปิดดู) | `npm run players:fetch` (~50 นาที, บันทึกทีละหน้า หยุดกลางคันได้, `--rebuild` สร้างไฟล์ใหม่จาก `.cache/` โดยไม่ต้องดึงซ้ำ) |
| คะแนนตัดแรงค์แบบสด | `player/nowline` (CORS เปิด) | ดึงตอนเปิดแท็บ Rank Cutoffs, cache 10 นาที, fallback เป็น JSON | `src/services/swrtLive.js` |

## 🧰 แสดงข้อมูลของตัวเอง (กล่องมอนสเตอร์ของฉัน)

หน้า `/my-box` รับไฟล์ JSON ที่ export จาก [SWEX](https://github.com/Xzandro/sw-exporter) (เมนู Profile → ไฟล์ `ชื่อไอดี-เลขไอดี.json`)
ลากไฟล์วางในหน้าเว็บ → ระบบอ่าน `wizard_info` + `unit_list` ในเบราว์เซอร์ เก็บเฉพาะรายชื่อมอนสเตอร์/ดาว/เลเวล/สเตตัส ลง `localStorage` (`swm:mybox`)
ไม่มีการอัปโหลดขึ้นเซิร์ฟเวอร์ และไม่ต้องแก้ไฟล์ในโปรเจกต์ จากนั้นเว็บจะบอกว่า

- สูตรแก้ทาง 3MDC สูตรไหนที่คุณมีมอนสเตอร์ครบ (เทียบ `com2usId` กับ `allMdcData.json`)
- มอนเมต้า Guardian 40 ตัวที่ถูกเลือกบ่อยสุด คุณมี/ขาดตัวไหน (จาก `swrtGuardianMeta.json`)
- ทีม Abyss Hard ยอดนิยมที่คุณมีสมาชิกครบ

ถ้าต้องการให้โปรไฟล์ของคุณอยู่ในหน้า Player Tracker แบบถาวร (ไม่ใช่เฉพาะเครื่องตัวเอง) ให้เพิ่ม record ใน `src/data/playerProfiles.json` ตาม schema ของรายการที่มีอยู่ แล้ว commit — หรือถ้าเล่นถึง Guardian ระบบจะเก็บจากรีเพลย์สาธารณะของ SWRT ให้เองในรอบอัปเดตถัดไป
