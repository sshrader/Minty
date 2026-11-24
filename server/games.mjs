// "Games I play": live game art from Roblox's public APIs, so the pictures are the games' own and nothing is copied into this repo.
// Each game is set by its place id (the number in roblox.com/games/<id>) or its universe id. Edit GAMES to add or change entries.
export const GAMES = [
  { name: 'Dress to Impress', place: 15101393044, blurb: 'Pick a theme, style the best outfit and strut the runway.' },
  { name: 'Murder Mystery 2', place: 142823291, blurb: 'Who is the murderer? Hide, spot clues and survive the round.' },
  { name: 'Pinky Promise', universe: 10769634720, blurb: 'A spooky party game. Keep your promise if you can!' },
  { name: 'Clean all the leaves', universe: 10539411000, blurb: 'Rake, blow and vacuum huge piles of leaves until every yard is spotless.' },
];

const TTL = 6 * 60 * 60_000;
const j = async (fetchFn, url) => {
  const r = await fetchFn(url, { signal: AbortSignal.timeout(6000) });
  if (!r.ok) throw new Error(`${r.status} ${new URL(url).hostname}`);
  return r.json();
};

export async function loadGames(fetchFn = fetch, games = GAMES) {
  // 1. universe ids (resolve place ids)
  const universes = await Promise.all(games.map(async (g) => {
    if (g.universe) return g.universe;
    try { return (await j(fetchFn, `https://apis.roblox.com/universes/v1/places/${g.place}/universe`)).universeId ?? null; } catch { return null; }
  }));
  const ids = universes.filter(Boolean).join(',');
  if (!ids) return [];
  // 2. root place (for the Play link), icon and screenshot, each best-effort
  const [info, icons, shots] = await Promise.all([
    j(fetchFn, `https://games.roblox.com/v1/games?universeIds=${ids}`).catch(() => ({ data: [] })),
    j(fetchFn, `https://thumbnails.roblox.com/v1/games/icons?universeIds=${ids}&size=512x512&format=Png&returnPolicy=PlaceHolder`).catch(() => ({ data: [] })),
    j(fetchFn, `https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${ids}&countPerUniverse=1&size=768x432&format=Png&defaults=false`).catch(() => ({ data: [] })),
  ]);
  const place = new Map((info.data || []).map((d) => [d.id, d.rootPlaceId]));
  const icon = new Map((icons.data || []).filter((d) => d.state === 'Completed').map((d) => [d.targetId, d.imageUrl]));
  const shot = new Map((shots.data || []).map((d) => [d.universeId, d.thumbnails?.find((t) => t.state === 'Completed')?.imageUrl]));
  return games.map((g, i) => {
    const u = universes[i];
    const pid = g.place || place.get(u);
    return {
      name: g.name,
      blurb: g.blurb,
      url: pid ? `https://www.roblox.com/games/${pid}` : `https://www.roblox.com/discover?Keyword=${encodeURIComponent(g.name)}`,
      image: shot.get(u) || icon.get(u) || null,
      icon: icon.get(u) || null,
    };
  });
}

let cache = { at: 0, ttl: 0, games: [] };

export async function games() {
  if (Date.now() - cache.at < cache.ttl) return cache.games;
  let g = [];
  try { g = await loadGames(); } catch (e) { console.error('games: could not load Roblox art:', e.message); }
  const ok = g.some((x) => x.image);
  cache = { at: Date.now(), ttl: ok ? TTL : 5 * 60_000, games: ok ? g : cache.games };
  return cache.games;
}
