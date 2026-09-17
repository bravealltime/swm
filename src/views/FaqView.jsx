import React, { useState } from 'react';
import faqData from '../data/faqData.json';

export default function FaqView() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-[#1c2738] pb-5 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">SWM Guides • ศูนย์รวมคู่มือและคำถามพบบ่อย</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
          คำถามที่พบบ่อยและคู่มือการใช้งาน (FAQ & Knowledge Base)
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          คำแนะนำการใช้งานระบบ SWM, การเชื่อมต่อข้อมูลด้วย AegisLink / SWEX, กลยุทธ์ Siege และสปีดแอนิเมชั่นของสกินมอนสเตอร์
        </p>
      </div>

      {/* Accordion FAQ */}
      <div className="space-y-3">
        {faqData.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={item.id}
              className={`rounded-xl border transition-all overflow-hidden ${
                isOpen ? 'bg-[#131d2c] border-blue-500/50 shadow-md' : 'bg-[#0f1724] border-[#1d293b] hover:border-slate-600'
              }`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                  <span className="text-sm sm:text-base font-bold text-white">
                    {item.question}
                  </span>
                </div>
                <span className={`text-slate-400 transform transition-transform text-lg ${isOpen ? 'rotate-180 text-blue-400' : ''}`}>
                  ▾
                </span>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-slate-300 text-xs sm:text-sm leading-relaxed border-t border-[#1a2537]">
                  <p>{item.answer}</p>
                  <div className="mt-3 pt-3 border-t border-[#162131] flex items-center justify-between text-xs text-slate-400">
                    <span className="text-cyan-400 font-mono">ศูนย์ข้อมูลยุทธวิธี SWM Knowledge Base</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Plugin Download Box */}
      <div className="bg-gradient-to-r from-[#102035] to-[#121c2d] border border-blue-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center p-2 flex-shrink-0">
            <img src="https://do9d4mpqk497d.cloudfront.net/common/images/about/swex_logo.png" alt="SWEX" className="max-h-full max-w-full" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">3MDC + SWEX Auto-Logger Plugin</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              บันทึกผลการต่อสู้ ทีมบุกและทีมตั้งรับเข้าสู่ฐานข้อมูล SWM อัตโนมัติ รองรับผู้เล่นระดับ G1-G3
            </p>
          </div>
        </div>
        <a
          href="https://github.com/Cerusa/3mdc-swex-plugin/releases/latest"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/30 flex-shrink-0"
        >
          ดาวน์โหลดปลั๊กอิน (GitHub) ↗
        </a>
      </div>
    </div>
  );
}
