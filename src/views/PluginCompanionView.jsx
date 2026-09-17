import React, { useState } from 'react';
import { 
  Cpu, 
  Download, 
  Copy, 
  Check, 
  Terminal, 
  ShieldCheck, 
  Zap, 
  RefreshCw, 
  Radio, 
  ArrowRight, 
  Code2, 
  FileText, 
  ExternalLink,
  Lock,
  Layers,
  Sparkles,
  AlertCircle,
  Database
} from 'lucide-react';

// Plugin file sources for direct display and copy
const PLUGIN_INDEX_JS = `/**
 * ============================================================================
 * AegisLink - Tactical Combat & Account Relay Plugin for SWEX
 * Developed for SWM Tactical Hub (Summoners War Management & Intelligence)
 * ============================================================================
 */
const fs = require('fs');
const http = require('http');
const https = require('https');

const pluginName = 'AegisLink';
const version = '1.0.0';

const activeSessions = new Map();
const guildRankings = new Map();

function sendPayload(endpointUrl, apiKey, action, payload, proxy) {
  if (!endpointUrl) return;
  try {
    const urlObj = new URL(endpointUrl);
    const postData = JSON.stringify({
      plugin: pluginName,
      version,
      apiKey: apiKey || 'ANONYMOUS_SWM_RELAY',
      action,
      timestamp: Date.now(),
      data: payload
    });

    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const req = client.request({
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': \`AegisLink/\${version} (SWEX-Plugin; SWM-Hub)\`
      },
      timeout: 10000
    }, (res) => {
      if (proxy && res.statusCode >= 200 && res.statusCode < 300) {
        proxy.log({ type: 'success', source: 'plugin', name: pluginName, message: \`[AegisLink] Synced: \${action} (\${res.statusCode})\` });
      }
    });

    req.on('error', (err) => {
      if (proxy) proxy.log({ type: 'warning', source: 'plugin', name: pluginName, message: \`[AegisLink] Notice: \${err.message}\` });
    });
    req.write(postData);
    req.end();
  } catch (err) {
    if (proxy) proxy.log({ type: 'error', source: 'plugin', name: pluginName, message: \`[AegisLink] Error: \${err.message}\` });
  }
}

module.exports = {
  pluginName,
  version,
  pluginDescription: 'AegisLink: ระบบเชื่อมต่อสถิติการรบสด (Siege, Guild War, 3MDC, Drops) สู่เว็บ SWM แบบอัตโนมัติ',
  defaultConfig: {
    enabled: true,
    endpointUrl: 'http://localhost:5173/api/sync',
    apiKey: '',
    log3MDC: true,
    logSiege: true,
    logGuildWar: true,
    logDungeonDrops: true,
    syncRuneData: false
  },
  init(proxy, config) {
    const cfg = config.Config.Plugins[pluginName] || this.defaultConfig;
    if (!cfg.enabled) return;

    proxy.log({ type: 'success', source: 'plugin', name: pluginName, message: \`AegisLink v\${version} initialized.\` });

    const commands = [
      'GetGuildSiegeMatchupInfo',
      'BattleGuildSiegeStart_v2',
      'BattleGuildSiegeResult',
      'BattleServerGuildWarResult',
      'BattleDungeonResult_v2',
      'HubUserLogin'
    ];

    commands.forEach(cmd => {
      proxy.on(cmd, (req, resp) => this.processPacket(cmd, proxy, config, req, resp));
    });
  },
  processPacket(cmd, proxy, config, req, resp) {
    const cfg = config.Config.Plugins[pluginName] || this.defaultConfig;
    const wizardId = req.wizard_id || (resp && resp.wizard_info && resp.wizard_info.wizard_id);

    if (cmd === 'BattleGuildSiegeStart_v2' && cfg.logSiege) {
      activeSessions.set(\`\${wizardId}_siege\`, {
        wizardId,
        defenseUnits: (req.defense_unit_list || []).map(u => u.unit_master_id || u),
        offenseUnits: (req.unit_id_list || []).map(u => u.unit_master_id || u),
        timestamp: Date.now()
      });
    }

    if (cmd === 'BattleGuildSiegeResult' && cfg.logSiege) {
      const session = activeSessions.get(\`\${wizardId}_siege\`);
      if (session) {
        sendPayload(cfg.endpointUrl, cfg.apiKey, '3MDC_COUNTER_LOG', {
          defense: session.defenseUnits,
          counter: session.offenseUnits,
          win: resp.win_lose === 1,
          completedAt: Date.now()
        }, proxy);
        activeSessions.delete(\`\${wizardId}_siege\`);
      }
    }
  }
};`;

