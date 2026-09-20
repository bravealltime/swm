/**
 * Utility for parsing and sanitizing Summoners War promo codes and rewards.
 * Automatically extracts the promo code from WithHive links, SWQ links, or raw text,
 * and formats rewards in standard Thai/English gamer notation.
 */

const REWARD_MAP = [
  { match: /(?:mystical\s*scrolls?|\bms\b|คัมภีร์เวท(?:มนตร์)?)/i, standard: 'คัมภีร์เวทมนตร์ (Mystical Scroll)' },
  { match: /(?:summoning\s*stones?|\bss\b|หินซัมมอน(?:พิเศษ)?)/i, standard: 'หินซัมมอนพิเศษ (Summoning Stones)' },
  { match: /(?:water\s*scrolls?|คัมภีร์ธาตุน้ำ)/i, standard: 'คัมภีร์ธาตุน้ำ (Water Scroll)' },
  { match: /(?:fire\s*scrolls?|คัมภีร์ธาตุไฟ)/i, standard: 'คัมภีร์ธาตุไฟ (Fire Scroll)' },
  { match: /(?:wind\s*scrolls?|คัมภีร์ธาตุลม)/i, standard: 'คัมภีร์ธาตุลม (Wind Scroll)' },
  { match: /(?:(?:light\s*(?:&|and)\s*dark(?:ness)?|ld)\s*scrolls?|คัมภีร์แสงมืด)/i, standard: 'คัมภีร์แสงมืด (Light & Darkness Scroll)' },
  { match: /(?:devilmon|เดวิลมอน)/i, standard: 'เดวิลมอน (Devilmon)' },
  { match: /(?:crystals?|คริสตัล)/i, standard: 'คริสตัล (Crystal)' },
  { match: /(?:energy|พลังงาน)/i, standard: 'พลังงาน (Energy)' },
  { match: /(?:mana(?:\s*stones?)?|หินมานา|มานา)/i, standard: 'หินมานา (Mana Stones)' },
  { match: /(?:rune(?:\s*pieces?)?|ชิ้นส่วนรูน|รูน)/i, standard: 'ชิ้นส่วนรูน 6★ (Rune)' },
  { match: /(?:reapp(?:raisal)?(?:\s*stones?)?|หินหลอม(?:รูน)?)/i, standard: 'หินหลอมรูน (Reappraisal Stone)' },
];

export const QUICK_REWARD_PRESETS = [
  { label: '+ พลังงาน x100', text: 'พลังงาน (Energy) x100' },
  { label: '+ คัมภีร์เวทมนตร์ x5', text: 'คัมภีร์เวทมนตร์ (Mystical Scroll) x5' },
  { label: '+ คัมภีร์เวทมนตร์ x1', text: 'คัมภีร์เวทมนตร์ (Mystical Scroll) x1' },
  { label: '+ หินซัมมอน x40', text: 'หินซัมมอนพิเศษ (Summoning Stones) x40' },
  { label: '+ หินมานา x500,000', text: 'หินมานา (Mana Stones) x500,000' },
  { label: '+ คริสตัล x100', text: 'คริสตัล (Crystal) x100' },
  { label: '+ คัมภีร์ธาตุน้ำ x3', text: 'คัมภีร์ธาตุน้ำ (Water Scroll) x3' },
  { label: '+ เดวิลมอน x1', text: 'เดวิลมอน (Devilmon) x1' },
];

/**
 * Extracts a clean uppercase promo code from a raw string, URL, or deep-link.
 * @param {string} input 
 * @returns {string}
 */
