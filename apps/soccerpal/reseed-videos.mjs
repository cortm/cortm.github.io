import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SUPABASE_URL = 'https://lhvfqthdlxsvasuhkwap.supabase.co';
const SUPABASE_KEY = 'sb_publishable_joLYxwRXnbQLcH106L1ljg_4d2x_6kQ';

const drillsSrc = fs.readFileSync(path.join(__dirname, 'drills.js'), 'utf8');
const poolMatch = drillsSrc.match(/const DRILL_POOL = (\[[\s\S]*?\]);/);
const DRILL_POOL = eval(poolMatch[1]);
const videos = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed-videos.json'), 'utf8'));

const rows = DRILL_POOL.map((d) => ({
  id: d.id,
  name: d.name,
  category: d.category,
  type: d.type,
  duration: d.type === 'timer' ? d.duration : null,
  reps: d.type === 'reps' ? d.reps : null,
  equipment: d.equipment,
  xp: d.xp,
  description: d.description,
  video_url: videos[d.id] || null,
}));

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'resolution=merge-duplicates,return=representation',
};

const res = await fetch(`${SUPABASE_URL}/rest/v1/drills`, {
  method: 'POST',
  headers,
  body: JSON.stringify(rows),
});

const body = await res.text();
if (!res.ok) {
  console.error('Upsert failed:', res.status, body);
  process.exit(1);
}

const saved = JSON.parse(body);
console.log(`Seeded ${saved.length} drills with video links.`);

const withVideo = saved.filter((d) => d.video_url).length;
console.log(`${withVideo} drills have video_url set.`);
