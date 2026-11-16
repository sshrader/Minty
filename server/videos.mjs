// Latest uploads from the channel's public RSS feed, cached so YouTube is hit at most once per TTL.
const CHANNEL_ID = process.env.YT_CHANNEL_ID || 'UCAndS1Aeexxtf6bags0hI1w';
const FEED = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
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

let cache = { at: 0, videos: [] };

export async function latestVideos() {
  if (cache.videos.length && Date.now() - cache.at < TTL) return cache.videos;
  try {
    const r = await fetch(FEED, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) throw new Error(`feed ${r.status}`);
    const videos = parseFeed(await r.text());
    if (videos.length) cache = { at: Date.now(), videos };
  } catch (e) {
    console.error('videos: could not load feed:', e.message);
    if (!cache.videos.length) cache.at = Date.now() - TTL + 60_000; // retry in a minute, serve [] meanwhile
  }
  return cache.videos;
}
