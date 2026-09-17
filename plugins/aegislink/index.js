/**
 * ============================================================================
 * AegisLink - Tactical Combat & Account Relay Plugin for SWEX
 * Developed for SWM Tactical Hub (Summoners War Management & Intelligence)
 * Replaces and upgrades legacy plugins (Cerusa SWGTLogger / 3MDCLogger)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const pluginName = 'AegisLink';
const version = '1.0.0';

// In-memory battle session tracking
const activeSessions = new Map();
const guildRankings = new Map();

/**
 * Dispatch JSON payload to SWM Web Platform or custom endpoint
 */
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

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': `AegisLink/${version} (SWEX-Plugin; SWM-Hub)`
      },
      timeout: 10000
    };

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (proxy && res.statusCode >= 200 && res.statusCode < 300) {
          proxy.log({
            type: 'success',
            source: 'plugin',
            name: pluginName,
            message: `[AegisLink] Synchronized: ${action} (${res.statusCode})`
          });
        }
      });
    });

    req.on('error', (err) => {
      if (proxy) {
        proxy.log({
          type: 'warning',
          source: 'plugin',
          name: pluginName,
          message: `[AegisLink] Relay notice: ${err.message}`
        });
      }
    });

    req.write(postData);
    req.end();
  } catch (err) {
    if (proxy) {
      proxy.log({
        type: 'error',
        source: 'plugin',
        name: pluginName,
        message: `[AegisLink] Network error: ${err.message}`
      });
    }
  }
}

