// Grounded draft / counter advisor. The model only sees facts we hand it (skills, leader skills,
// base stats from the SWM catalog, plus the caller's team data) and is told to reason from those.
import fs from 'node:fs';
import path from 'node:path';
import { chat } from './ai.js';

let skillIndex = null;
function loadSkills() {
  if (skillIndex) return skillIndex;
  const file = path.resolve(process.cwd(), 'src/data/monsterSkillsData.json');
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const list = Array.isArray(raw) ? raw : Object.values(raw);
  skillIndex = new Map();
  for (const m of list) {
    if (m?.name) skillIndex.set(m.name.toLowerCase(), m);
    if (m?.cid) skillIndex.set(String(m.cid), m);
  }
  return skillIndex;
}

const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();

/** Compact fact sheet for one monster: leader skill, base stats, each skill in one line. */
export function monsterFacts(nameOrId) {
  const idx = loadSkills();
  const m = idx.get(String(nameOrId).toLowerCase()) || idx.get(String(nameOrId));
  if (!m) return `- ${nameOrId}: (ไม่มีข้อมูลสกิลในระบบ)`;
  const bs = m.bs || {};
  const lead = m.ls?.textTh || m.ls?.textEn ? `ลีด: ${clean(m.ls.textTh || m.ls.textEn)}` : 'ไม่มีลีด';
  const skills = (m.sk || []).map((s) => {
    const cd = s.cooldown ? `CD${s.cooldown}` : 'ไม่มีCD';
    const tag = [s.isPassive ? 'พาสซีฟ' : null, s.isAoe ? 'AoE' : null].filter(Boolean).join('/');
    return `  ${s.slotLabel || 'S'} ${s.name}${tag ? ` [${tag}]` : ''} (${cd}${s.multiplier ? `, ${s.multiplier}` : ''}): ${clean(s.description)}`;
  });
  return `- ${m.name} | SPD ${bs.spd} HP ${bs.hp} ATK ${bs.atk} DEF ${bs.def} | ${lead}\n${skills.join('\n')}`;
}

const SYSTEM = `คุณคือโค้ช Summoners War ระดับ Guardian ของเว็บ SWM ตอบเป็นภาษาไทยที่กระชับ อ่านง่าย ใช้หัวข้อสั้นและ bullet
กฎเหล็ก:
1. ใช้เฉพาะข้อมูลสกิล/สถิติที่ให้มาในข้อความนี้ ห้ามเดาสกิลหรือธาตุของมอนสเตอร์เอง ถ้าข้อมูลไม่พอให้บอกว่าไม่พอ
2. อ้างอิงชื่อสกิลจริงเมื่ออธิบายกลไก (เช่น "S3 ลดเกจ 100%")
3. ให้แผนที่ลงมือทำได้: ลำดับเทิร์น, ใครควรเร็วกว่าใคร, เป้าหมายแรก, จุดเสี่ยง
4. ไม่ต้องทักทายหรือสรุปซ้ำ ยาวไม่เกิน ~250 คำ`;

function mdcPrompt({ defense, counters = [] }) {
  const defNames = (defense?.monsters || []).map((m) => m.name || m);
  const facts = defNames.map(monsterFacts).join('\n');
  const counterLines = counters.slice(0, 5).map((c, i) => {
    const names = (c.monsters || []).map((m) => m.name || m).join(' + ');
    return `${i + 1}. ${names} (คะแนนความน่าเชื่อถือ ${c.rating ?? '-'}${c.turnOrder ? `, ลำดับ: ${clean(c.turnOrder)}` : ''}${c.notes ? `, โน้ต: ${clean(c.notes).slice(0, 160)}` : ''})`;
  }).join('\n');
  const counterFacts = [...new Set(counters.slice(0, 3).flatMap((c) => (c.monsters || []).map((m) => m.name || m)))]
    .filter((n) => !defNames.includes(n)).map(monsterFacts).join('\n');

  return `ทีมตั้งรับ 3MDC ที่ต้องเจาะ: ${defNames.join(' + ')}
ข้อมูลสกิลฝั่งตั้งรับ:
${facts}

สูตรแก้ทางที่ชุมชน SWGT ใช้บ่อย (จากฐานข้อมูล SWM):
${counterLines || '(ไม่มีสูตรในระบบ)'}

ข้อมูลสกิลของมอนสเตอร์ในสูตรแก้ทางอันดับต้น:
${counterFacts || '-'}

งาน: อธิบายว่าทำไมทีมตั้งรับนี้อันตราย (กลไกหลักจากสกิลที่ให้มา) แล้วเลือกสูตรแก้ทางที่ดีที่สุด 1–2 สูตรจากรายการ พร้อมลำดับเทิร์น/เป้าหมายแรก/สิ่งที่ต้องระวัง ปิดท้ายด้วยเกณฑ์สปีดคร่าว ๆ ว่าตัวไหนต้องเร็วกว่าตัวไหน`;
}

