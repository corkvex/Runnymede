/**
 * Client-side geofencing framework.
 * Detects jurisdiction via browser locale + IP geolocation.
 * Toggles visibility of debates that may violate local laws.
 */

export interface GeoInfo {
  countryCode: string | null;
  region: string | null;
  source: 'locale' | 'ip' | 'unknown';
}

const RESTRICTED_TOPICS: Record<string, string[]> = {
  CN: ['censorship', 'tiananmen', 'xinjiang', 'taiwan_independence'],
  RU: ['ukraine_war', 'navalny', 'putin_corruption'],
  IR: ['regime_change', 'women_rights_iran'],
  SA: ['atheism', 'lgbtq_saudi'],
  TR: ['kurdish_rights', 'armenian_genocide'],
};

export async function detectGeo(): Promise<GeoInfo> {
  const locale = navigator.language;
  const region = locale.split('-')[1] || null;

  if (region && region.length === 2) {
    return { countryCode: region.toUpperCase(), region, source: 'locale' };
  }

  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const data = await res.json();
      if (data.country_code) {
        return {
          countryCode: data.country_code,
          region: data.region || null,
          source: 'ip',
        };
      }
    }
  } catch {
    // IP lookup may fail in restricted networks — fall through to locale
  }

  return { countryCode: null, region: null, source: 'unknown' };
}

export function isTopicRestricted(topic: string, countryCode: string | null): boolean {
  if (!countryCode) return false;
  const restricted = RESTRICTED_TOPICS[countryCode];
  if (!restricted) return false;
  const lowerTopic = topic.toLowerCase().replace(/\s+/g, '_');
  return restricted.some((r) => lowerTopic.includes(r));
}

export function getRestrictedTopics(countryCode: string | null): string[] {
  if (!countryCode) return [];
  return RESTRICTED_TOPICS[countryCode] || [];
}
