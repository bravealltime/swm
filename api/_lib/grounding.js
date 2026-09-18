// Live Web Grounding for Summoners War Master (SWM)
// Provides real-time search for latest promo codes, balance patches, Com2uS Hive events, and SWC updates.

export async function searchLiveWeb(query, maxSnippets = 4, timeoutMs = 5000) {
  if (!query) return [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(query);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      },
      signal: controller.signal
    });

    if (!res.ok) return [];
    const html = await res.text();
    const results = [];
    const regex = /<a class="result__url"[^>]*href="([^"]+)"[^>]*>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let match;

    while ((match = regex.exec(html)) !== null && results.length < maxSnippets) {
      const snippet = match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (snippet && snippet.length > 20) {
        results.push(snippet);
      }
    }

    return results;
  } catch (err) {
    // Graceful fallback if offline or timeout
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/** Determines if a user query requires Live Web Grounding */
export function needsLiveGrounding(question) {
  const lower = String(question || '').toLowerCase();
  const triggers = [
    'โค้ด', 'คูปอง', 'promo', 'code', 'coupon', 'แจก',
    'แพทช์ล่าสุด', 'แพทล่าสุด', 'แพทช์ใหม่', 'balance patch', 'เนิร์ฟ', 'บัฟ',
    'อีเวนต์', 'กิจกรรม', 'event', 'อัปเดตล่าสุด', 'อัพเดท', 'swc',
    'com2us ล่าสุด', 'คอลแลบ', 'collab', 'มอนสเตอร์ใหม่', 'ข่าวสาร'
  ];

  return triggers.some(t => lower.includes(t));
}
