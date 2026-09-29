/**
 * SWM Membership & Access Control Policy
 *
 * 100% Free Public Features (Traffic & SEO Drivers):
 * 1. สารานุกรมมอนสเตอร์ 940 ตัว + ข้อมูลสกิลไทย (monster-catalog)
 * 2. หน้าแจกโค้ด (Codes) + ระบบกดรับไอเทมออโต้ (game-codes)
 * 3. ประวัติ Balance Patch + คำแปลไทย (balance-patch)
 * 4. ระบบนำเข้ากล่อง SWEX พื้นฐาน: ดูมอนสเตอร์, นับ Nat5, คำนวณรูนช่อง 2/4/6 (my-box)
 * 5. ค้นหาสูตร 3MDC ทั่วไป (3mdc-search)
 * 6. AI โค้ชถามได้ ฟรี 3 คำถาม/วัน (dashboard)
 *
 * All other features are VIP Member exclusives (Siege War Room, Live Monitor, RTA Analytics, 5v5 Draft, etc.).
 */

export const FREE_VIEW_IDS = new Set([
  'dashboard',
  '',
  'monster-catalog',
  'monsters',
  'monster',
  'catalog',
  'game-codes',
  'promo-codes',
  'codes',
  'balance-patch',
  'balance-patches',
  'balance',
  'my-box',
  'box',
  '3mdc-search',
  '3mdc',
  'faq-guides',
  'faq',
  'quiz',
]);

/**
 * Checks if a view is 100% free to public visitors.
 * @param {string} viewId
 * @returns {boolean}
 */
export function isFreeView(viewId) {
  if (!viewId) return true;
  const cleanId = String(viewId).toLowerCase().replace(/^\//, '').split('?')[0].trim();
  return FREE_VIEW_IDS.has(cleanId);
}

/**
 * Checks if the current user has active VIP / Member access.
 * Admins always have full VIP access.
 * @param {object|null} user
 * @param {boolean} [isAdmin=false]
 * @returns {boolean}
 */
export function isUserMember(user, isAdmin = false) {
  if (isAdmin) return true;

  // Check localStorage override with expiry support
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('swm:vip-member') === '1') {
      const exp = localStorage.getItem('swm:vip-expires');
      if (exp) {
        const expTime = new Date(exp).getTime();
        if (!Number.isNaN(expTime) && expTime < Date.now()) {
          localStorage.removeItem('swm:vip-member');
          localStorage.removeItem('swm:vip-expires');
        } else {
          return true;
        }
      } else {
        return true;
      }
    }
  } catch {}

  if (!user) return false;
  const meta = user.user_metadata || {};

  // Check expiration if set in user metadata
  if (meta.vip_expires_at) {
    const expTime = new Date(meta.vip_expires_at).getTime();
    if (!Number.isNaN(expTime) && expTime < Date.now()) {
      return false; // VIP expired!
    }
  }

  if (['admin', 'vip', 'pro'].includes(meta.role) || ['vip', 'pro', 'guild', 'lifetime'].includes(meta.tier) || ['vip', 'pro'].includes(meta.plan)) {
    return true;
  }
  if (meta.is_vip || meta.is_pro || meta.is_member) {
    return true;
  }

  return false;
}

/**
 * Returns comprehensive VIP status details including expiration, remaining days, and display label.
 * @param {object|null} user
 * @param {boolean} [isAdmin=false]
 * @returns {object}
 */
