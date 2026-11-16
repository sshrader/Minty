// Latest videos and Shorts from the channel's public RSS feeds, cached so YouTube is hit at most once per TTL.
const CHANNEL_ID = process.env.YT_CHANNEL_ID || 'UCAndS1Aeexxtf6bags0hI1w';
// YouTube keeps hidden playlists per channel: UULF... = long videos only, UUSH... = Shorts only (same id as UC..., prefix swapped).
const feedFor = (prefix) => `https://www.youtube.com/feeds/videos.xml?playlist_id=${prefix}${CHANNEL_ID.slice(2)}`;
const FEEDS = { videos: feedFor('UULF'), shorts: feedFor('UUSH') };
const TTL = 15 * 60_000;
const COUNT = 4;

const unescapeXml = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&amp;/g, '&');

export function parseFeed(xml, count = COUNT) {
  const out = [];
  for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const e = m[1];
    const id = /<yt:videoId>([\w-]{11})<\/yt:videoId>/.exec(e)?.[1];
    const title = /<title>([\s\S]*?)<\/title>/.exec(e)?.[1];
    if (!id || !title) continue;
    const views = Number(/<media:statistics views="(\d+)"/.exec(e)?.[1]);
    out.push({
      id,
      title: unescapeXml(title.trim()),
      published: /<published>([^<]+)<\/published>/.exec(e)?.[1] || null,
      views: Number.isFinite(views) ? views : null,
    });
    if (out.length >= count) break;
  }
  return out;
}

const cache = { videos: { at: 0, items: [] }, shorts: { at: 0, items: [] } };

/** kind = 'videos' | 'shorts'. Returns up to 4 items, newest first, or [] when the feed cannot be read. */
export async function latest(kind) {
  const c = cache[kind];
  if (!c || !FEEDS[kind]) return [];
  if (c.items.length && Date.now() - c.at < TTL) return c.items;
  if (!c.items.length && Date.now() - c.at < 60_000) return c.items; // failed a moment ago: do not hammer YouTube
  c.at = Date.now();
  try {
    const r = await fetch(FEEDS[kind], { signal: AbortSignal.timeout(5000) });
    if (!r.ok) throw new Error(`${kind} feed ${r.status}`);
    const items = parseFeed(await r.text());
    if (items.length) c.items = items;
  } catch (e) {
    console.error('videos: could not load feed:', e.message);
  }
  return c.items;
}
