/**
 * AI Rune & Farming Assistant Service
 * Matches dropped runes with the user's actual monsters in their box,
 * provides step-by-step upgrade gameplans, Grind & Gem advice, and integrates with Gemini AI.
 */
import { MONSTER_BUILDS } from '../data/monsterBuilds';
import { askAdvisor } from './aiClient';
import { loadBox } from '../utils/boxStorage';

// Monster role & rune set recommendations
const SET_CANDIDATES = {
  // Vampire
  Vampire: [
    { name: 'Leo', thaiName: 'ลีโอ (อัศวินมังกรลม)', role: 'Bruiser สายล็อกสปีด', desc: 'ต้องการ Vampire มี ATK/DEF/HP สูง ไม่สนสปีด' },
    { name: 'Dominic', thaiName: 'โดมินิก (นักสู้ดาบพรานลม)', role: 'Bruiser ดาเมจทะลวง', desc: 'ต้องการ Vampire + Will มี ATK/HP/SPD สูง' },
    { name: 'Laika', thaiName: 'ไลก้า (อัศวินมังกรไฟ)', role: 'Attacker กันวันช็อต', desc: 'ต้องการ Vampire มี ATK/CR/CD/HP' },
    { name: 'Douglas', thaiName: 'ดักลาส (สตริกเกอร์ไฟ)', role: 'Counter Striker หลบหลีก', desc: 'ต้องการ Vampire เพื่อดูดเลือดสวนกลับ' },
    { name: 'Miles', thaiName: 'ไมล์ส (เมจิกอนน้ำ)', role: 'Speed Bruiser', desc: 'ต้องการ Vampire หรือ Swift ที่มี SPD สูง' },
    { name: 'Trevor', thaiName: 'เทรเวอร์ (นักรบนีโอไฟ)', role: 'Solo Siege Defense', desc: 'ต้องการ Vampire เลือดน้อยดาเมจมหาศาล' },
    { name: 'Garoche', thaiName: 'การอช (หมาป่าไฟ 2A)', role: 'Bruiser ถึกรีเจนเลือด', desc: 'ต้องการ Vampire + Destroy ถึกทนตายยาก' },
    { name: 'Aegir', thaiName: 'เอกีร์ (บาร์บาเรียนน้ำ)', role: 'Speed Bruiser สวนกลับ', desc: 'ต้องการ Vampire + Destroy เล่นกับเกจ' },
  ],
  // Destroy
  Destroy: [
    { name: 'Camilla', thaiName: 'คามิลล่า (วาลคิรีน้ำ)', role: 'Tank Bruiser อมตะ', desc: 'ต้องการ Destroy ทำลายเลือดถ่วงเวลาชนะ 100%' },
    { name: 'Feng Yan', thaiName: 'เฟิงหยาน (แพนด้าลม)', role: 'DEF Bruiser', desc: 'ต้องการ Destroy ตัดเลือดสายถึกฝ่ายตรงข้าม' },
    { name: 'Chow', thaiName: 'เชาว์ (อัศวินมังกรน้ำ)', role: 'Solo Bruiser', desc: 'ต้องการ Destroy มี HP/ATK/SPD สูง' },
    { name: 'Ritesh', thaiName: 'ริเทช (บีสต์มองค์ลม)', role: 'HP Tank Bruiser', desc: 'ต้องการ Destroy เจาะเลือดทีมรับ' },
    { name: 'Belial', thaiName: 'บีเลียล (เดม่อนน้ำ)', role: 'Siege Offense God', desc: 'ต้องการ Destroy ฟื้นชีพมาทำลายเลือดเรื่อยๆ' },
    { name: 'Skogul', thaiName: 'สโกกูล (เบอร์เซิร์กเกอร์ลม)', role: 'HP Bomb', desc: 'ต้องการ Destroy ช่วยเพิ่มการทำลายเลือด' },
  ],
  // Will
  Will: [
    { name: 'Oliver', thaiName: 'โอลิเวอร์ (เมก้าลม)', role: 'First Turn Control', desc: 'ต้องการ Will กันสตันและชิงเปิดเทิร์น' },
    { name: 'Woosa', thaiName: 'วูซ่า (ผู้บำเพ็ญน้ำ)', role: 'Immunity Buffer', desc: 'ต้องการ Will + Swift/Violent สปีดสูง' },
    { name: 'Nana', thaiName: 'นาน่า (เมจเมจิกอนน้ำ)', role: 'Soul Revival', desc: 'ต้องการ Will ป้องกันโดนล็อกสกิล' },
    { name: 'Juno', thaiName: 'จูโน่ (โอราเคิลไฟ)', role: 'Passive Stripper', desc: 'ต้องการ Nemesis/Despair พร้อม Will' },
    { name: 'Sagar', thaiName: 'ซาก้า (บิชอปไม้)', role: 'Cooldown Reset', desc: 'ต้องการ Will + Violent' },
  ],
  // Violent
  Violent: [
    { name: 'Byungchul', thaiName: 'บยองชอล (นักพรตลม)', role: 'Meta Defense God', desc: 'ต้องการ Violent + Will HP 40k+ SPD 240+' },
    { name: 'Seara', thaiName: 'เซียร์ร่า (โอราเคิลลม)', role: 'Bomb Turn Cycler', desc: 'ต้องการ Violent วนสกิลระเบิด' },
    { name: 'Veromos', thaiName: 'เวโรโมส (อิฟรีตมืด)', role: 'Debuff Cleanser', desc: 'ต้องการ Violent แก้สถานะทุกเทิร์น' },
    { name: 'Theomars', thaiName: 'เทโอมาร์ส (อิฟรีตน้ำ)', role: 'Universal Nuker', desc: 'ต้องการ Violent เทิร์นซ้อนยิงไม่เลือกธาตุ' },
    { name: 'Riley', thaiName: 'ไรลีย์ (โทเทมลม)', role: 'Immunity & Attack Buffer', desc: 'ต้องการ Violent วนบัฟทุกเทิร์น' },
  ],
  // Swift
  Swift: [
    { name: 'Eshir', thaiName: 'เอเชียร์ (หมาป่าแสง 2A)', role: 'Base Speed 115 Booster', desc: 'ต้องการ Swift ที่มี Sub SPD สูงที่สุดในไอดี' },
    { name: 'Sekhmet', thaiName: 'เซคเมต (ดีเซิร์ตควีนไฟ)', role: 'Swift Reset Counter', desc: 'ต้องการ Swift ชิงรีเซ็ตตัวเปิดฝ่ายตรงข้าม' },
    { name: 'Tiana', thaiName: 'เทียน่า (โพล่าควีนลม)', role: 'Irresistible Stripper', desc: 'ต้องการ Swift สปีดจูนนำทีม' },
    { name: 'Bastet', thaiName: 'บาสเตต (ดีเซิร์ตควีนน้ำ)', role: 'ATB & Attack Buffer', desc: 'ต้องการ Swift เร่งเกจและกางเกราะ' },
    { name: 'Ethna', thaiName: 'เอทน่า (เฮลเลดี้ลม)', role: 'Turn 1 Stunner', desc: 'ต้องการ Swift ดาเมจและความเร็วสูง' },
    { name: 'Sonia', thaiName: 'โซเนีย (แบทเทิลแองเจิลลม)', role: 'Speed Scaling One-Shot', desc: 'ต้องการ Swift มี SPD สูงสุดเพื่อวันช็อต' },
  ],
  // Rage
  Rage: [
    { name: 'Lucifer', thaiName: 'ลูซิเฟอร์ (เดม่อนแสง)', role: 'Abyss 13s / Leo Cleave', desc: 'ต้องการ Rage + Blade ยิงคริแรงตั้งแต่ฮิตแรก' },
    { name: 'Liam', thaiName: 'เลียม (เวพอนมาสเตอร์น้ำ)', role: 'Dragon Abyss 19s Boss Nuker', desc: 'ต้องการ Rage + Blade CD 220%+ วันช็อตมังกร' },
    { name: 'Lushen', thaiName: 'ลูเชน (โจ๊กเกอร์ลม)', role: 'Ignore DEF Cleave', desc: 'ต้องการ Rage + Blade ยิงทะลวงเกราะ' },
    { name: 'Bale', thaiName: 'เบล (ไลฟ์ไฟ BJ5)', role: 'Solo Raid / Cairos Nuker', desc: 'ต้องการ Rage + Will ดาเมจสูงสุด' },
    { name: 'Julie', thaiName: 'จูลี่ (ปิแอร์เรตต์น้ำ)', role: 'Wave Clearer', desc: 'ต้องการ Rage หรือ Fatal ยิงกวาด 6 นัด' },
    { name: 'Kro', thaiName: 'โคร (อินุกามิลม 2A)', role: 'Debuff Scaling Nuker', desc: 'ต้องการ Rage ยิงบอสตามจำนวนดีบัฟ' },
  ],
  // Despair
  Despair: [
    { name: 'Moore', thaiName: 'มัวร์ (สไตรเกอร์น้ำ)', role: 'Speed Lead & Disrupter', desc: 'ต้องการ Despair + Will สปีดสูงป่วนทุกฮิต' },
    { name: 'Chiwu', thaiName: 'ชิวู (ไพโอเนียร์ไฟ)', role: 'Speed Lead Stripper', desc: 'ต้องการ Despair ล้างบัฟพร้อมลุ้นสตัน' },
    { name: 'Psamathe', thaiName: 'ซามาท (แฟรี่คิงน้ำ)', role: '33% SPD Lead Reviver', desc: 'ต้องการ Despair ฟื้นชีพมากวาดดาเมจและสตัน' },
    { name: 'Praha', thaiName: 'พราฮา (โอราเคิลน้ำ)', role: 'Strip & Sleep Healer', desc: 'ต้องการ Despair + Nemesis' },
  ],
  // Nemesis
  Nemesis: [
    { name: 'Ariel', thaiName: 'เอเรียล (อาร์คแองเจิลน้ำ)', role: 'Nemesis Cut-In Healer', desc: 'ต้องการ Double Nemesis + Will ตัดเทิร์นเมื่อโดนตี' },
    { name: 'Abellio', thaiName: 'อาเบลิโอ (ดรูอิดน้ำ)', role: 'Cut-In Transformer', desc: 'ต้องการ Nemesis พาสซีฟเร่งเกจสวนกลับ' },
    { name: 'Triana', thaiName: 'ทริอาน่า (ฮาร์ปเมจิเชียนลม)', role: 'Death Prevention', desc: 'ต้องการ Violent + Nemesis' },
  ]
};