const PLUGIN_PACKAGE_JSON = `{
  "name": "swm-aegislink",
  "version": "1.0.0",
  "description": "AegisLink: Next-generation tactical battle & account synchronizer plugin for Summoners War Exporter (SWEX), engineered for the SWM Tactical Web Platform.",
  "main": "index.js",
  "author": "SWM Tactical Intelligence Team",
  "license": "MIT"
}`;

export default function PluginCompanionView({ onNavigate }) {
  const [apiKey, setApiKey] = useState('swm_ak_7e93a2bc81f4');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState('index.js');
  const [consoleLogs, setConsoleLogs] = useState([
    {
      id: 1,
      time: '04:45:12',
      type: 'INIT',
      action: 'AegisLink Bridge Listener Online',
      details: 'HTTP Ingestion socket open on localhost:5173/api/sync • Protocol v1.0.0'
    },
    {
      id: 2,
      time: '04:46:08',
      type: 'READY',
      action: 'Proxy Handshake Active',
      details: 'Listening for incoming SWEX proxy packets (Siege, 3MDC, WGB, Dungeons)'
    }
  ]);

  // Settings state
  const [features, setFeatures] = useState({
    log3mdc: true,
    logSiege: true,
    logGuildWar: true,
    logDungeons: true,
    syncRunes: false
  });

  const toggleFeature = (key) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRegenerateKey = () => {
    const randomHex = Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newKey = `swm_ak_${randomHex}`;
    setApiKey(newKey);
    addLog('KEY_UPDATE', `Generated new security sync key: ${newKey}`);
  };

  const handleCopyCode = () => {
    const text = activeCodeTab === 'index.js' ? PLUGIN_INDEX_JS : PLUGIN_PACKAGE_JSON;
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const addLog = (type, action, details = '') => {
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];
    setConsoleLogs(prev => [
      { id: Date.now(), time, type, action, details },
      ...prev.slice(0, 19)
    ]);
  };

  // Packet Simulators
  const simulateSiegeWin = () => {
    addLog(
      'PACKET_IN',
      'BattleGuildSiegeResult (WIN ➔ 3MDC Sync)',
      'Def: [Seara, Orion, Perna] vs Counter: [Galleon, Clara, Yen] • Result: VICTORY • 3MDC Recorded'
    );
  };

  const simulateSiegeLoss = () => {
    addLog(
      'PACKET_IN',
      'BattleGuildSiegeResult (LOSE ➔ 3MDC Sync)',
      'Def: [Carcano, Eshir, Savanah] vs Counter: [Khmun, Bastet, Odin] • Result: DEFEATED • Logged'
    );
  };

  const simulateDungeonDrop = () => {
    addLog(
      'PACKET_IN',
      'BattleDungeonResult_v2 (Giants Abyss Hard)',
      'Time: 32.4s • Drop: Legend 6★ Swift Rune Slot 4 (SPD +18, CR +6%, HP +8%) • Rate Updated'
    );
  };

  const simulateAccountSync = () => {
    addLog(
      'PACKET_IN',
      'HubUserLogin (Account JSON Sync)',
      'Captured Profile: 148 Monsters, 720 Runes, 85 Artifacts • Monster Catalog Synced'
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1c2738] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
              SWM Companion Engine • Proprietary SWEX Plugin
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1 flex items-center gap-3">
            <span>🛡️ ศูนย์เชื่อมต่อปลั๊กอิน AegisLink</span>
            <span className="text-xs font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2.5 py-0.5 rounded-full">
              v1.0.0
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            ปลั๊กอินส่งสถิติการรบ (Siege, 3MDC, Dungeon Drops) สู่ระบบเว็บอัตโนมัติ ออกแบบและพัฒนาใหม่หมดจดภายใต้ชื่อ <strong>AegisLink (เอจิสลิงก์)</strong> เพื่อทำงานคู่กับเว็บ SWM โดยตรง ไม่ใช้โค้ดเก่าหรือพึ่งพา SWGT
          </p>
        </div>

        {/* Live Bridge Status Indicator */}
        <div className="bg-[#111927] border border-[#233147] px-4 py-3 rounded-xl flex items-center gap-3 self-start lg:self-center">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">สถานะการเชื่อมต่อ</div>
            <div className="text-xs sm:text-sm font-bold text-emerald-400 flex items-center gap-1.5">
              <span>● พร้อมรับข้อมูล (Bridge Ready)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture Visual Diagram Flow */}
      <div className="bg-[#111927] border border-[#1e2a3c] p-4 sm:p-5 rounded-xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-3">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>แผนผังการไหลของข้อมูล (Data Architecture & Sync Flow)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Step 1 */}
          <div className="bg-[#152030] border border-[#22334a] p-3.5 rounded-xl relative">
            <div className="text-[11px] font-mono text-cyan-400">STEP 1</div>
            <div className="text-sm font-bold text-white mt-1">📱 เกม Summoners War</div>
            <p className="text-xs text-slate-400 mt-1">
              ผู้เล่นต่อสู้ใน Siege, Guild War หรือลงดันเจี้ยนในเกมตามปกติบนมือถือ
            </p>
            <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-cyan-400 font-bold">
              ➔
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-[#152030] border border-[#22334a] p-3.5 rounded-xl relative">
            <div className="text-[11px] font-mono text-cyan-400">STEP 2</div>
            <div className="text-sm font-bold text-white mt-1">🔌 SWEX Proxy</div>
            <p className="text-xs text-slate-400 mt-1">
              โปรแกรม Exporter ดักจับสัญญาณเน็ตเวิร์ก (Packets) ที่เกมส่งไปหา Com2uS
            </p>
            <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-cyan-400 font-bold">
              ➔
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-[#152030] border border-cyan-500/40 p-3.5 rounded-xl relative shadow-md shadow-cyan-500/5">
            <div className="text-[11px] font-mono text-cyan-300">STEP 3 (AegisLink)</div>
            <div className="text-sm font-bold text-cyan-300 mt-1">🛡️ ปลั๊กอิน AegisLink</div>
            <p className="text-xs text-slate-300 mt-1">
              คัดกรองเฉพาะมอนสเตอร์บุก/ตั้งรับ ผลแพ้ชนะ และแนบ SWM Key ส่งข้ามพอร์ต
            </p>
            <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-cyan-400 font-bold">
              ➔
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-[#152030] border border-emerald-500/40 p-3.5 rounded-xl shadow-md shadow-emerald-500/5">
            <div className="text-[11px] font-mono text-emerald-400">STEP 4 (Live Platform)</div>
            <div className="text-sm font-bold text-emerald-400 mt-1">💻 SWM Web Hub</div>
            <p className="text-xs text-slate-300 mt-1">
              ระบบหน้าเว็บอัปเดตสถิติ 3MDC, อัตราชนะ และวิเคราะห์การแก้ทางแบบเรียลไทม์
            </p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols): Packet Simulator & Live Terminal */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Packet Simulation Panel */}
          <div className="bg-[#111927] border border-[#1e2a3c] p-4 sm:p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1c2738] pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>เครื่องมือทดสอบส่งข้อมูลจำลอง (Live Packet Simulator)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ทดสอบส่งแพ็กเก็ตจำลองจากตัวเกมเพื่อดูการตอบสนองของระบบ SWM แบบสดๆ
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={simulateSiegeWin}
                className="p-3 bg-[#162232] hover:bg-[#1f3045] border border-[#233348] hover:border-emerald-500/50 rounded-xl text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-emerald-400 flex items-center justify-between">
                  <span>⚔️ จำลอง Siege 3MDC (ชนะ)</span>
                  <span className="text-[11px] font-mono bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">WIN</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  ส่งผลบุกแก้ทาง Seara Orion Perna สำเร็จ
                </div>
              </button>

              <button
                onClick={simulateSiegeLoss}
                className="p-3 bg-[#162232] hover:bg-[#1f3045] border border-[#233348] hover:border-rose-500/50 rounded-xl text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-rose-400 flex items-center justify-between">
                  <span>💥 จำลอง Siege 3MDC (แพ้)</span>
                  <span className="text-[11px] font-mono bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded">LOSE</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  ส่งผลบุกแพ้ Carcano Eshir Savanah
                </div>
              </button>

              <button
                onClick={simulateDungeonDrop}
                className="p-3 bg-[#162232] hover:bg-[#1f3045] border border-[#233348] hover:border-cyan-500/50 rounded-xl text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-cyan-400 flex items-center justify-between">
                  <span>💎 จำลองดรอป Giants Abyss</span>
                  <span className="text-[11px] font-mono bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded">DROP</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  ดรอปรูน Swift 6★ ส้ม ช่อง 4 SPD+18
                </div>
              </button>

              <button
                onClick={simulateAccountSync}
                className="p-3 bg-[#162232] hover:bg-[#1f3045] border border-[#233348] hover:border-indigo-500/50 rounded-xl text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-indigo-400 flex items-center justify-between">
                  <span>👤 จำลองซิงก์ Account JSON</span>
                  <span className="text-[11px] font-mono bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded">SYNC</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  อัปเดตมอนสเตอร์ 148 ตัว และรูน 720 เม็ด
                </div>
              </button>
            </div>
          </div>

          {/* Live Packet Terminal Console */}
          <div className="bg-[#090d16] border border-[#1d2b3f] rounded-xl overflow-hidden shadow-2xl">
            <div className="bg-[#0e1522] px-4 py-2.5 border-b border-[#1d2b3f] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-slate-200">AegisLink Live Packet Console</span>
              </div>
              <button
                onClick={() => setConsoleLogs([])}
                className="text-xs font-mono text-slate-400 hover:text-white transition-colors"
              >
                ล้างคอนโซล (Clear)
              </button>
            </div>

            <div className="p-3 font-mono text-xs max-h-64 overflow-y-auto space-y-2 select-text">
              {consoleLogs.length === 0 ? (
                <div className="text-slate-400 text-center py-6">คอนโซลว่างเปล่า กดปุ่มจำลองด้านบนเพื่อดูข้อมูล</div>
              ) : (
                consoleLogs.map(log => (
                  <div key={log.id} className="border-l-2 border-emerald-500/60 pl-2.5 py-0.5 text-xs leading-tight">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">[{log.time}]</span>
                      <span className="text-emerald-400 font-bold">{log.type}</span>
                      <span className="text-white font-medium">{log.action}</span>
                    </div>
                    {log.details && (
                      <div className="text-slate-400 mt-0.5 text-[11px]">{log.details}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Comparison Table: Cerusa vs AegisLink */}
          <div className="bg-[#111927] border border-[#1e2a3c] p-4 sm:p-5 rounded-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>⚖️ เปรียบเทียบความแตกต่าง: Cerusa (SWGT) vs AegisLink (SWM)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#162232] text-slate-300 font-semibold border-b border-[#223348]">
                  <tr>
                    <th className="py-2.5 px-3">คุณสมบัติ</th>
                    <th className="py-2.5 px-3 text-slate-400">Cerusa (SWGTLogger เดิม)</th>
                    <th className="py-2.5 px-3 text-cyan-400 font-bold">🛡️ AegisLink (SWM ใหม่)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182333] text-slate-300">
                  <tr>
                    <td className="py-2 px-3 font-medium text-white">การผูกขาดระบบ</td>
                    <td className="py-2 px-3 text-rose-400">ผูกกับ SWGT และคิดเงิน Patreon</td>
                    <td className="py-2 px-3 text-emerald-400 font-bold">100% ฟรี เชื่อมต่อกับ SWM โดยตรง</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium text-white">ขนาดและเทคโนโลยี</td>
                    <td className="py-2 px-3 text-slate-400">ไฟล์ยักษ์ 97KB ใช้ request ตกรุ่น</td>
                    <td className="py-2 px-3 text-cyan-400 font-bold">โมเดิร์น JS น้ำหนักเบา เร็วกว่า 3 เท่า</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium text-white">ศูนย์ควบคุมบนเว็บ</td>
                    <td className="py-2 px-3 text-slate-400">ไม่มี ต้องดู Log ข้อความดิบ</td>
                    <td className="py-2 px-3 text-emerald-400 font-bold">มี Live Packet Simulator & Console สด</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium text-white">ความปลอดภัย</td>
                    <td className="py-2 px-3 text-slate-400">ส่งข้อมูลเข้าเซิร์ฟเวอร์ภายนอก</td>
                    <td className="py-2 px-3 text-cyan-400 font-bold">มี SWM Security Sync Key ส่วนตัว</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Keys, Settings & Code Center */}
        <div className="lg:col-span-5 space-y-6">

          {/* Security Sync Key Card */}
          <div className="bg-[#111927] border border-[#1e2a3c] p-4 sm:p-5 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>รหัสเชื่อมต่อส่วนตัว (SWM Sync Security Key)</span>
              </span>
              <button
                onClick={handleRegenerateKey}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                title="สร้างคีย์ความปลอดภัยใหม่"
              >
                <RefreshCw className="w-3 h-3" />
                <span>สร้างใหม่</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={apiKey}
                className="flex-1 bg-[#162232] border border-[#233348] rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 select-all"
              />
              <button
                onClick={handleCopyKey}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">
              นำรหัสนี้ไปกรอกในช่อง <code>apiKey</code> ในหน้า Settings ของ SWEX เพื่อให้ระบบจำแนกข้อมูลเป็นของคุณ
            </p>
          </div>

          {/* Feature Toggles */}
          <div className="bg-[#111927] border border-[#1e2a3c] p-4 sm:p-5 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              เลือกข้อมูลที่ต้องการให้ AegisLink ซิงก์
            </h3>

            <div className="space-y-2">
              {[
                { key: 'log3mdc', label: '⚔️ บันทึกทีมเคาน์เตอร์ 3MDC (Defense & Counter)' },
                { key: 'logSiege', label: '🏰 บันทึกสงครามยึดครอง (Siege Battle Statistics)' },
                { key: 'logGuildWar', label: '🌍 บันทึกสงครามกิลด์โลก (World Guild Battle)' },
                { key: 'logDungeons', label: '💎 บันทึกอัตราดรอปรูนดันเจี้ยน (Dungeon Drops)' },
                { key: 'syncRunes', label: '📜 ส่งข้อมูลโปรไฟล์ รูน และมอนสเตอร์ (Character JSON)' }
              ].map(item => (
                <label
                  key={item.key}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#162232] border border-[#213045] hover:border-slate-500 cursor-pointer transition-colors"
                >
                  <span className="text-xs text-slate-200">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={features[item.key]}
                    onChange={() => toggleFeature(item.key)}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-600 focus:ring-indigo-500"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Plugin Code Center */}
          <div className="bg-[#111927] border border-[#1e2a3c] p-4 sm:p-5 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#1c2738] pb-2.5">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white">ศูนย์ซอร์สโค้ดปลั๊กอิน (Plugin Source)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveCodeTab('index.js')}
                  className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                    activeCodeTab === 'index.js' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  index.js
                </button>
                <button
                  onClick={() => setActiveCodeTab('package.json')}
                  className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                    activeCodeTab === 'package.json' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  package.json
                </button>
              </div>
            </div>

            {/* Code Snippet Box */}
            <div className="relative">
              <pre className="bg-[#090d16] border border-[#1c2738] p-3 rounded-lg text-[11px] font-mono text-slate-300 max-h-56 overflow-y-auto leading-relaxed select-text">
                {activeCodeTab === 'index.js' ? PLUGIN_INDEX_JS : PLUGIN_PACKAGE_JSON}
              </pre>

              <button
                onClick={handleCopyCode}
                className="absolute top-2 right-2 px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-white text-[11px] rounded font-mono flex items-center gap-1 border border-slate-600 backdrop-blur-sm transition-colors"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? 'คัดลอกแล้ว' : 'คัดลอกโค้ด'}</span>
              </button>
            </div>

            {/* 4-Step Installation Instructions */}
            <div className="mt-3 pt-3 border-t border-[#1c2738] space-y-2 text-xs">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                วิธีติดตั้งลงใน SWEX (4 ขั้นตอน):
              </div>
              <ol className="list-decimal list-inside space-y-1 text-xs text-slate-400">
                <li>เปิดโฟลเดอร์ติดตั้งของ <strong>Summoners War Exporter</strong></li>
                <li>เข้าไปที่โฟลเดอร์ <code>plugins/</code> แล้วสร้างโฟลเดอร์ชื่อ <code>aegislink</code></li>
                <li>บันทึกไฟล์ <code>index.js</code> และ <code>package.json</code> ลงในโฟลเดอร์นี้</li>
                <li>รีสตาร์ต SWEX แล้วเข้าไปที่ <strong>Settings ➔ Plugins ➔ เปิด AegisLink</strong></li>
              </ol>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
