// Visitor counter for the Minty Plays page. Two numbers in DATA_DIR/visits.json:
//   unique = browsers that have ever opened the page (each browser reports itself once), views = counted page loads.
// No IP addresses or cookies are stored. An address is only remembered in memory, for an hour, so reloading cannot inflate the count.
import fs from 'node:fs';
import path from 'node:path';

const dir = () => path.resolve(process.env.DATA_DIR || 'data');
const file = () => path.join(dir(), 'visits.json');
const HOUR = 3_600_000;

const d = { unique: 0, views: 0 };
try {
  const j = JSON.parse(fs.readFileSync(file(), 'utf8'));
  if (Number.isFinite(j.unique)) d.unique = Math.max(0, Math.floor(j.unique));
  if (Number.isFinite(j.views)) d.views = Math.max(0, Math.floor(j.views));
} catch {
  /* first run, or an unreadable file: start from zero */
}

const recent = new Map(); // ip -> time of its last counted visit

function save() {
  try {
    fs.mkdirSync(dir(), { recursive: true });
    const tmp = file() + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(d));
    fs.renameSync(tmp, file());
  } catch (e) {
    console.error('visits: could not save:', e.message);
  }
}

export const counts = () => ({ unique: d.unique, views: d.views });

/** Registers one page load. `first` = this browser has never been counted. Returns the new totals. */
export function hit(ip, first, now = Date.now()) {
  const last = recent.get(ip) || 0;
  if (now - last < HOUR) return counts();
  if (recent.size > 5000) for (const [k, t] of recent) if (now - t >= HOUR) recent.delete(k);
  recent.set(ip, now);
  d.views++;
  if (first) d.unique++;
  save();
  return counts();
}
