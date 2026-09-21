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
  CheckCircle2
} from 'lucide-react';
import { PROMO_CODES } from '../data/promoCodes';
import { useLocalSet } from '../hooks/useLocalStorage';
import { useLiveData } from '../hooks/useLiveData';
import { submitPromoCode } from '../services/liveData';
import { extractPromoCode, normalizeRewardText, parsePromoInput, QUICK_REWARD_PRESETS } from '../utils/promoCodeParser';

// The live list is admin-curated (visitor submissions are approved in the back-office); the
// bundled PROMO_CODES only show until the first live version arrives.
const pickCodes = (doc) => (Array.isArray(doc?.codes) ? doc.codes : null);

export default function PromoCodesView() {
  const live = useLiveData('codes', PROMO_CODES, { pick: pickCodes });
  // local up/down votes on top of the live list (votes stay on this device)
  const [voteDelta, setVoteDelta] = useState({});
  const codes = live.data.map((c) => ({ ...c, upvotes: (c.upvotes || 0) + (voteDelta[c.id]?.up || 0), downvotes: (c.downvotes || 0) + (voteDelta[c.id]?.down || 0) }));
  const [submitting, setSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCodeInput, setNewCodeInput] = useState('');
  const [newRewardInput, setNewRewardInput] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  // Which codes this device has already redeemed (persisted locally)
  const redeemed = useLocalSet('swm:redeemed-codes');
  const pendingCodes = codes.filter((c) => !redeemed.has(c.code));

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

  const handleCopyAllPending = () => {
    if (!pendingCodes.length) return;
    navigator.clipboard.writeText(pendingCodes.map((c) => c.code).join(String.fromCharCode(10)));
    showToast(`คัดลอก ${pendingCodes.length} โค้ดที่ยังไม่ได้รับแล้ว (คั่นบรรทัด)`);
  };

  const handleVote = (codeId, type) => {
    setVoteDelta((d) => ({ ...d, [codeId]: { ...(d[codeId] || {}), [type]: ((d[codeId] || {})[type] || 0) + 1 } }));
    showToast('ขอบคุณสำหรับการร่วมโหวตสถานะโค้ด!');
  };

  // A submitted code goes to the moderation queue; it appears for everyone once an admin approves it
  const handleAddCode = async (e) => {
    e.preventDefault();
    const code = extractPromoCode(newCodeInput);
    if (!code || submitting) return;
    setSubmitting(true);
    const cleanRewards = normalizeRewardText(newRewardInput) || newRewardInput.trim();
    try {
      const res = await submitPromoCode(code, cleanRewards);
      setNewCodeInput('');
      setNewRewardInput('');
      setShowAddModal(false);
      showToast(res.live ? `โค้ด "${code}" อยู่ในรายการแล้ว` : res.duplicate ? `โค้ด "${code}" มีคนส่งมาแล้ว กำลังรอตรวจ` : `ส่งโค้ด "${code}" แล้ว — จะขึ้นให้ทุกคนเห็นทันทีที่ตรวจเสร็จ ขอบคุณ!`);
    } catch (err) {
      showToast(err.message || 'ส่งโค้ดไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCodeInputChange = (val) => {
    if (val.includes('/') || val.includes(':') || val.includes('-') || val.includes('withhive') || val.includes('swq')) {
      const parsed = parsePromoInput(val);
      if (parsed.code) {
        setNewCodeInput(parsed.code);
        if (parsed.rewardsText && !newRewardInput) {
          setNewRewardInput(parsed.rewardsText);
        }
        return;
      }
    }
    setNewCodeInput(val);
  };

  const handleCodeInputPaste = (e) => {
    const text = e.clipboardData?.getData('text') || '';
    if (text.includes('withhive.me') || text.includes('swq.jp') || text.includes('/313/')) {
      e.preventDefault();
      const parsed = parsePromoInput(text);
      if (parsed.code) {
        setNewCodeInput(parsed.code);
        if (parsed.rewardsText) {
          setNewRewardInput(parsed.rewardsText);
        }
      }
    }
  };

  const addPresetReward = (presetText) => {
    setNewRewardInput((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return presetText;
      if (trimmed.includes(presetText)) return trimmed;
      return `${trimmed}, ${presetText}`;
    });
  };

  return (
    <div className="space-y-6 max-w-[1780px] 2xl:max-w-[1880px] mx-auto pb-16 animate-in fade-in duration-300 relative">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-blue-600 text-white shadow-2xl text-sm font-bold animate-in slide-in-from-bottom duration-200 backdrop-blur-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#0c1424] via-[#090e18] to-[#070b12] p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold uppercase">
            <Gift className="w-3.5 h-3.5" />
            <span>Summoners War • Official Promo Codes</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            ศูนย์รวมโค้ดแจกไอเทมฟรี (ภาษาไทย)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            รวบรวมโค้ดแจก คัมภีร์เวทมนตร์, หินซัมมอน, รูน, พลังงาน และมานา ที่ยังใช้งานได้อยู่ กดปุ่มเพื่อคัดลอกหรือเปิดหน้ารับของรางวัลผ่าน Hive ID ได้ทันที
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="relative z-10 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          แชร์โค้ดใหม่
        </button>
      </div>

      {/* Codes Table / Cards */}
      <div className="rounded-3xl border border-white/[0.08] bg-[#0a0f19]/80 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <span className="text-sm sm:text-base font-bold text-white">โค้ดที่ยังใช้งานได้</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-black border border-emerald-500/30">
              {codes.length} โค้ด
            </span>
            {redeemed.list.length > 0 && (
              <span className="text-xs text-slate-400">รับแล้ว {codes.length - pendingCodes.length} • เหลือ {pendingCodes.length}</span>
            )}
            <button
              onClick={handleCopyAllPending}
              disabled={!pendingCodes.length}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#182333] text-slate-200 hover:bg-[#24334a] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" /> คัดลอกที่ยังไม่ได้รับทั้งหมด
            </button>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-400" />
            ตรวจสอบล่าสุด: {live.updatedAt ? new Date(live.updatedAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
            {!live.live && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">ข้อมูลสำรอง</span>
            )}
          </span>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {codes.map((item) => (
            <div 
              key={item.id}
              className={`p-5 hover:bg-white/[0.03] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${redeemed.has(item.code) ? 'opacity-60' : ''}`}
            >
              {/* Code & Copy */}
              <div className="space-y-1 min-w-[240px]">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none" title="ติ๊กเมื่อรับของแล้ว (จำเฉพาะเครื่องนี้)">
                    <input
                      type="checkbox"
                      checked={redeemed.has(item.code)}
                      onChange={() => redeemed.toggle(item.code)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-900 accent-emerald-500 cursor-pointer"
                    />
                    <span className={redeemed.has(item.code) ? 'text-emerald-400 font-bold' : ''}>{redeemed.has(item.code) ? 'รับแล้ว' : 'ยังไม่ได้รับ'}</span>
                  </label>
                  <span className={`font-mono text-lg sm:text-xl font-black tracking-wider ${redeemed.has(item.code) ? 'text-slate-400 line-through decoration-slate-500' : 'text-emerald-400'}`}>
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
                {item.rewardsText && !item.rewards?.length && (
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0c121c] border border-[#1f2c3f] text-xs sm:text-sm font-semibold text-slate-200">{item.rewardsText}</div>
                )}
                {(item.rewards || []).map((reward, rIdx) => (
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
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
                  รหัสโค้ด (หรือวางลิงก์ WithHive เช่น http://withhive.me/313/...):
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#0c121c] border border-[#1d2b3f] rounded-xl px-3.5 py-2.5 text-base text-white uppercase placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono font-bold"
                  placeholder="เช่น SW2026SPECIAL หรือวางลิงก์ WithHive"
                  value={newCodeInput}
                  onChange={(e) => handleCodeInputChange(e.target.value)}
                  onPaste={handleCodeInputPaste}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  ของรางวัล (เช่น คัมภีร์เวทมนตร์ x5, พลังงาน x200):
                </label>
                <input
                  type="text"
                  className="w-full bg-[#0c121c] border border-[#1d2b3f] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder="เช่น คัมภีร์เวทมนตร์ 5 ใบ หรือเลือกด้านล่าง"
                  value={newRewardInput}
                  onChange={(e) => setNewRewardInput(e.target.value)}
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-2 text-[11px]">
                  <span className="text-slate-400">เลือกด่วน:</span>
                  {QUICK_REWARD_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => addPresetReward(p.text)}
                      className="px-2 py-0.5 rounded-md bg-white/[0.05] hover:bg-blue-500/20 text-slate-300 hover:text-blue-200 border border-white/10 transition-colors cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
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
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  {submitting ? 'กำลังส่ง…' : 'ส่งโค้ดให้ตรวจ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
