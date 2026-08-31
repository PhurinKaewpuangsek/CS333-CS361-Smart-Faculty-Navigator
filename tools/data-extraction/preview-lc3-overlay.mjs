/**
 * Bakes the extracted LC3 pins into copies of the floor-plan SVGs so a reviewer can confirm
 * that every marker lands inside the room it claims.
 *
 *   node tools/data-extraction/preview-lc3-overlay.mjs
 *
 * Output goes to tools/data-extraction/lc3/reports/qa/ which is gitignored — these are ~1.5 MB
 * of derived artwork and must never enter the repo.
 *
 * The pins are written directly into the SVG rather than served from an HTML page that
 * fetches the CSV: a fetch() against file:// is blocked by CORS and would fail silently,
 * and standing up a local server just to eyeball two images is not worth the surface area.
 * These files open straight from disk in any browser.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DATASET_DIR = join(REPO_ROOT, 'tools', 'data-extraction', 'lc3');
const QA_DIR = join(DATASET_DIR, 'reports', 'qa');

/**
 * Floor 1's adopted artwork was genuinely redrawn left of x=200 (29 rects do not match the
 * superseded asset at the +40/+40 offset). Pins there get their own colour and a printable
 * checklist so review effort lands where the risk actually is.
 */
const LEFT_WING_MAX_SOURCE_X = 200;

const PIN_STYLES = {
  room: { fill: '#e11d48', label: '#4c0519' },
  poi: { fill: '#2563eb', label: '#172554' },
  survey: { fill: '#f97316', label: '#431407' },
  leftwing: { fill: '#c026d3', label: '#4a044e' },
};

const escapeXml = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** Minimal RFC 4180 reader — enough for the inventory this repo generates. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (ch !== '\r') cell += ch;
  }
  if (cell !== '' || row.length > 0) { row.push(cell); rows.push(row); }
  const headers = rows.shift();
  return rows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
}

function pinStyleFor(record) {
  if (record.floor === '1' && Number(record.source_x) < LEFT_WING_MAX_SOURCE_X) return PIN_STYLES.leftwing;
  if (record.flags.includes('needs_field_validation')) return PIN_STYLES.survey;
  return record.location_kind === 'poi' ? PIN_STYLES.poi : PIN_STYLES.room;
}

function buildPinGroup(records) {
  const pins = records.map((r) => {
    const style = pinStyleFor(r);
    const caption = r.location_kind === 'poi' ? r.name_th : r.source_name;
    return [
      `    <g>`,
      `      <circle cx="${r.x}" cy="${r.y}" r="5" fill="${style.fill}" fill-opacity="0.85" stroke="#fff" stroke-width="1.5"/>`,
      `      <text x="${Number(r.x) + 8}" y="${Number(r.y) + 4}" font-size="9" fill="${style.label}"`,
      `            stroke="#fff" stroke-width="2.5" paint-order="stroke">${escapeXml(caption)}</text>`,
      `    </g>`,
    ].join('\n');
  });
  return ['  <g id="torch-qa-pins" font-family="sans-serif">', ...pins, '  </g>'].join('\n');
}

/** Injects the pin group immediately before the closing tag so it paints above the plan. */
function injectPins(svg, pinGroup) {
  const close = svg.lastIndexOf('</svg>');
  if (close === -1) throw new Error('asset has no closing </svg> tag');
  return `${svg.slice(0, close)}\n${pinGroup}\n${svg.slice(close)}`;
}

function main() {
  const manifest = JSON.parse(readFileSync(join(DATASET_DIR, 'source', 'source-manifest.json'), 'utf8'));
  const inventory = parseCsv(readFileSync(join(DATASET_DIR, 'reports', 'node-inventory.csv'), 'utf8'));
  const included = inventory.filter((r) => r.disposition === 'include');
  mkdirSync(QA_DIR, { recursive: true });

  const written = [];
  for (const asset of manifest.assets) {
    const records = included.filter((r) => Number(r.floor) === asset.floor);
    const svg = readFileSync(join(REPO_ROOT, asset.dest_path), 'utf8');
    const previewed = injectPins(svg, buildPinGroup(records));
    const out = join(QA_DIR, `${asset.map_asset_id}.preview.svg`);
    writeFileSync(out, previewed, 'utf8');
    written.push([out, `${records.length} pins`]);

    // A cropped view of the redrawn region, so the reviewer is not hunting at 1:1 zoom.
    if (asset.floor === 1) {
      const cropped = previewed.replace(
        /viewBox="[^"]+"/,
        'viewBox="80 40 420 640"'
      ).replace(/^<svg width="\d+" height="\d+"/, '<svg width="840" height="1280"');
      const cropOut = join(QA_DIR, `${asset.map_asset_id}.leftwing.preview.svg`);
      writeFileSync(cropOut, cropped, 'utf8');
      written.push([cropOut, 'left-wing crop']);
    }
  }

  const leftWing = included.filter((r) => r.floor === '1' && Number(r.source_x) < LEFT_WING_MAX_SOURCE_X);
  const survey = included.filter((r) => r.flags.includes('needs_field_validation'));
  const checklist = [
    '# LC3 pin verification checklist',
    '',
    'Open the `.preview.svg` files in a browser and confirm each pin sits inside the room it names.',
    '',
    `## Floor 1 left wing — verify all ${leftWing.length} (artwork was redrawn here)`,
    '',
    '| source node | source (x,y) | new (x,y) | name |',
    '| --- | --- | --- | --- |',
    ...leftWing.map((r) => `| \`${r.source_node_id}\` | (${r.source_x},${r.source_y}) | (${r.x},${r.y}) | ${r.name_th || '—'} |`),
    '',
    `## Rooms needing a field visit — ${survey.length}`,
    '',
    '| source node | room code | floor | new (x,y) |',
    '| --- | --- | --- | --- |',
    ...survey.map((r) => `| \`${r.source_node_id}\` | ${r.room_code} | ${r.floor} | (${r.x},${r.y}) |`),
    '',
    '## Pin colours',
    '',
    '- magenta — floor 1 left wing, verify 100%',
    '- orange — no name in the source graph, needs a field visit',
    '- blue — toilet or stairs',
    '- red — room carried over from the source graph',
    '',
  ].join('\n');
  const checklistPath = join(QA_DIR, 'qa-checklist.md');
  writeFileSync(checklistPath, checklist, 'utf8');
  written.push([checklistPath, `${leftWing.length} left-wing + ${survey.length} survey rows`]);

  console.log('preview-lc3-overlay: OK');
  for (const [path, note] of written) console.log(`  ${path.slice(REPO_ROOT.length + 1)}  (${note})`);
}

main();
