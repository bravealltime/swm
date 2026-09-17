import React, { useState } from 'react';
import { 
  Gift, 
  Copy, 
  Check, 
  ExternalLink, 
  ThumbsUp, 
  ThumbsDown, 
  Plus, 
  HelpCircle, 
  Clock,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';
import { PROMO_CODES } from '../data/promoCodes';

export default function PromoCodesView() {
  const [codes, setCodes] = useState(PROMO_CODES);
  const [copiedCode, setCopiedCode] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCodeInput, setNewCodeInput] = useState('');
  const [newRewardInput, setNewRewardInput] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`คัดลอกโค้ด "${code}" เรียบร้อยแล้ว!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleVote = (codeId, type) => {
    setCodes(prev => prev.map(c => {
      if (c.id === codeId) {
        return {
          ...c,
          upvotes: type === 'up' ? c.upvotes + 1 : c.upvotes,
          downvotes: type === 'down' ? c.downvotes + 1 : c.downvotes
        };
      }
      return c;
    }));
    showToast('ขอบคุณสำหรับการร่วมโหวตสถานะโค้ด!');
  };

  const handleAddCode = (e) => {
    e.preventDefault();
    if (!newCodeInput.trim()) return;

    const newEntry = {
      id: `code-${Date.now()}`,
      code: newCodeInput.trim().toUpperCase(),
      dateAdded: 'วันนี้',
      expiry: 'มีผลใช้งานอยู่',
      status: 'active',
      upvotes: 1,
      downvotes: 0,
      rewards: [
        { 
          name: newRewardInput.trim() || 'ของขวัญพิเศษ (Gift)', 
          amount: '1', 
          imageUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/summoners_war_query_jp/scroll_mystical.png' 
        }
      ],
      redeemUrl: `http://withhive.me/313/${newCodeInput.trim().toUpperCase()}`
    };

    setCodes([newEntry, ...codes]);
    setNewCodeInput('');
    setNewRewardInput('');
    setShowAddModal(false);
    showToast(`เพิ่มโค้ด "${newEntry.code}" สำเร็จแล้ว!`);
  };

  return (
    <div className="space-y-6 pb-12 relative">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3.5 rounded-xl bg-blue-600 text-white shadow-xl text-sm font-bold animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
            <Gift className="w-4 h-4" />
            Summoners War - Official Promo Codes
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            ศูนย์รวมโค้ดแจกไอเทมฟรี (ภาษาไทย)
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            รวบรวมโค้ดแจก คัมภีร์เวทมนตร์, หินซัมมอน, รูน, พลังงาน และมานา ที่ยังใช้งานได้อยู่ กดปุ่มเพื่อคัดลอกหรือเปิดหน้ารับของรางวัลผ่าน Hive ID ได้ทันที
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          แชร์โค้ดใหม่
        </button>
      </div>

      {/* Codes Table / Cards */}
      <div className="bg-[#101724] border border-[#1d2b3f] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-[#1d2b3f] flex items-center justify-between bg-[#0b1019]">
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-bold text-white">โค้ดที่ยังใช้งานได้</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-600/20 text-emerald-300 text-xs font-mono font-bold border border-emerald-500/30">
              {codes.length} โค้ด
            </span>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-400" />
            ตรวจสอบล่าสุด: วันนี้
          </span>
        </div>

        <div className="divide-y divide-[#1d2b3f]">
          {codes.map((item) => (
            <div 
              key={item.id}
              className="p-4 sm:p-5 hover:bg-[#131d2c] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Code & Copy */}
              <div className="space-y-1 min-w-[240px]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-lg sm:text-xl font-black text-emerald-400 tracking-wider">
                    {item.code}
                  </span>
                  <button
                    onClick={() => handleCopy(item.code)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      copiedCode === item.code
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#182333] text-slate-200 hover:bg-[#24334a]'
                    }`}
                    title="คัดลอกโค้ด"
                  >
                    {copiedCode === item.code ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === item.code ? 'ก็อปแล้ว' : 'คัดลอก'}</span>
                  </button>
                </div>
                <div className="text-xs text-slate-400">
                  เพิ่มเมื่อ: <strong className="text-slate-200">{item.dateAdded}</strong>
                </div>
              </div>

              {/* Reward item badges */}
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                {item.rewards.map((reward, rIdx) => (
                  <div
                    key={rIdx}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0c121c] border border-[#1f2c3f] text-xs sm:text-sm font-semibold text-slate-200"
                  >
                    {reward.imageUrl && (
                      <img 
                        src={reward.imageUrl} 
                        alt={reward.name} 
                        className="w-5 h-5 object-contain"
                      />
                    )}
                    <span>{reward.name}</span>
                    <span className="font-mono font-black text-emerald-400">x{reward.amount}</span>
                  </div>
                ))}
              </div>

              {/* Actions: Redeem & Community Votes */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1 bg-[#0c121c] border border-[#1f2c3f] rounded-xl p-1">
                  <button
                    onClick={() => handleVote(item.id, 'up')}
                    className="px-2.5 py-1 rounded-lg hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-emerald-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="ใช้ได้จริง"
                  >
                    <ThumbsUp className="w-4 h-4 text-emerald-400" />
                    <span>{item.upvotes}</span>
                  </button>
                  <button
                    onClick={() => handleVote(item.id, 'down')}
                    className="px-2.5 py-1 rounded-lg hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-red-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="หมดอายุแล้ว"
                  >
                    <ThumbsDown className="w-4 h-4 text-red-400" />
                    <span>{item.downvotes}</span>
                  </button>
                </div>

                <a
                  href={item.redeemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>รับทันที</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Guide Section */}
      <div className="bg-[#101724] p-5 sm:p-6 rounded-2xl border border-[#1d2b3f] space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-400" />
          วิธีเติมโค้ดเกม Summoners War สำหรับผู้เล่นไทย
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm text-slate-300">
          <div className="p-4 rounded-xl bg-[#0c121c] border border-[#1f2c3f] space-y-1.5">
            <div className="font-bold text-blue-400">สำหรับ iOS (iPhone / iPad)</div>
            <p className="text-slate-400 leading-relaxed">
              กดปุ่ม <strong>"รับทันที"</strong> ระบบจะเปิด Safari ไปยังลิงก์ทางการของ Hive จากนั้นกด <strong>"Open"</strong> เพื่อให้เกมเปิดและส่งของขวัญเข้ากล่องจดหมายในเกมโดยอัตโนมัติ
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#0c121c] border border-[#1f2c3f] space-y-1.5">
            <div className="font-bold text-emerald-400">สำหรับ Android</div>
            <p className="text-slate-400 leading-relaxed">
              กดปุ่ม <strong>"รับทันที"</strong> หรือเปิดเกม เข้าแท็บ <strong>กิจกรรม (Event)</strong> &gt; เลื่อนลงล่างสุด &gt; เลือก <strong>กรอกโค้ดโปรโมชัน</strong> แล้ววางโค้ดที่คัดลอกได้เลย
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#0c121c] border border-[#1f2c3f] space-y-1.5">
            <div className="font-bold text-purple-400">สำหรับ PC (Steam / Google Play)</div>
            <p className="text-slate-400 leading-relaxed">
              เข้าที่หน้าเว็บรับของทางการของ WithHive เลือกเซิร์ฟเวอร์ที่เล่น และกรอกชื่อบัญชี Hive ID พร้อมรหัสโค้ดเพื่อรับของ
            </p>
          </div>
        </div>
      </div>

      {/* Add Code Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#101724] border border-[#1d2b3f] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1d2b3f]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-emerald-400" />
                แชร์โค้ดแจกไอเทมใหม่
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  รหัสโค้ด (Code):
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#0c121c] border border-[#1d2b3f] rounded-xl px-3.5 py-2.5 text-base text-white uppercase placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono font-bold"
                  placeholder="เช่น SW2026SPECIAL"
                  value={newCodeInput}
                  onChange={(e) => setNewCodeInput(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  ของรางวัล (เช่น คัมภีร์เวทมนตร์ x5, พลังงาน x200):
                </label>
                <input
                  type="text"
                  className="w-full bg-[#0c121c] border border-[#1d2b3f] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder="เช่น คัมภีร์เวทมนตร์ 3 ใบ"
                  value={newRewardInput}
                  onChange={(e) => setNewRewardInput(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm"
                >
                  บันทึกโค้ด
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