export function extractPromoCode(input) {
  if (!input || typeof input !== 'string') return '';
  const text = input.trim();

  // WithHive official coupon links: http://withhive.me/313/CODE or https://withhive.me/313/CODE
  const hiveMatch = text.match(/(?:https?:\/\/)?(?:www\.)?withhive\.me\/313\/([a-zA-Z0-9_-]+)/i);
  if (hiveMatch) return hiveMatch[1].toUpperCase();

  // SWQ or redirect links: https://swq.jp/l/?s=CODE or ?s=CODE
  const swqMatch = text.match(/(?:https?:\/\/)?(?:www\.)?swq\.jp\/[^\s]*[?&]s=([a-zA-Z0-9_-]+)/i);
  if (swqMatch) return swqMatch[1].toUpperCase();

  // Query parameter e.g. ?code=CODE or &code=CODE
  const paramMatch = text.match(/[?&]code=([a-zA-Z0-9_-]+)/i);
  if (paramMatch) return paramMatch[1].toUpperCase();

  // Path suffix e.g. /313/CODE
  const pathMatch = text.match(/\/313\/([a-zA-Z0-9_-]+)/i);
  if (pathMatch) return pathMatch[1].toUpperCase();

  // If text begins with a code-like token (4-30 chars of letters, digits, underscore, hyphens)
  const tokenMatch = text.match(/^([a-zA-Z0-9_-]{4,35})\b/);
  if (tokenMatch && !tokenMatch[1].toLowerCase().startsWith('http')) {
    return tokenMatch[1].toUpperCase();
  }

  // Fallback: strip URL protocols and paths
  return text
    .replace(/^https?:\/\/(?:www\.)?withhive\.me\/313\/?/i, '')
    .replace(/^https?:\/\/(?:www\.)?swq\.jp\/[^\s]*\?s=/i, '')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .toUpperCase();
}

/**
 * Normalizes reward names into standard Thai display notation.
 * @param {string} text 
 * @returns {string}
 */
export function normalizeRewardText(text) {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text.trim()
    .replace(/^(?:ของรางวัล|รางวัล|rewards?|items?)\s*[:：-]?\s*/i, '')
    .replace(/^[:\-\s,()\[\]{}]+|[:\-\s,()\[\]{}]+$/g, '');

  if (!cleaned) return '';

  // Split by comma (not between digits) or plus / bullets / newlines
  const parts = cleaned.split(/,(?!\d)|[+•\n]+/).map(p => p.trim()).filter(Boolean);
  const normalizedParts = parts.map(part => {
    // Check if contains a count like x100, 100x, 100, x 5
    let count = '';
    const countMatch = part.match(/(?:x\s*([0-9,]+)|([0-9,]+)\s*x|\b([0-9,]{1,10})\b)/i);
    if (countMatch) {
      count = countMatch[1] || countMatch[2] || countMatch[3];
    }

    for (const item of REWARD_MAP) {
      if (item.match.test(part)) {
        return count ? `${item.standard} x${count}` : item.standard;
      }
    }
    return part;
  });

  return normalizedParts.join(', ');
}

/**
 * Parses user input that may contain a promo code link AND accompanying reward text.
 * E.g. "http://withhive.me/313/S38L3GENDLEGGO (Energy x100, 5 Mystical Scrolls)"
 * @param {string} input 
 * @returns {{ code: string, rewardsText: string }}
 */
export function parsePromoInput(input) {
  if (!input || typeof input !== 'string') return { code: '', rewardsText: '' };
  const raw = input.trim();

  // Find URL if present
  const hiveMatch = raw.match(/(?:https?:\/\/)?(?:www\.)?withhive\.me\/313\/([a-zA-Z0-9_-]+)/i);
  const swqMatch = raw.match(/(?:https?:\/\/)?(?:www\.)?swq\.jp\/[^\s]*[?&]s=([a-zA-Z0-9_-]+)/i);

  let code = '';
  let remaining = '';

  if (hiveMatch) {
    code = hiveMatch[1].toUpperCase();
    remaining = raw.replace(hiveMatch[0], '').trim();
  } else if (swqMatch) {
    code = swqMatch[1].toUpperCase();
    remaining = raw.replace(swqMatch[0], '').trim();
  } else {
    // Check for "CODE - REWARDS" or "CODE : REWARDS" or "CODE REWARDS"
    const splitMatch = raw.match(/^([a-zA-Z0-9_-]{4,35})\s*[:\-\—|,\t]\s*(.+)$/s);
    if (splitMatch && !splitMatch[1].toLowerCase().startsWith('http')) {
      code = splitMatch[1].toUpperCase();
      remaining = splitMatch[2].trim();
    } else {
      code = extractPromoCode(raw);
      remaining = '';
    }
  }

  const rewardsText = normalizeRewardText(remaining);
  return { code, rewardsText };
}
