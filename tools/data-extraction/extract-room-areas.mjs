/**
 * Lifts the LC3 room-area colours out of the floor-plan SVGs and into the app.
 *
 *   node tools/data-extraction/extract-room-areas.mjs
 *
 * Two things happen, both derived from the artwork rather than hand-authored:
 *
 *   1. Every <rect> painted in one of the four Figma "room" colours is matched to the
 *      seed record whose (x, y) falls inside it. The winning geometry is written to
 *      frontend/src/components/map/roomAreaGeometry.ts, and the rect is neutralised to white
 *      in the SVG so the React overlay can tint it by category with mix-blend-mode.
 *   2. The leftover Figma frame badge on floor 1 ("LC3-1-color but soft") is deleted.
 *
 * The Figma fills carry no meaning — faculty_office alone is spread across three of
 * them — so nothing is lost by dropping them, and category colour becomes real data.
 *
 * Geometry, viewBox and coordinate space are untouched, so the manifest's
 * coordinate_transform stays valid. The asset hashes in source-manifest.json do change;
 * this script prints the new ones rather than rewriting them, so updating the manifest
 * stays a deliberate human act and the drift check keeps its teeth.
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SEED_PATH = join(REPO_ROOT, 'tools', 'data-extraction', 'lc3', 'lc3-locations.seed.json');
const OUT_PATH = join(REPO_ROOT, 'frontend', 'src', 'components', 'map', 'roomAreaGeometry.ts');

/**
 * The four Figma fills used for room interiors. #B3FCFF (corridors) and #A29393
 * (courtyard / void) are deliberately excluded — they are structure, not rooms.
 */
const ROOM_FILLS = ['#F5CAAB', '#BFD8EB', '#CBE6D8', '#F0E3EB'];

/**
 * Structural areas carry no room data, so they stay in the artwork — but the exporter's
 * saturated cyan and mauve shouted over every room tint. Repainted to quiet neutrals.
 */
const STRUCTURAL_RECOLOUR = {
  '#B3FCFF': '#E3EAEE', // circulation / corridors
  '#A29393': '#DEDAD8', // courtyard and voids
};

const FLOORS = [
  { floor: 1, path: join(REPO_ROOT, 'frontend', 'public', 'maps', 'lc3', 'floor-1.svg') },
  { floor: 2, path: join(REPO_ROOT, 'frontend', 'public', 'maps', 'lc3', 'floor-2.svg') },
];

const attr = (tag, name) => {
  const m = tag.match(new RegExp(name + '="([^"]*)"'));
  return m ? m[1] : null;
};