export function getVipStatusInfo(user, isAdmin = false) {
  if (isAdmin) {
    return {
      isVip: true,
      isAdmin: true,
      tier: 'admin',
      isLifetime: true,
      daysLeft: 9999,
      isExpiringSoon: false,
      isExpired: false,
      isTrial: false,
      label: 'ผู้ดูแลระบบ (Admin)',
      badgeText: 'Admin',
    };
  }

  let localExp = null;
  try {
    if (typeof localStorage !== 'undefined') {
      localExp = localStorage.getItem('swm:vip-expires');
    }
  } catch {}

  const meta = user?.user_metadata || {};
  const expiresAt = meta.vip_expires_at || localExp || null;

  if (expiresAt) {
    const expTime = new Date(expiresAt).getTime();
    if (!Number.isNaN(expTime)) {
      if (expTime < Date.now()) {
        return {
          isVip: false,
          isAdmin: false,
          isExpired: true,
          tier: 'free',
          daysLeft: 0,
          isExpiringSoon: false,
          isLifetime: false,
          isTrial: Boolean(meta.vip_trial),
          expiresAt,
          label: 'VIP หมดอายุแล้ว',
          badgeText: 'VIP หมดอายุ',
        };
      }
      const diffMs = expTime - Date.now();
      const daysLeft = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const isExpiringSoon = daysLeft <= 3;
      const isTrial = Boolean(meta.vip_trial);
      return {
        isVip: true,
        isAdmin: false,
        isExpired: false,
        tier: meta.tier || 'vip',
        daysLeft,
        isExpiringSoon,
        isLifetime: false,
        isTrial,
        expiresAt,
        label: isTrial ? `VIP ทดลองใช้ (เหลือ ${daysLeft} วัน)` : `VIP สมาชิก (เหลือ ${daysLeft} วัน)`,
        badgeText: `${daysLeft} วัน`,
      };
    }
  }

  const isVip = isUserMember(user, isAdmin);
  if (isVip) {
    return {
      isVip: true,
      isAdmin: false,
      isExpired: false,
      tier: meta.tier || 'vip',
      daysLeft: 9999,
      isExpiringSoon: false,
      isLifetime: true,
      isTrial: false,
      expiresAt: null,
      label: 'VIP ตลอดชีพ (Lifetime)',
      badgeText: 'VIP',
    };
  }

  return {
    isVip: false,
    isAdmin: false,
    isExpired: false,
    tier: 'free',
    daysLeft: 0,
    isExpiringSoon: false,
    isLifetime: false,
    isTrial: false,
    expiresAt: null,
    label: 'สมาชิกทั่วไป (Free)',
    badgeText: 'VIP',
  };
}

/**
 * Checks if a view should be locked for the current visitor.
 * @param {string} viewId
 * @param {boolean} isMember
 * @returns {boolean}
 */
export function isViewLocked(viewId, isMember = false) {
  if (isMember) return false;
  return !isFreeView(viewId);
}

/**
 * Filters navigation items according to membership status.
 * If user is not a member, hides non-free items.
 * @param {Array} categories
 * @param {boolean} isMember
 * @returns {Array}
 */
export function filterNavigationCategories(categories, isMember = false) {
  if (isMember) return categories;

  return categories
    .map((cat) => {
      const freeItems = (cat.items || []).filter((item) => {
        // Map item id to view id
        const vId = item.id.replace(/-search$/, '');
        return isFreeView(item.id) || isFreeView(vId);
      });
      return {
        ...cat,
        items: freeItems,
      };
    })
    .filter((cat) => cat.items.length > 0);
}

/**
 * VIP Membership Plans & Benefits description
 */
export const VIP_PLANS = [
  {
    id: 'monthly',
    name: 'SWM VIP Member',
    badge: '👑 ยอดนิยม',
    price: 99,
    period: 'เดือน',
    desc: 'ปลดล็อกเครื่องมือระดับแข่งขัน RTA, กิลด์วอร์, และระบบฟาร์มสด Realtime',
    features: [
      '📡 ปลดล็อกจอตรวจจับฟาร์มสด (Live Farm Monitor)',
      '🏰 ศูนย์บัญชาการกิลด์ & จัด 10 ทีมบุก Siege (Deck Builder)',
      '⚔️ สถิติ RTA สด, จำลองดราฟต์ 5v5 & รีเพลย์ Guardian',
      '🤖 AI Coach ถามได้ไม่จำกัด (Unlimited Quota)',
      '🎴 ดาวน์โหลดการ์ดเกมสะสม TCG ทุกแบบ (LD5 Showcase, Passport, Milestone) ไร้ลายน้ำ',
      '🔮 เครื่องมือเจาะลึก: Speed Tuner, Artifact True Damage & Rune Reapp',
    ],
  },
  {
    id: 'guild',
    name: 'Guild Master & Pro',
    badge: '⚔️ แนะนำสำหรับกิลด์',
    price: 249,
    period: 'เดือน',
    desc: 'สิทธิ์ระดับสูงสำหรับหัวหน้ากิลด์และนักแข่งทัวร์นาเมนต์',
    features: [
      '✨ สิทธิ์ทุกอย่างของแพ็กเกจ VIP Member',
      '🛡️ ระบบ War Room ควบคุมสงคราม Siege สดสำหรับสมาชิกในกิลด์ทั้ง 30 คน',
      '👑 ตราสัญลักษณ์กิลด์พิเศษบนการ์ด TCG ทุกใบ',
      '⚡ ซัพพอร์ตการใช้งานและอัปเดตเมต้าประจำสัปดาห์ก่อนใคร',
    ],
  },
];
