export const NAVIGATION_CATEGORIES = [
  {
    id: '3mdc',
    title: 'ระบบแก้ทาง 3MDC (Siege & Guild War)',
    items: [
      { id: '3mdc-search', label: 'ค้นหาตัวแก้ทาง (3MDC Search)', icon: 'Crosshair', badge: 'สำคัญสุด' },
      { id: '3mdc-trending', label: 'ทีมตั้งรับยอดนิยม (Trending Defenses)', icon: 'Flame', badge: '20 ทีม' },
      { id: '3mdc-statistics', label: 'สถิติการชนะ (Winrate Stats)', icon: 'BarChart3' },
    ]
  },
  {
    id: 'meta-analytics',
    title: 'สถิติเซิร์ฟเวอร์รวม (All Server Analytics)',
    items: [
      { id: 'defense-trending', label: '96 ทีมตั้งรับยอดนิยมทั่วโลก', icon: 'TrendingUp', badge: '96 ทีม' },
      { id: 'monster-defense-trending', label: 'มอนสเตอร์ตั้งรับยอดฮิต (202 ตัว)', icon: 'Shield' },
      { id: 'monster-offense-trending', label: 'มอนสเตอร์ตัวตียอดฮิต (247 ตัว)', icon: 'Swords' },
    ]
  },
  {
    id: 'rta',
    title: 'วิเคราะห์เวิลด์อารีน่า (RTA SWRT Ranking)',
    items: [
      { id: 'rta-tierlist', label: '🏆 RTA Tier List (S38 ซีซั่นล่าสุด)', icon: 'Trophy', badge: 'S38 Meta' },
      { id: 'rta-meta', label: '📊 สถิติ Pick/Win/Ban 300 ตัว', icon: 'BarChart3', badge: '6.8M แมตช์' },
      { id: 'rta-replays', label: '⚔️ รีเพลย์แข่งสดการ์เดียน (Live Replays)', icon: 'Flame', badge: 'สด' },
      { id: 'rta-cutoffs', label: '🎯 คะแนนตัดเกรด G1-G3 (Rank Cutoffs)', icon: 'Gauge' },
    ]
  },
  {
    id: 'tools',
    title: 'เครื่องมือช่วยเล่น (Game Tools & Dungeons)',
    items: [
      { id: 'game-codes', label: 'รหัสโค้ดแจกไอเทม (Active Codes)', icon: 'Gift', badge: 'ของแท้' },
      { id: 'dungeon-stats', label: 'ทีมฟาร์มดันเจี้ยน (Abyss Speed)', icon: 'Compass', badge: 'Abyss Hard' },
      { id: 'balance-patch', label: 'ประวัติแพตช์ปรับสมดุล (92 แพตช์)', icon: 'History', badge: '92 แพตช์' },
      { id: 'speed-calculator', label: 'เครื่องคำนวณ Speed Tick', icon: 'Gauge' },
      { id: 'monster-catalog', label: 'สารานุกรมสกิลมอนสเตอร์ (Skills & Stats)', icon: 'BookOpen', badge: 'ครบทุกตัว' },
      { id: 'artifact-optimizer', label: '💥 ดาเมจเสริมอาร์ติแฟกต์ (Optimizer)', icon: 'Flame', badge: 'NEW 7.8' },
      { id: 'rune-calculator', label: 'คำนวณประสิทธิภาพรูน & หินขัด', icon: 'Calculator' },
    ]
  },
  {
    id: 'guild',
    title: 'ระบบกิลด์ (Guild Hub)',
    items: [
      { id: 'guild-recruiting', label: 'ประกาศรับสมัครกิลด์ (120 กิลด์)', icon: 'UserPlus', badge: '120 กิลด์' },
      { id: 'siege-leaderboards', label: 'ตารางอันดับ Siege (Leaderboard)', icon: 'Trophy', badge: 'เรียลไทม์' },
      { id: 'faq-guides', label: 'คู่มือ & คำถามพบบ่อย (FAQ/SWEX)', icon: 'HelpCircle' },
    ]
  },
  {
    id: 'account',
    title: 'เชื่อมต่อไอดี (SWEX Integration)',
    items: [
      { id: 'aegislink', label: '🛡️ AegisLink ปลั๊กอินส่งข้อมูลสด', icon: 'Cpu', badge: 'v1.0 ใหม่' },
      { id: 'account-summary', label: 'ภาพรวมระบบ SWGT', icon: 'UserCheck' },
    ]
  }
];