/** Collapses a rotated rect to its axis-aligned bounding box. */
function boundingBox(tag) {
  let x = Number(attr(tag, 'x') ?? 0);
  let y = Number(attr(tag, 'y') ?? 0);
  let width = Number(attr(tag, 'width'));
  let height = Number(attr(tag, 'height'));

  const transform = attr(tag, 'transform');
  if (transform) {
    const rotate = transform.match(/rotate\((-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\)/);
    assert.ok(rotate, 'unsupported transform on a room rect: ' + transform);
    const angle = Number(rotate[1]);
    const cx = Number(rotate[2]);
    const cy = Number(rotate[3]);
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const corners = [
      [x, y],
      [x + width, y],
      [x, y + height],
      [x + width, y + height],
    ].map(([px, py]) => {
      const dx = px - cx;
      const dy = py - cy;
      return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
    });
    const xs = corners.map((c) => c[0]);
    const ys = corners.map((c) => c[1]);
    x = Math.min(...xs);
    y = Math.min(...ys);
    width = Math.max(...xs) - x;
    height = Math.max(...ys) - y;
  }

  const round = (n) => Math.round(n * 100) / 100;
  return { x: round(x), y: round(y), width: round(width), height: round(height) };
}

const contains = (box, px, py) =>
  px >= box.x - 1 && px <= box.x + box.width + 1 && py >= box.y - 1 && py <= box.y + box.height + 1;

const area = (box) => box.width * box.height;

function collectRoomRects(svg) {
  const rects = [];
  for (const match of svg.matchAll(/<rect[^>]*>/g)) {
    const tag = match[0];
    if (!ROOM_FILLS.includes(attr(tag, 'fill'))) continue;
    rects.push({ tag, index: match.index, box: boundingBox(tag) });
  }
  return rects;
}

/**
 * Removes the floor-1 colour legend.
 *
 * Its four swatches are exactly the four room fills this script replaces — the artwork
 * grouped rooms by department, which is information the seed does not carry. Once the
 * fills become category tints the legend describes nothing on the map, so it has to go;
 * MapLegend.tsx renders the category key instead.
 */
function stripFloorLegend(svg, floor, endAt) {
  const box = svg.match(/<rect[^>]*transform="translate\(96 564\)"[^>]*fill="white"\s*\/>/);
  if (!box) return { svg, removed: 0 };

  const span = svg.slice(box.index, endAt);
  const elements = [...span.matchAll(/<[a-z]+[^>]*>/g)].map((m) => m[0]);
  assert.equal(
    elements.length,
    9,
    'floor ' + floor + ': expected a 9-element legend, got ' + elements.length
  );

  const swatches = elements.filter((el) => ROOM_FILLS.some((f) => el.includes('fill="' + f + '"')));
  assert.equal(swatches.length, 4, 'legend does not carry the 4 room-fill swatches');
  assert.ok(!span.includes('id="'), 'legend span references an id — refusing to cut');

  return { svg: svg.slice(0, box.index) + svg.slice(endAt), removed: span.length };
}

/**
 * Removes the Figma frame name badge: a black rounded chip plus its white label text,
 * appended by the exporter after all real artwork. Anchored on the chip rect itself —
 * the enclosing </g> closes far earlier and encloses genuine map content, including the
 * floor-1 legend. Asserts the span really is the badge before cutting anything.
 */
function findBadgeStart(svg, floor) {
  const defsAt = svg.indexOf('<defs>');
  assert.ok(defsAt > 0, 'floor ' + floor + ': no <defs> found');
  const chips = [...svg.slice(0, defsAt).matchAll(/<rect[^>]*rx="3"[^>]*fill="black"\s*\/>/g)];
  return { defsAt, chipAt: chips.length ? chips[chips.length - 1].index : null };
}

function stripFigmaBadge(svg, floor) {
  const { defsAt, chipAt } = findBadgeStart(svg, floor);
  if (chipAt === null) return { svg, removed: 0 };

  const chip = { index: chipAt };
  const span = svg.slice(chip.index, defsAt);

  const elements = [...span.matchAll(/<[a-z]+[^>]*>/g)].map((m) => m[0]);
  assert.equal(
    elements.length,
    3,
    'floor ' + floor + ': expected a 3-element badge, got ' + elements.length
  );
  assert.ok(elements[1].includes('stroke="white"'), 'second badge element is not the chip border');
  assert.ok(elements[2].includes('fill="white"'), 'third badge element is not the white label text');
  assert.ok(!span.includes('id="'), 'badge span references an id — refusing to cut');

  return { svg: svg.slice(0, chip.index) + svg.slice(defsAt), removed: span.length };
}

function processFloor({ floor, path }, records) {
  const original = readFileSync(path, 'utf8');
  const rects = collectRoomRects(original);

  assert.ok(
    rects.length > 0,
    'floor ' +
      floor +
      ': no room-colour fills left — this SVG is already neutralised. ' +
      'Restore it with "git checkout -- ' +
      path +
      '" before re-running.'
  );

  const floorRecords = records.filter((r) => r.floor === floor);
  const claimed = new Map(); // index into rects -> location_id
  const areas = new Map(); // location_id -> box
  const unmatched = [];

  for (const record of floorRecords) {
    const hit = rects
      .map((rect, i) => ({ rect, i }))
      .filter(({ rect }) => contains(rect.box, record.x, record.y))
      .sort((a, b) => area(a.rect.box) - area(b.rect.box))
      .find(({ i }) => !claimed.has(i));

    if (!hit) {
      unmatched.push(record);
      continue;
    }
    claimed.set(hit.i, record.location_id);
    areas.set(record.location_id, hit.rect.box);
  }

  // A decorative rect (desk, door leaf) whose centre sits inside a claimed room is part
  // of that room's interior, so it must be neutralised too or it keeps a stale colour.
  const decor = [];
  rects.forEach((rect, i) => {
    if (claimed.has(i)) return;
    const cx = rect.box.x + rect.box.width / 2;
    const cy = rect.box.y + rect.box.height / 2;
    if ([...claimed.keys()].some((j) => contains(rects[j].box, cx, cy))) decor.push(i);
  });

  const toNeutralise = new Set([...claimed.keys(), ...decor]);

  // Splice by recorded index so each rect tag is rewritten exactly once.
  let out = '';
  let cursor = 0;
  for (const [i, rect] of rects.entries()) {
    if (!toNeutralise.has(i)) continue;
    out += original.slice(cursor, rect.index);
    out += rect.tag.replace(/fill="#[0-9A-Fa-f]{6}"/, 'fill="white"');
    cursor = rect.index + rect.tag.length;
  }
  out += original.slice(cursor);

  // The legend run ends where the badge begins (or at <defs> on a badge-less floor).
  const { defsAt, chipAt } = findBadgeStart(out, floor);
  const legend = stripFloorLegend(out, floor, chipAt ?? defsAt);
  const stripped = stripFigmaBadge(legend.svg, floor);

  let final = stripped.svg;
  for (const [from, to] of Object.entries(STRUCTURAL_RECOLOUR)) {
    final = final.split('fill="' + from + '"').join('fill="' + to + '"');
  }

  writeFileSync(path, final, { encoding: 'utf8' });

  const bytes = readFileSync(path);
  return {
    floor,
    path,
    rects: rects.length,
    records: floorRecords.length,
    claimed: claimed.size,
    decor: decor.length,
    untouched: rects.length - toNeutralise.size,
    badgeBytes: stripped.removed,
    legendBytes: legend.removed,
    unmatched,
    areas,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    bytes: bytes.length,
  };
}

function renderModule(results) {
  const entries = [];
  for (const result of results) {
    for (const [id, box] of result.areas) {
      entries.push(
        "  '" +
          id +
          "': { floor: " +
          result.floor +
          ', x: ' +
          box.x +
          ', y: ' +
          box.y +
          ', width: ' +
          box.width +
          ', height: ' +
          box.height +
          ' },'
      );
    }
  }

  return `/**
 * GENERATED FILE — do not edit by hand.
 * Regenerate with: node tools/data-extraction/extract-room-areas.mjs
 *
 * Axis-aligned bounds of each room's floor-plan area, in the SVG user-unit space of
 * frontend/public/maps/lc3/floor-{1,2}.svg — the same space Room.coordinates uses.
 *
 * RoomAreas.tsx tints these by category. Rooms absent from this map (corridor POIs such
 * as toilets and stairs, plus a couple of rooms whose seed point sits outside its rect)
 * simply render no tint; their map pins are unaffected.
 */

export interface RoomArea {
  floor: number
  x: number
  y: number
  width: number
  height: number
}

export const ROOM_AREAS: Record<string, RoomArea> = {
${entries.join('\n')}
}
`;
}

function main() {
  const seed = JSON.parse(readFileSync(SEED_PATH, 'utf8'));
  const results = FLOORS.map((f) => processFloor(f, seed.records));

  writeFileSync(OUT_PATH, renderModule(results), { encoding: 'utf8' });

  let totalClaimed = 0;
  let totalUnmatched = 0;

  for (const r of results) {
    totalClaimed += r.claimed;
    totalUnmatched += r.unmatched.length;
    console.log('floor ' + r.floor + '  (' + r.path.replace(REPO_ROOT, '.') + ')');
    console.log('  room-colour rects : ' + r.rects);
    console.log('  seed records      : ' + r.records);
    console.log('  matched -> tinted : ' + r.claimed);
    console.log('  decor neutralised : ' + r.decor);
    console.log('  left SVG-coloured : ' + r.untouched + '  (areas with no seed record)');
    console.log('  figma badge cut   : ' + r.badgeBytes + ' bytes');
    console.log('  stale legend cut  : ' + r.legendBytes + ' bytes');
    if (r.unmatched.length) {
      console.log('  UNMATCHED (' + r.unmatched.length + ') — no tint, pins still work:');
      for (const u of r.unmatched) {
        console.log('    ' + u.location_id.padEnd(20) + u.category.padEnd(16) + 'at ' + u.x + ',' + u.y);
      }
    }
    console.log('  sha256            : ' + r.sha256);
    console.log('  bytes             : ' + r.bytes);
    console.log('');
  }

  console.log('Wrote ' + OUT_PATH.replace(REPO_ROOT, '.') + ' — ' + totalClaimed + ' room areas.');
  console.log(totalUnmatched + ' records have no area geometry.');
  console.log('\nUpdate sha256 + bytes for both assets in tools/data-extraction/lc3/source/source-manifest.json.');
}

main();