/**
 * Matches a dropped rune with the user's actual monsters in their loaded box.
 */
export function matchRuneToUserMonsters(rune, userBox) {
  const box = userBox || loadBox();
  const ownedUnits = box?.units || [];
  const setName = rune?.setName || 'Vampire';
  const candidates = SET_CANDIDATES[setName] || SET_CANDIDATES.Violent || [];

  const matched = [];

  for (const cand of candidates) {
    const candNorm = cand.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const owned = ownedUnits.find((u) => {
      const uName = (u.name || u.unit_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const uMaster = (u.masterId || u.unit_master_id || '');
      return uName.includes(candNorm) || candNorm.includes(uName);
    });

    if (owned) {
      matched.push({
        ...cand,
        owned: true,
        level: owned.level || 40,
        stars: owned.stars || 6,
        unitId: owned.id || owned.unit_id,
      });
    } else {
      matched.push({
        ...cand,
        owned: false,
        level: 40,
        stars: 6,
      });
    }
  }

  // Sort owned monsters to the top
  matched.sort((a, b) => (b.owned ? 1 : 0) - (a.owned ? 1 : 0));
  return matched.slice(0, 4);
}

/**
 * Generates instant Guardian-level AI insights for a dropped rune.
 */
export function generateRuneAiInsights(rune, userBox) {
  if (!rune) return null;
  const ev = rune.evaluated || rune;
  const box = userBox || loadBox();
  const matchedMonsters = matchRuneToUserMonsters(ev, box);
  const ownedMatches = matchedMonsters.filter(m => m.owned);

  const slot = ev.slot;
  const setName = ev.setNameTh || ev.setName;
  const hasSpd = ev.hasSpdSub;
  const maxSpd = ev.maxPotentialSpd;
  const isLegend = ev.originalQuality === 5;
  const isHero = ev.originalQuality === 4;

  // Step-by-step upgrade gameplan
  const upgradePlan = [];
  if (hasSpd) {
    upgradePlan.push({
      step: 'ตี +3 (โรลที่ 1)',
      target: `ลุ้นลง SPD (ปัจจุบัน +${ev.currentSpd})`,
      action: `ถ้าติด SPD จะกลายเป็น +${ev.currentSpd + 6} SPD ให้ไปต่อทันที`
    });
    upgradePlan.push({
      step: 'ตี +6 (จุดชี้ขาด)',
      target: 'เช็คโรลที่สอง',
      action: `ถ้ายังคงโรลลง SPD หรือสถิติที่เข้าพวกกัน ให้ไปต่อถึง +9 ถ้าหลุดไปลงสเตตัสแฟลตให้ประเมินหยุด`
    });
    upgradePlan.push({
      step: 'ตี +9 ถึง +12',
      target: `เป้าหมายสูงสุด: +${maxSpd} SPD (ระดับ Guardian)`,
      action: isLegend ? 'รูนระดับตำนาน โรลได้สูงสุด 4 ครั้ง เหมาะแก่การดันสุดหลอด' : 'รูนฮีโร่ โรลได้สูงสุด 3 ครั้ง'
    });
  } else if (ev.mainStat?.nameTh?.includes('SPD')) {
    upgradePlan.push({
      step: 'ช่อง 2 ออปหลัก SPD',
      target: 'ดันถึง +15',
      action: 'ออปหลักสปีดช่อง 2 เป็นที่ต้องการของทุกตัว ตีถึง +15 จะได้ SPD +42 แน่นอน'
    });
  } else {
    upgradePlan.push({
      step: 'ตี +3 และ +6',
      target: 'ดูความเข้ากันของสเตตัส (Synergy)',
      action: 'ลุ้นโรลเปอร์เซ็นต์ (ATK%/HP%/DEF%/CR%) ถ้ากระจายลงสเตตัสแฟลตให้ขายทิ้งเพื่อประหยัดมานา'
    });
  }

  // Grind & Gem suggestions
  const grindAdvice = [];
  const gemAdvice = [];

  const flatSubs = (ev.subs || []).filter(s => s.type === 1 || s.type === 3 || s.type === 5);
  const percentSubs = (ev.subs || []).filter(s => [2, 4, 6, 8, 9, 10, 11, 12].includes(s.type));

  for (const s of percentSubs) {
    if ([2, 4, 6, 8].includes(s.type)) {
      grindAdvice.push(`เจียระไน (Grind) ${s.nameTh} เพิ่มอีก +${s.type === 8 ? '4-5' : '7-10%'}`);
    }
  }

  if (flatSubs.length > 0) {
    gemAdvice.push(`แปลงออป (Gem): แนะนำเอาหินแปลง ${flatSubs[0].nameTh} ออก แล้วใส่ ${hasSpd ? 'HP% หรือ ATK%' : 'SPD (ความเร็ว)'} แทน`);
  } else if (!hasSpd && slot !== 2) {
    gemAdvice.push(`แปลงออป (Gem): ใส่หินแปลง SPD (ความเร็ว) เข้ามาแทนสเตตัสที่ค่าต่ำที่สุด`);
  }

  return {
    runeName: `${setName} ช่อง ${slot}`,
    verdict: ev.recommendationTh,
    badgeColor: ev.badgeColor,
    matchedMonsters,
    ownedCount: ownedMatches.length,
    upgradePlan,
    grindAdvice: grindAdvice.slice(0, 2),
    gemAdvice: gemAdvice.slice(0, 2),
    tacticalTip: ownedMatches.length > 0
      ? `คุณมี ${ownedMatches.map(m => m.thaiName || m.name).join(', ')} ในไอดีของคุณ รูนชิ้นนี้สามารถเสริมความแกร่งให้มอนสเตอร์เหล่านี้ได้ทันที!`
      : `ในเมต้าปัจจุบัน รูนชุดนี้เหมาะกับ ${matchedMonsters.map(m => m.name).join(', ')} ที่สุด`
  };
}

/**
 * Asks Gemini Cloud AI for deep tactical analysis on a rune.
 * Falls back gracefully to local insights if offline or login required.
 */
export async function askDeepAiRuneAdvice(rune, userBox) {
  const box = userBox || loadBox();
  const ev = rune.evaluated || rune;
  const localInsights = generateRuneAiInsights(ev, box);

  try {
    const question = `วิเคราะห์รูนดรอปสดจากดันเจี้ยน:
รูน: ${ev.setNameTh || ev.setName} สล็อต ${ev.slot} (${ev.stars}★ ${ev.qualityName})
ออปหลัก: ${ev.mainStat?.nameTh} +${ev.mainStat?.value}
ออปแฝง: ${ev.innate ? ev.innate.nameTh + ' +' + ev.innate.value : 'ไม่มี'}
ออปชั่นรอง: ${(ev.subs || []).map(s => s.nameTh + ' +' + s.value).join(', ')}
ลุ้นสปีดสูงสุด (Max SPD): +${ev.maxPotentialSpd}
ประสิทธิภาพสูงสุด (Max Eff): ${ev.maxPotentialEff}%
คำแนะนำเบื้องต้น: ${ev.recommendationTh} (${ev.reason})
ไอดีผู้ใช้: ${box.wizard?.name || 'PedictU'} มีมอนสเตอร์ 5-6 ดาวในกล่อง เช่น ${localInsights.matchedMonsters.map(m => m.name + (m.owned ? ' (มีในไอดี)' : '')).join(', ')}

ช่วยวิเคราะห์สั้นๆ กระชับ:
1. ความคุ้มค่าในเมต้าปัจจุบัน (G1-G3)
2. ตัวในกล่องของฉันที่ใส่แล้วเก่งขึ้นทันที 2-3 ตัว
3. สเต็ปการตีบวก +3/+6/+9 และจุดเช็คพอยต์ว่าโรลแบบไหนควรไปต่อหรือควรขาย`;

    const res = await askAdvisor({
      kind: 'chat',
      question,
      context: { source: 'live_farm_rune', rune: ev }
    });

    return {
      aiAnswer: res.answer,
      localInsights,
      success: true,
      model: res.model || 'Gemini Pro'
    };
  } catch (err) {
    // Return local insights if cloud AI is busy or login required
    return {
      aiAnswer: null,
      localInsights,
      fallbackError: err.message,
      success: false
    };
  }
}

/**
 * Analyzes the whole farming session.
 */
export function generateSessionAiSummary(runs, userBox) {
  const totalRuns = runs.length;
  const runesWithEval = runs.filter(r => r.evaluated);
  const keepRunes = runesWithEval.filter(r => r.evaluated.recommendation !== 'SELL_RECOMMENDED');
  const legendRunes = runesWithEval.filter(r => r.evaluated.isLegend6Star);
  const avgClear = totalRuns > 0 ? (runs.reduce((s, r) => s + (Number(r.clearTimeSec) || 0), 0) / totalRuns).toFixed(1) : '0';

  const bestRunes = [...keepRunes].sort((a, b) => {
    const aSpd = a.evaluated.maxPotentialSpd || 0;
    const bSpd = b.evaluated.maxPotentialSpd || 0;
    if (bSpd !== aSpd) return bSpd - aSpd;
    return (b.evaluated.maxPotentialEff || 0) - (a.evaluated.maxPotentialEff || 0);
  }).slice(0, 3);

  const keepRate = totalRuns > 0 ? Math.round((keepRunes.length / totalRuns) * 100) : 0;

  return {
    totalRuns,
    avgClearTime: avgClear,
    keepCount: keepRunes.length,
    sellCount: totalRuns - keepRunes.length,
    legendCount: legendRunes.length,
    keepRate,
    bestRunes,
    coachingTips: [
      `รอบฟาร์มทั้งหมด ${totalRuns} รอบ มีอัตราเก็บรูนอยู่ที่ ${keepRate}% (เฉลี่ยรอบละ ${avgClear}s)`,
      legendRunes.length > 0 ? `🔥 ดรอปรูนระดับตำนาน 6★ ส้ม ทั้งหมด ${legendRunes.length} ชิ้น แนะนำนำไปตีบวกเช็คสปีดก่อนใคร` : `เน้นรูนฮีโร่ 6★ ที่มีซับสปีดลุ้นโรลติด 3 ครั้งเพื่อดึงเข้าเซ็ต`,
      `ประหยัดมานาโดยขายรูนสล็อต 2/4/6 ที่เป็นออปชั่นแฟลต (HP/ATK/DEF หน่วย) ทันที`
    ]
  };
}
