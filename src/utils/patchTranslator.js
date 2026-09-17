// Utility for translating and formatting Summoners War balance patch text into easy Thai

export const CHANGE_TYPE_THAI = {
  'Stat Changed': '⚡ ปรับสเตตัสพื้นฐาน',
  'Skill Change': '🔄 ยกเครื่องสกิลใหม่',
  'Effect and value changed': '⚙️ ปรับกลไกและตัวเลขสกิล',
  'Value changed': '📊 ปรับตัวเลขความแรง/สัดส่วน',
  'Effect changed': '🔄 เปลี่ยนเอฟเฟกต์สกิล',
  'Cooldown Changed': '⏳ ปรับคูลดาวน์สกิล',
  'Damage Increased': '🗡️ บัฟเพิ่มความแรงดาเมจ',
  'Damage Decreased': '🛡️ เนิร์ฟลดความแรงดาเมจ',
  'Percentage changed': '🎯 ปรับเปอร์เซ็นต์โอกาสติด',
  'Effect added': '✨ เพิ่มเอฟเฟกต์ใหม่',
  'Effect removed': '❌ ถอดเอฟเฟกต์เดิมออก',
  'Leader Skill Changed': '👑 ปรับสกิลลีดเดอร์',
  'Awakening Effect Changed': '🌟 ปรับเอฟเฟกต์ปลุกพลัง',
  'Skill Fixed': '🛠️ แก้ไขบั๊กสกิล',
  'Skill Description Changed': '📝 ปรับคำอธิบายสกิลให้ชัดเจน',
  'Skill AI Improved': '🤖 ปรับปรุง AI การใช้สกิล',
  'Skill Improved': '🚀 เพิ่มประสิทธิภาพสกิล'
};

export function getChangeTypeThai(type) {
  return CHANGE_TYPE_THAI[type] || type || 'ปรับสมดุล';
}

