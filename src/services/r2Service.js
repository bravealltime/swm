/**
 * Cloudflare R2 CDN & Asset Service for Summoners War Master
 * Enables zero-egress global caching for player profile pictures, monster portraits, and match histories.
 */

const R2_PUBLIC_URL = (import.meta.env.VITE_R2_PUBLIC_URL || '').replace(/\/+$/, '');

export const isR2Configured = () => Boolean(R2_PUBLIC_URL);

/**
 * Get the Cloudflare R2 CDN URL for a player avatar
 * @param {string} playerId 
 * @param {string} fallbackUrl 
 * @returns {string}
 */
export function getR2AvatarUrl(playerId, fallbackUrl) {
  if (!playerId) return fallbackUrl;
  if (R2_PUBLIC_URL) {
    const cleanId = playerId.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    return `${R2_PUBLIC_URL}/avatars/${cleanId}.webp`;
  }
  return fallbackUrl;
}

/**
 * Get the Cloudflare R2 CDN URL for a monster portrait
 * @param {string|number} monsterId 
 * @param {string} fallbackUrl 
 * @returns {string}
 */
export function getR2MonsterUrl(monsterId, fallbackUrl) {
  if (!monsterId) return fallbackUrl;
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/monsters/${monsterId}.png`;
  }
  return fallbackUrl;
}

/**
 * Get the Cloudflare R2 CDN URL for a player's heavy match history chunk
 * @param {string} playerId 
 * @param {number} season 
 * @returns {string}
 */
export function getR2MatchHistoryUrl(playerId, season = 38) {
  if (!playerId) return null;
  const cleanId = playerId.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/matches/s${season}/${cleanId}.json`;
  }
  return null;
}
