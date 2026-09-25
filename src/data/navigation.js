// Labels are kept short so they fit the 320px drawer without truncation.
// Counts are intentionally not hard-coded here — they drift from the data.
export const NAVIGATION_CATEGORIES = [
  {
    id: 'live-account-suite',
    title: '⚡ ระบบสด & จัดการไอดี (Live SWEX Suite)',
    items: [
      { id: 'ai-account-audit', label: '🤖 AI วินิจฉัยสุขภาพไอดี (Health Check)', icon: 'Sparkles', badge: 'AI' },
      { id: 'live-farm-monitor', label: '📡 ระบบตรวจจับฟาร์มสด (Live Monitor)', icon: 'Radio', badge: 'สด' },
      { id: 'my-box', label: '📦 กล่องมอนสเตอร์ & ตู้สะสม (My Box)', icon: 'Layers', badge: 'หลัก' },
      { id: 'ai-farm-optimizer', label: '⚔️ AI จัดทีม & รูน Abyss (Realtime)', icon: 'Zap', badge: 'AI' },
      { id: 'aegislink', label: '🔌 AegisLink ปลั๊กอินส่งข้อมูลสด', icon: 'Cpu', badge: 'SWEX' },
    ]
  },
  {
    id: 'guild-siege',
    title: 'กิลด์วอร์ & ศึกยึดเกาะ (Siege)',
    items: [
      { id: 'guild-war-room', label: 'ศูนย์บัญชาการกิลด์สด (War Room)', icon: 'Shield', badge: 'สด' },
      { id: '3mdc-search', label: 'ค้นหาทีมแก้ทาง 3MDC', icon: 'Crosshair', badge: 'หลัก' },
      { id: 'where2use', label: 'มอนสเตอร์นี้ใช้ที่ไหน? (Where to Use)', icon: 'Compass' },
      { id: 'defense-trending', label: 'ทีมตั้งรับยอดนิยมทั่วโลก', icon: 'TrendingUp' },
      { id: 'monster-defense-trending', label: 'Tier List มอนสเตอร์ตั้งรับ', icon: 'Shield' },
      { id: 'monster-offense-trending', label: 'Tier List มอนสเตอร์ตัวบุก', icon: 'Swords' },
      { id: 'siege-planner', label: 'จัด 10 ทีมบุก Siege (Deck Builder)', icon: 'Swords', badge: 'ใหม่' },
      { id: 'siege-calculator', label: 'เครื่องคำนวณคะแนน Siege', icon: 'Calculator' },
      { id: 'siege-tournament', label: 'ทัวร์นาเมนต์ Siege ชิงแชมป์โลก', icon: 'Trophy' },
      { id: '3mdc-stats', label: 'ศูนย์สถิติและรายงาน 3MDC', icon: 'BarChart3' },
    ]
  },
  {
    id: 'rta-rankings',
    title: 'เวิลด์อารีน่า & จัดอันดับ (RTA)',
    items: [
      { id: 'arena', label: 'ทีมบุก & ตั้งรับ Arena (AO/AD) + Rush Hour', icon: 'Swords', badge: 'ใหม่' },
      { id: 'player-tracker', label: 'ค้นหาสถิติผู้เล่น (Player Tracker)', icon: 'Search' },
      { id: 'guardian-ladder', label: 'อันดับผู้เล่น Guardian (คนไทย & ทั่วโลก)', icon: 'Award', badge: 'จริง' },
      { id: 'guardian-meta', label: 'เมต้า & คอมโบจากรีเพลย์ Guardian', icon: 'Flame', badge: 'จริง' },
      { id: 'draft-explorer', label: 'จำลองดราฟต์ 5v5', icon: 'Swords' },
      { id: 'rta-synergies', label: 'คอมโบดูโอ้ & ทริโอ้ (Synergies)', icon: 'Users', badge: 'ใหม่' },
      { id: 'meta-dashboard', label: 'เมต้าแดชบอร์ด & การกระจายแรงค์', icon: 'BarChart3' },
      { id: 'rta-tierlist', label: 'RTA Tier List ซีซั่นล่าสุด', icon: 'Trophy', badge: 'S38' },
      { id: 'rta-meta', label: 'สถิติ Pick / Win / Ban', icon: 'BarChart3' },
      { id: 'rta-replays', label: 'รีเพลย์แข่งสดการ์เดียน', icon: 'Flame' },
      { id: 'rta-cutoffs', label: 'คะแนนตัดเกรด G1-G3', icon: 'Gauge' },
      { id: 'siege-leaderboards', label: 'ตารางอันดับกิลด์โลก', icon: 'Award' },
    ]
  },
  {
    id: 'tools-dungeons',
    title: 'เครื่องมือช่วยเล่น & ดันเจี้ยน',
    items: [
      { id: 'ai-farm-optimizer', label: '🤖 AI จัดทีม & รูน Abyss (Realtime)', icon: 'Sparkles', badge: 'AI สด' },
      { id: 'summon-simulator', label: 'ตู้จำลองเปิดคัมภีร์ (Summon Simulator)', icon: 'Sparkles', badge: 'LD 5★' },
      { id: 'tier-list-maker', label: 'สร้าง Tier List ของคุณเอง', icon: 'Trophy' },
      { id: 'artifact-optimizer', label: 'ดาเมจเสริมอาร์ติแฟกต์', icon: 'Flame', badge: 'Hot' },
      { id: 'speed-calculator', label: 'สปีดทิก & จูนความเร็วกันแซง', icon: 'Gauge' },
      { id: 'game-guides', label: 'สารบัญคู่มือกลยุทธ์ดันเจี้ยน', icon: 'BookOpen' },
      { id: 'dungeon-stats', label: 'ทีมฟาร์ม Abyss Hard Speed', icon: 'Compass' },
      { id: 'monster-catalog', label: 'สารานุกรมสกิลมอนสเตอร์', icon: 'BookOpen' },
      { id: 'quiz', label: 'ทายมอนจากสกิล (เกมรายวัน)', icon: 'Sparkles', badge: 'เกม' },
      { id: 'game-codes', label: 'โค้ดแจกไอเทม (Active Codes)', icon: 'Gift', badge: 'ฟรี' },
      { id: 'balance-patch', label: 'ประวัติแพตช์ปรับสมดุล', icon: 'History' },
      { id: 'rune-calculator', label: 'คำนวณประสิทธิภาพรูน & หินขัด', icon: 'Calculator' },
    ]
  },
  {
    id: 'community-account',
    title: 'ชุมชน & ช่วยเหลือผู้เล่น',
    items: [
      { id: 'guild-recruiting', label: 'ประกาศรับสมัครกิลด์', icon: 'UserPlus' },
      { id: 'faq-guides', label: 'คู่มือ & คำถามพบบ่อย (FAQ)', icon: 'HelpCircle' },
    ]
  }
];