export function translatePatchSnippet(raw) {
  if (!raw) return '';
  let t = raw.trim();

  // Strip prefix bracket tags
  t = t.replace(/^\[(Percentage changed|Value changed|Effect changed|Effect added|Cooldown Changed|Stat Changed|Skill Change)\]\s*/i, '');

  // 1. High-frequency full phrase replacements
  t = t.replace(/Fixed an issue where the buff image for Increase ATK granted on yourself after attacking was not displayed during the skill camera animation\./gi, 
    'แก้ไขบั๊ก: ภาพไอคอนบัฟเพิ่มพลังโจมตี (ATK Buff) ที่มอบให้ตัวเองหลังโจมตีไม่แสดงผลในระหว่างมุมกล้องอนิเมชั่นสกิล');

  t = t.replace(/Fixed an issue where/gi, 'แก้ไขข้อผิดพลาดที่');

  t = t.replace(/The increase in the damage dealt according to your Critical Rate is decreased by (\d+)%/gi, 
    'โบนัสดาเมจที่คำนวณตามอัตราคริติคอล (CRIT Rate) ถูกเนิร์ฟลดลง $1%');

  t = t.replace(/The increase in damage dealt to enemies is limited to (\d+)%/gi, 
    'จำกัดเพดานโบนัสดาเมจสูงสุดที่ทำได้กับศัตรูไม่เกิน $1%');

  t = t.replace(/Deals additional damage equal to (\d+)%\s*➔\s*(\d+)% of your HP lost/gi, 
    'สร้างดาเมจเสริมตามสัดส่วน HP ที่สูญเสียไป: ปรับเพิ่มจาก $1% ➔ เป็น $2%');

  t = t.replace(/Decreases the Attack Speed of all enemies for (\d+) turns? with a (\d+)%?\s*➔\s*(\d+)% chance/gi, 
    'ลดความเร็วโจมตี (Slow SPD) ศัตรูทั้งหมด $1 เทิร์น: โอกาสติดปรับลดจาก $2% ➔ เหลือ $3%');

  t = t.replace(/Increases your Attack Bar by (\d+)%\s*➔\s*(\d+)% whenever an ally, excluding yourself, gets attacked/gi, 
    'เพิ่มเกจโจมตีตัวเองเมื่อเพื่อนร่วมทีม (ยกเว้นตัวเอง) ถูกโจมตี: ปรับลดจาก $1% ➔ เหลือ $2%');

  t = t.replace(/Increases your Attack Bar by (\d+)%\s*➔\s*(\d+)% whenever you are attacked by the enemy/gi, 
    'เพิ่มเกจโจมตีตัวเองเมื่อตัวเองถูกศัตรูโจมตี: ปรับลดจาก $1% ➔ เหลือ $2%');

  t = t.replace(/Increases your Attack Bar by (\d+)%\s*➔\s*(\d+)% whenever your attack lands as a Critical Hit/gi, 
    'เพิ่มเกจโจมตีตัวเองเมื่อโจมตีติดคริติคอล: ปรับลดจาก $1% ➔ เหลือ $2%');

  t = t.replace(/Decreases the cooldown of your skills by 1 turn\s*➔\s*Increases your Attack Bar by (\d+)% whenever an ally falls under an inability effect/gi, 
    'เปลี่ยนกลไก: จากเดิม [ลดคูลดาวน์สกิล 1 เทิร์น] ➔ เปลี่ยนเป็น [เพิ่มเกจโจมตีตัวเอง $1%] เมื่อเพื่อนในทีมติดสถานะควบคุม (สตัน/แช่/หลับ)');

  t = t.replace(/Before Awakening:\s*(\d+)\s*➔\s*After Awakening:\s*(\d+)/gi, 'ความเร็วโจมตีก่อนตื่น: $1 ➔ หลังตื่น: $2');
  t = t.replace(/\(Unawakened\)\s*Attack Speed\s*(\d+)\s*➔\s*(\d+)/gi, '(ก่อนตื่น) ความเร็วโจมตี $1 ➔ $2');
  t = t.replace(/\(Awakened\)\s*Attack Speed\s*(\d+)\s*➔\s*(\d+)/gi, '(หลังตื่น) ความเร็วโจมตี $1 ➔ $2');

  t = t.replace(/Increases your Attack Bar by (\d+)% and counterattacks the attacker with a critical hit when you are attacked with a critical hit\. You won't get defeated with critical hit attacks\./gi,
    'เพิ่มเกจโจมตีตัวเอง $1% และสวนกลับศัตรูด้วยการติดคริติคอลเมื่อถูกโจมตีติดคริติคอล (ไม่มีวันตายจากการโจมตีติดคริติคอล)');

  t = t.replace(/Increases your Attack Bar by (\d+)% and counterattacks the attacker with a 100% Critical Rate when you are attacked with a Critical Hit\. You won't get defeated with Critical Hit attacks\./gi,
    'เพิ่มเกจโจมตีตัวเอง $1% และสวนกลับศัตรูด้วยอัตราคริติคอล 100% ทันทีเมื่อถูกโจมตีติดคริติคอล (ไม่มีวันตายจากการโจมตีติดคริติคอล)');

  // 2. Vocabulary translations
  t = t.replace(/\bAttack Bar\b/gi, 'เกจโจมตี (ATB)');
  t = t.replace(/\bAttack Speed\b/gi, 'ความเร็วโจมตี (SPD)');
  t = t.replace(/\bAttack Power\b/gi, 'พลังโจมตี (ATK)');
  t = t.replace(/\bCritical Rate\b/gi, 'อัตราคริติคอล (CRIT Rate)');
  t = t.replace(/\bCritical Damage\b/gi, 'ความแรงคริติคอล (CRIT DMG)');
  t = t.replace(/\bCritical Hit\b/gi, 'ติดคริติคอล');
  t = t.replace(/\bcritical hit\b/gi, 'ติดคริติคอล');
  t = t.replace(/\bContinuous Damage\b/gi, 'ดาเมจต่อเนื่อง (Dot)');
  t = t.replace(/\bDecreases the cooldown of the skill by (\d+) turn\b/gi, 'ลดคูลดาวน์สกิลลง $1 เทิร์น');
  t = t.replace(/\bIncreases the cooldown of the skill by (\d+) turn\b/gi, 'เพิ่มคูลดาวน์สกิลขึ้น $1 เทิร์น');
  t = t.replace(/\bDecreases the cooldown by (\d+) turn\b/gi, 'ลดคูลดาวน์ลง $1 เทิร์น');
  t = t.replace(/\bCooltime decreased by (\d+) turn\b/gi, 'ลดคูลดาวน์ลง $1 เทิร์น (ออกสกิลได้เร็วขึ้น)');
  t = t.replace(/\bCooltime increased by (\d+) turn\b/gi, 'เพิ่มคูลดาวน์ขึ้น $1 เทิร์น');
  t = t.replace(/\bDamage increased by (\d+)%\b/gi, 'เพิ่มความแรงดาเมจขึ้น $1%');
  t = t.replace(/\bDamage decreased by (\d+)%\b/gi, 'ลดความแรงดาเมจลง $1%');
  t = t.replace(/\bIncreases damage by (\d+)%\b/gi, 'เพิ่มดาเมจขึ้น $1%');
  t = t.replace(/\bDecreases damage by (\d+)%\b/gi, 'ลดดาเมจลง $1%');
  t = t.replace(/\bRemoves all beneficial effects\b/gi, 'ลบล้างบัฟทั้งหมดของเป้าหมาย');
  t = t.replace(/\bRemoves all harmful effects\b/gi, 'ลบล้างดีบัฟทั้งหมดของทีม');
  t = t.replace(/\bRecovers the HP of all allies by (\d+)%\b/gi, 'ฟื้นฟู HP เพื่อนร่วมทีมทั้งหมด $1%');
  t = t.replace(/\bRecovers your HP by (\d+)%\b/gi, 'ฟื้นฟู HP ตัวเอง $1%');
  t = t.replace(/\bAutomatic Effect\b/gi, 'เอฟเฟกต์ทำงานอัตโนมัติ (Passive)');
  t = t.replace(/\bwith a (\d+)% chance\b/gi, 'ด้วยโอกาสติด $1%');
  t = t.replace(/\bfor (\d+) turns?\b/gi, 'เป็นเวลา $1 เทิร์น');
  t = t.replace(/\bDefense is decreased\b/gi, 'ลดพลังป้องกัน (เกราะแตก)');
  t = t.replace(/\bDecreases Defense\b/gi, 'ลดพลังป้องกัน (เกราะแตก)');
  t = t.replace(/\bStuns the enemy\b/gi, 'สตันศัตรู (มึนงง)');
  t = t.replace(/\bFreezes the enemy\b/gi, 'แช่แข็งศัตรู');
  t = t.replace(/\bSleeps the enemy\b/gi, 'ทำให้ศัตรูหลับ');
  t = t.replace(/\bOblivion\b/gi, 'ลบล้างพาสซีฟ (Oblivion)');
  t = t.replace(/\bImmunity\b/gi, 'ภูมิคุ้มกัน (กันดีบัฟ)');
  t = t.replace(/\bInvincible\b/gi, 'อมตะ (Invincible)');

  return t;
}

