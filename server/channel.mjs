// Subscriber count. Preferred: the YouTube Data API (set YT_API_KEY on the server; free, 1 unit per call).
// Fallback: read the "N subscribers" text from the public channel page. Cached for an hour; null when neither works.
const CHANNEL_ID = process.env.YT_CHANNEL_ID || 'UCAndS1Aeexxtf6bags0hI1w';
const HANDLE_URL = process.env.YT_CHANNEL_URL || 'https://www.youtube.com/@Mintyplays8';
const TTL = 60 * 60_000;
const RETRY = 5 * 60_000;

const compact = (n) => (n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + 'K' : String(n)).replace('.0', '');

async function fromApi(key) {
  const r = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${CHANNEL_ID}&key=${encodeURIComponent(key)}`, { signal: AbortSignal.timeout(5000) });
  if (!r.ok) throw new Error(`api ${r.status}`);
  const st = (await r.json()).items?.[0]?.statistics;
  if (!st || st.hiddenSubscriberCount) return null;
  const n = Number(st.subscriberCount);
  return Number.isFinite(n) ? { subscribers: n, text: compact(n) } : null;
}

async function fromPage() {
  const r = await fetch(HANDLE_URL, { headers: { 'accept-language': 'en-US,en;q=0.9', cookie: 'CONSENT=YES+1; SOCS=CAI' }, signal: AbortSignal.timeout(6000) });
  if (!r.ok) throw new Error(`page ${r.status}`);
  const m = /([\d][\d.,]*\s?[KMB]?)\s+subscribers/i.exec(await r.text());
  return m ? { subscribers: null, text: m[1].replace(/\s/g, '') } : null;
}

let cache = { at: 0, ttl: 0, value: null };

export async function subscribers() {
  if (Date.now() - cache.at < cache.ttl) return cache.value;
  let value = null;
  try {
    value = process.env.YT_API_KEY ? await fromApi(process.env.YT_API_KEY) : await fromPage();
  } catch (e) {
    console.error('channel: could not read subscriber count:', e.message);
  }
  cache = { at: Date.now(), ttl: value ? TTL : RETRY, value: value ?? cache.value }; // keep the last good number if a refresh fails
  return cache.value;
}