module.exports = {
  pluginName,
  version,
  pluginDescription: 'AegisLink: ระบบเชื่อมต่อข้อมูลการรบสด (Siege, Guild War, 3MDC, Drops) สู่เว็บ SWM แบบอัตโนมัติและแม่นยำสูง',

  defaultConfig: {
    enabled: true,
    endpointUrl: 'http://localhost:5173/api/sync',
    apiKey: '',
    log3MDC: true,
    logSiege: true,
    logGuildWar: true,
    logDungeonDrops: true,
    syncRuneData: false,
    saveLocalLog: false
  },

  defaultConfigDetails: {
    endpointUrl: { label: 'URL เว็บปลายทาง SWM (เช่น http://localhost:5173/api/sync หรือเว็บเซิร์ฟเวอร์ของคุณ)' },
    apiKey: { label: 'SWM Sync Security Key (รหัสเชื่อมต่อส่วนตัว)' },
    log3MDC: { label: 'บันทึกข้อมูล 3MDC (ทีมบุกและทีมตั้งรับ 3 ตัว)' },
    logSiege: { label: 'บันทึกสถิติสงครามยึดครอง (Siege Battle)' },
    logGuildWar: { label: 'บันทึกสงครามกิลด์โลก (World Guild Battle)' },
    logDungeonDrops: { label: 'บันทึกไอเทมและรูนที่ดรอปในดันเจี้ยน (Dungeon Drop Rate)' },
    syncRuneData: { label: 'ส่งข้อมูลมอนสเตอร์และรูนเมื่อเข้าเกม (Character JSON)' },
    saveLocalLog: { label: 'บันทึกไฟล์ Log ลงในเครื่องคอมพิวเตอร์ (Local JSON File)' }
  },

  init(proxy, config) {
    const pluginConfig = config.Config.Plugins[pluginName] || this.defaultConfig;

    if (!pluginConfig.enabled) {
      proxy.log({ type: 'info', source: 'plugin', name: pluginName, message: 'AegisLink is disabled.' });
      return;
    }

    proxy.log({
      type: 'success',
      source: 'plugin',
      name: pluginName,
      message: `AegisLink v${version} initialized successfully. Listening for tactical combat packets...`
    });

    // Commands to intercept
    const listenedCommands = [
      // 1. Siege Battle Commands
      'GetGuildSiegeMatchupInfo',
      'BattleGuildSiegeStart_v2',
      'BattleGuildSiegeResult',

      // 2. World Guild Battle Commands
      'GetServerGuildWarMatchInfo',
      'BattleServerGuildWarStart',
      'BattleServerGuildWarResult',
      'BattleServerGuildWarRoundResult',

      // 3. Cairos & Rift Dungeon Drops
      'BattleDungeonResult_v2',
      'BattleRiftDungeonResult',

      // 4. Player Login & Full Account Data
      'HubUserLogin'
    ];

    listenedCommands.forEach((command) => {
      proxy.on(command, (req, resp) => {
        try {
          this.processPacket(command, proxy, config, req, resp);
        } catch (err) {
          proxy.log({
            type: 'error',
            source: 'plugin',
            name: pluginName,
            message: `Error processing ${command}: ${err.message}`
          });
        }
      });
    });
  },

  processPacket(command, proxy, config, req, resp) {
    const cfg = config.Config.Plugins[pluginName] || this.defaultConfig;
    const wizardId = req.wizard_id || (resp && resp.wizard_info && resp.wizard_info.wizard_id);

    // -------------------------------------------------------------
    // 1. Siege Battle: Get Matchup / Guild Rank
    // -------------------------------------------------------------
    if (command === 'GetGuildSiegeMatchupInfo') {
      if (resp && resp.match_info) {
        guildRankings.set(`siege_${wizardId}`, resp.match_info.rating_id || 0);
      }
    }

    // -------------------------------------------------------------
    // 2. Siege Battle: Start (Capture Defense and Offense Decks)
    // -------------------------------------------------------------
    if (command === 'BattleGuildSiegeStart_v2' && cfg.logSiege) {
      const battleKey = `${wizardId}_siege`;
      const defenseUnits = (req.defense_unit_list || []).map(u => u.unit_master_id || u);
      const offenseUnits = (req.unit_id_list || []).map(u => u.unit_master_id || u);

      activeSessions.set(battleKey, {
        wizardId,
        battleType: 'Siege',
        timestamp: Date.now(),
        defenseUnits,
        offenseUnits,
        guildRating: guildRankings.get(`siege_${wizardId}`) || 0
      });

      proxy.log({
        type: 'info',
        source: 'plugin',
        name: pluginName,
        message: `[Siege Combat Detected] Def: [${defenseUnits.join(', ')}] vs Off: [${offenseUnits.join(', ')}]`
      });
    }

    // -------------------------------------------------------------
    // 3. Siege Battle: Result (Capture Win/Loss & Upload 3MDC)
    // -------------------------------------------------------------
    if (command === 'BattleGuildSiegeResult' && cfg.logSiege) {
      const battleKey = `${wizardId}_siege`;
      const session = activeSessions.get(battleKey);

      if (session) {
        const winLose = resp.win_lose === 1 ? 'WIN' : 'LOSE';
        const battleRecord = {
          ...session,
          result: winLose,
          winLoseCode: resp.win_lose,
          completedAt: Date.now()
        };

        proxy.log({
          type: resp.win_lose === 1 ? 'success' : 'warning',
          source: 'plugin',
          name: pluginName,
          message: `[Siege Battle Completed] Result: ${winLose} (Wizard: ${wizardId})`
        });

        // Send to SWM Hub
        sendPayload(cfg.endpointUrl, cfg.apiKey, 'SIEGE_BATTLE_LOG', battleRecord, proxy);

        if (cfg.log3MDC && session.defenseUnits.length === 3 && session.offenseUnits.length === 3) {
          sendPayload(cfg.endpointUrl, cfg.apiKey, '3MDC_COUNTER_LOG', {
            defense: session.defenseUnits,
            counter: session.offenseUnits,
            win: resp.win_lose === 1,
            battleType: 'Siege',
            guildRating: session.guildRating
          }, proxy);
        }

        activeSessions.delete(battleKey);
      }
    }

    // -------------------------------------------------------------
    // 4. World Guild Battle: Result
    // -------------------------------------------------------------
    if ((command === 'BattleServerGuildWarResult' || command === 'BattleServerGuildWarRoundResult') && cfg.logGuildWar) {
      const record = {
        wizardId,
        battleType: 'WorldGuildWar',
        winLoseCode: resp.win_lose,
        timestamp: Date.now()
      };
      sendPayload(cfg.endpointUrl, cfg.apiKey, 'WGB_BATTLE_LOG', record, proxy);
    }

    // -------------------------------------------------------------
    // 5. Dungeon Drop Tracker (Cairos / Rift)
    // -------------------------------------------------------------
    if ((command === 'BattleDungeonResult_v2' || command === 'BattleRiftDungeonResult') && cfg.logDungeonDrops) {
      const dropInfo = {
        wizardId,
        dungeonId: req.dungeon_id,
        stageId: req.stage_id,
        clearTimeSec: resp.clear_time ? resp.clear_time.current_time / 1000 : null,
        win: resp.win_lose === 1,
        rewards: resp.reward || null,
        timestamp: Date.now()
      };

      sendPayload(cfg.endpointUrl, cfg.apiKey, 'DUNGEON_DROP_LOG', dropInfo, proxy);
    }

    // -------------------------------------------------------------
    // 6. Character JSON (Monsters, Runes, Artifacts)
    // -------------------------------------------------------------
    if (command === 'HubUserLogin' && cfg.syncRuneData) {
      proxy.log({
        type: 'info',
        source: 'plugin',
        name: pluginName,
        message: `[Character Sync] Account JSON captured for Wizard ID: ${wizardId}`
      });

      sendPayload(cfg.endpointUrl, cfg.apiKey, 'ACCOUNT_SYNC_JSON', {
        wizardInfo: resp.wizard_info,
        unitListCount: (resp.unit_list || []).length,
        runesCount: (resp.runes || []).length,
        artifactsCount: (resp.artifacts || []).length
      }, proxy);
    }
  }
};