// Parses Before and After changes cleanly
export function parsePatchCard(previewText, officialText) {
  const raw = (previewText || officialText || '').trim();

  // Pattern 1: (As-is) ... ➔ (To-be) ...
  const asIsToBeMatch = raw.match(/\(As-is\)([\s\S]*?)[➔\->]+\s*\(To-be\)([\s\S]*)/i);
  if (asIsToBeMatch) {
    const beforeRaw = asIsToBeMatch[1].trim();
    const afterRaw = asIsToBeMatch[2].trim();
    return {
      isSplit: true,
      before: translatePatchSnippet(beforeRaw),
      after: translatePatchSnippet(afterRaw),
      beforeRaw,
      afterRaw,
      fullTranslated: `เดิม: ${translatePatchSnippet(beforeRaw)}\nใหม่: ${translatePatchSnippet(afterRaw)}`
    };
  }

  // Check if it's an arrow string that wasn't already handled by full phrase replacement
  const fullTranslated = translatePatchSnippet(raw);

  if (fullTranslated.includes('➔')) {
    const parts = fullTranslated.split('➔');
    if (parts.length === 2) {
      return {
        isSplit: true,
        before: parts[0].trim(),
        after: parts[1].trim(),
        beforeRaw: raw.split('➔')[0]?.trim() || '',
        afterRaw: raw.split('➔')[1]?.trim() || '',
        fullTranslated
      };
    }
  }

  return {
    isSplit: false,
    before: null,
    after: null,
    beforeRaw: null,
    afterRaw: null,
    fullTranslated,
    raw
  };
}