function draftPrompt({ blue = [], red = [], blueLeader, redLeader, blueBan, redBan, perspective = 'blue' }) {
  const names = (list) => list.map((m) => m?.name || m).filter(Boolean);
  const blueNames = names(blue);
  const redNames = names(red);
  const facts = [...new Set([...blueNames, ...redNames])].map(monsterFacts).join('\n');
  const side = perspective === 'blue' ? 'ฝั่งเรา (Blue)' : 'ฝั่งเรา (Red)';
  return `ดราฟต์ RTA 5v5
Blue: ${blueNames.join(', ') || '-'}${blueLeader ? ` | ลีด: ${blueLeader}` : ''}${blueBan ? ` | Blue แบน: ${blueBan}` : ''}
Red: ${redNames.join(', ') || '-'}${redLeader ? ` | ลีด: ${redLeader}` : ''}${redBan ? ` | Red แบน: ${redBan}` : ''}
มุมมอง: ${side}

ข้อมูลสกิลทุกตัวในดราฟต์:
${facts}

งาน: วิเคราะห์แมตช์อัพนี้จากมุมมองฝั่งเรา — (1) เกมแพลนหลักของแต่ละฝั่ง (2) ตัวที่ควรแบน/ถูกแบนและเหตุผล (3) ลำดับเทิร์นที่ต้องการและเป้าหมายแรก (4) เงื่อนไขชนะ/แพ้ที่ต้องระวัง`;
}

/** Monster names mentioned in free text (longest names first so "Dark Stark" wins over "Stark"). */
let nameList = null;
function mentionedMonsters(text) {
  const idx = loadSkills();
  if (!nameList) nameList = [...new Set([...idx.values()].map((m) => m.name))].filter((n) => n.length >= 3).sort((a, b) => b.length - a.length);
  const lower = String(text || '').toLowerCase();
  const found = [];
  for (const n of nameList) {
    if (found.length >= 8) break;
    if (lower.includes(n.toLowerCase())) found.push(n);
  }
  return found;
}

const CHAT_SYSTEM = `คุณคือโค้ช Summoners War: Sky Arena ของเว็บ SWM คุยเป็นภาษาไทยแบบเพื่อนที่เก่งเกม กระชับ ตรงประเด็น
ขอบเขต: ตอบเฉพาะเรื่อง Summoners War เท่านั้น (มอนสเตอร์ รูน อาร์ติแฟกต์ RTA อารีน่า กิลด์วอร์/Siege ดันเจี้ยน อีเวนต์ การพัฒนาไอดี)
ถ้าคำถามไม่เกี่ยวกับ Summoners War ให้ตอบสั้น ๆ ประโยคเดียวว่าโค้ชตอบเฉพาะเรื่อง Summoners War แล้วชวนถามเรื่องเกมแทน ห้ามตอบเนื้อหานอกเกม
กฎ:
1. ข้อเท็จจริงเรื่องสกิล/สเตตัสของมอนสเตอร์ ใช้เฉพาะ "ข้อมูลอ้างอิง" ที่แนบมา ถ้าไม่มีข้อมูลของตัวนั้นให้บอกตรง ๆ ว่าไม่มีในระบบ ห้ามเดาสกิล
2. กลไกเกมทั่วไป (เซ็ตรูน, ระบบสปีด, ดันเจี้ยน) ตอบจากความรู้ทั่วไปได้ แต่ถ้าไม่มั่นใจตัวเลขให้บอกว่าเป็นค่าโดยประมาณ
3. ถ้ามี "กล่องของผู้ใช้" แนบมา ให้แนะนำจากมอนสเตอร์/รูนที่เขามีจริงเท่านั้น
4. ตอบเป็นข้อ ๆ เมื่อเป็นแผนหรือรายการ ยาวไม่เกิน ~220 คำ ไม่ต้องทักทาย`;

function chatPrompt({ question, context = {}, history = [] }) {
  const q = String(question || '').trim();
  if (!q) throw new Error('empty question');
  const NL = '\n';
  const parts = [];
  if (context.box) parts.push(`กล่องของผู้ใช้ (สรุป):${NL}${String(context.box).slice(0, 6000)}`);
  if (context.defense) parts.push(`ทีมตั้งรับที่กำลังดูอยู่: ${context.defense}`);
  if (context.draft) parts.push(`ดราฟต์ที่กำลังดูอยู่: ${context.draft}`);
  if (context.previousAnswer) parts.push(`คำตอบก่อนหน้าของโค้ช (ย่อ): ${String(context.previousAnswer).slice(0, 1200)}`);
  const names = [...new Set([...mentionedMonsters(q), ...(context.monsters || []).slice(0, 12)])].slice(0, 14);
  if (names.length) parts.push(`ข้อมูลอ้างอิงสกิล/สเตตัส:${NL}${names.map(monsterFacts).join(NL)}`);
  const past = history.slice(-4).map((h) => `${h.role === 'user' ? 'ผู้ใช้' : 'โค้ช'}: ${String(h.text).slice(0, 600)}`).join(NL);
  if (past) parts.push(`บทสนทนาก่อนหน้า:${NL}${past}`);
  parts.push(`คำถาม: ${q}`);
  return parts.join(NL + NL);
}

/**
 * kind: 'mdc' | 'draft' | 'chat'. Returns { answer, model, usage }.
 */
export async function advise(payload) {
  const kind = payload?.kind;
  let user;
  let system = SYSTEM;
  if (kind === 'mdc') user = mdcPrompt(payload);
  else if (kind === 'draft') user = draftPrompt(payload);
  else if (kind === 'chat') { user = chatPrompt(payload); system = CHAT_SYSTEM; }
  else throw new Error('unknown kind');
  if (user.length > 24000) user = user.slice(0, 24000);
  const { text, usage, model } = await chat({ system, user, maxTokens: 900, temperature: kind === 'chat' ? 0.4 : 0.3 });
  return { answer: text, usage, model };
}
