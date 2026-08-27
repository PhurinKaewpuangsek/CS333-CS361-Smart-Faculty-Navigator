/**
 * Validates the BR3 seed dataset against its provenance manifest and the invariants that
 * make the coordinates trustworthy.
 *
 *   node --test database/tools/validate-br3-seed.mjs
 *
 * Uses node:test and node:assert from the Node 24 stdlib. No npm dependency, because
 * AGENTS.md §8.3 forbids installing at the repo root and no service owns this data.
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DATASET_DIR = join(REPO_ROOT, 'database', 'datasets', 'br3');

const read = (...p) => readFileSync(join(DATASET_DIR, ...p), 'utf8');
const readJson = (...p) => JSON.parse(read(...p));

const manifest = readJson('source', 'source-manifest.json');
const seed = readJson('br3-locations.seed.json');
const seedCsvText = read('br3-locations.seed.csv');
const inventoryText = read('reports', 'node-inventory.csv');

const floorsById = new Map(seed.floors.map((f) => [f.map_asset_id, f]));
const byId = new Map(seed.records.map((r) => [r.location_id, r]));

/** Minimal RFC 4180 reader. */
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

const seedCsv = parseCsv(seedCsvText);

/* --------------------------------------------------------------------- provenance ----- */

test('assets and source graph match the hashes recorded in the manifest', () => {
  const sha = (p) => createHash('sha256').update(readFileSync(join(REPO_ROOT, p))).digest('hex');
  assert.equal(sha(manifest.graph.dest_path), manifest.graph.sha256, 'graph.source.json drifted');
  for (const asset of manifest.assets) {
    assert.equal(sha(asset.dest_path), asset.sha256, `${asset.dest_path} drifted`);
  }
});

test('each asset declares the viewBox the manifest and seed rely on', () => {
  for (const asset of manifest.assets) {
    const head = readFileSync(join(REPO_ROOT, asset.dest_path), 'utf8').slice(0, 400);
    assert.equal(/viewBox="([^"]+)"/.exec(head)?.[1], asset.viewbox.join(' '), asset.dest_path);
  }
});

test('assets are LF, because the manifest hashes are of the upstream LF blob', () => {
  for (const asset of manifest.assets) {
    const bytes = readFileSync(join(REPO_ROOT, asset.dest_path));
    assert.equal(bytes.includes('\r\n'), false, `${asset.dest_path} contains CRLF`);
  }
});

/* --------------------------------------------------------------------- invariants ----- */

test('identifiers are unique', () => {
  assert.equal(byId.size, seed.records.length, 'duplicate location_id');
  const rooms = seed.records.filter((r) => r.location_kind === 'room');
  assert.equal(new Set(rooms.map((r) => r.room_code)).size, rooms.length, 'duplicate room_code');
  assert.equal(new Set(seed.records.map((r) => r.source.node_id)).size, seed.records.length, 'duplicate source node');
});

test('aliases do not collide across different locations', () => {
  const owner = new Map();
  for (const r of seed.records) {
    for (const alias of r.aliases) {
      const previous = owner.get(alias);
      assert.equal(previous, undefined, `alias "${alias}" claimed by both ${previous} and ${r.location_id}`);
      owner.set(alias, r.location_id);
    }
  }
});

test('every room carries Latin and Thai search forms', () => {
  for (const r of seed.records.filter((x) => x.location_kind === 'room')) {
    for (const prefix of ['BR3-', 'LC3-', 'บร3-', 'บร.3-']) {
      assert.ok(r.aliases.some((a) => a.startsWith(prefix)), `${r.location_id} has no "${prefix}" alias`);
    }
  }
});

test('coordinates equal source plus the floor transform, and land inside the viewBox', () => {
  for (const r of seed.records) {
    const floor = floorsById.get(r.map_asset_id);
    assert.ok(floor, `${r.location_id} references unknown asset ${r.map_asset_id}`);
    assert.equal(floor.floor, r.floor, `${r.location_id} asset/floor mismatch`);
    const { translate_x: dx, translate_y: dy } = floor.coordinate_transform;
    assert.equal(r.source.translation.dx, dx, `${r.location_id} records a stale dx`);
    assert.equal(r.source.translation.dy, dy, `${r.location_id} records a stale dy`);
    assert.equal(r.x, r.source.x + dx, `${r.location_id} x is not source.x + dx`);
    assert.equal(r.y, r.source.y + dy, `${r.location_id} y is not source.y + dy`);
    const [, , w, h] = floor.viewbox;
    assert.ok(r.x >= 0 && r.x <= w, `${r.location_id} x=${r.x} outside 0..${w}`);
    assert.ok(r.y >= 0 && r.y <= h, `${r.location_id} y=${r.y} outside 0..${h}`);
  }
});

test('no two locations on a floor share a pin position', () => {
  const seen = new Map();
  for (const r of seed.records) {
    const key = `${r.floor}:${r.x},${r.y}`;
    assert.equal(seen.get(key), undefined, `${r.location_id} and ${seen.get(key)} share ${key}`);
    seen.set(key, r.location_id);
  }
});

test('every landmark reference resolves to a real location on the same floor', () => {
  for (const r of seed.records) {
    for (const l of r.landmarks) {
      const target = byId.get(l.ref_location_id);
      assert.ok(target, `${r.location_id} references missing landmark ${l.ref_location_id}`);
      assert.equal(target.floor, r.floor, `${r.location_id} references a landmark on another floor`);
      assert.notEqual(target.location_id, r.location_id, `${r.location_id} is its own landmark`);
    }
  }
});

/* ------------------------------------------------------------------- truthfulness ----- */

test('nothing claims field verification without survey evidence', () => {
  // The whole point of the verification block: "field_verified" must mean somebody checked.
  const survey = parseCsv(read('survey', 'br3-field-survey.template.csv'));
  const evidenced = new Set(survey.filter((s) => s.evidence_ref.trim()).map((s) => s.source_node_id));
  for (const r of seed.records) {
    for (const [field, status] of Object.entries(r.verification)) {
      if (status !== 'field_verified') continue;
      assert.ok(evidenced.has(r.source.node_id), `${r.location_id}.${field} claims field_verified with no survey evidence_ref`);
    }
  }
});

test('detail_th never asserts an unverified landmark', () => {
  for (const r of seed.records) {
    if (r.verification.landmarks === 'field_verified') continue;
    assert.ok(!r.detail_th.includes('ใกล้'), `${r.location_id} detail_th asserts proximity that nobody verified`);
  }
});

test('no placeholder text survived into the dataset', () => {
  const banned = /\b(TBD|TODO|FIXME|unknown|XXX|N\/A)\b/i;
  for (const r of seed.records) {
    for (const field of ['name_th', 'detail_th', 'room_code']) {
      assert.ok(!banned.test(r[field]), `${r.location_id}.${field} contains placeholder text: ${r[field]}`);
    }
  }
});

test('unnamed rooms are flagged rather than silently given a name', () => {
  for (const r of seed.records) {
    const unnamed = r.name_th === '';
    assert.equal(
      unnamed,
      r.flags.includes('needs_field_validation'),
      `${r.location_id}: empty name and needs_field_validation flag disagree`
    );
    if (unnamed) {
      assert.equal(r.category, 'unknown');
      assert.equal(r.verification.name_th, 'pending_survey');
    }
  }
});

test('no labelled room fell through the category rules', () => {
  for (const r of seed.records) {
    if (r.name_th && r.location_kind === 'room') {
      assert.notEqual(r.category, 'unknown', `${r.location_id} has a name but no category`);
    }
  }
});

/* ------------------------------------------------------------- JSON / CSV agreement ---- */

test('CSV and JSON describe exactly the same records', () => {
  assert.equal(seedCsv.length, seed.records.length, 'row count differs');
  for (const row of seedCsv) {
    const r = byId.get(row.location_id);
    assert.ok(r, `CSV row ${row.location_id} is not in the JSON`);
    assert.equal(row.room_code, r.room_code);
    assert.equal(Number(row.floor), r.floor);
    assert.equal(Number(row.x), r.x);
    assert.equal(Number(row.y), r.y);
    assert.equal(row.name_th, r.name_th);
    assert.equal(row.category, r.category);
    assert.equal(row.detail_th, r.detail_th);
    assert.equal(row.aliases, r.aliases.join('|'));
    assert.equal(row.landmarks, r.landmarks.map((l) => `${l.kind}:${l.ref_location_id}:${l.walk_hops}`).join('|'));
  }
});

test('no field value contains the pipe used as the CSV multi-value separator', () => {
  for (const r of seed.records) {
    for (const value of [r.name_th, r.detail_th, r.room_code, ...r.aliases]) {
      assert.ok(!String(value).includes('|'), `${r.location_id} contains a literal pipe: ${value}`);
    }
  }
});

test('generated files are LF and end with exactly one newline', () => {
  for (const [name, text] of [['seed.csv', seedCsvText], ['node-inventory.csv', inventoryText]]) {
    assert.ok(!text.includes('\r'), `${name} contains CR`);
    assert.ok(text.endsWith('\n') && !text.endsWith('\n\n'), `${name} newline ending`);
  }
});

/* ------------------------------------------------------------------------ coverage ---- */

test('every source node is accounted for exactly once', () => {
  const inventory = parseCsv(inventoryText);
  assert.equal(inventory.length, manifest.graph.node_count, 'inventory does not cover all source nodes');
  assert.equal(new Set(inventory.map((r) => r.source_node_id)).size, inventory.length, 'duplicate node in inventory');
  for (const row of inventory) {
    assert.ok(row.disposition, `${row.source_node_id} has no disposition`);
    if (row.disposition !== 'include') {
      assert.ok(row.reason, `${row.source_node_id} excluded with no reason`);
    }
  }
  const included = inventory.filter((r) => r.disposition === 'include');
  assert.equal(included.length, seed.records.length, 'inventory includes differ from seed records');
});

test('QR anchors are excluded — they are deep-link targets, not rooms', () => {
  const inventory = parseCsv(inventoryText);
  const qr = inventory.filter((r) => /^QR\d+$/.test(r.source_name));
  assert.equal(qr.length, 8);
  for (const row of qr) {
    assert.equal(row.disposition, 'exclude_out_of_scope');
    assert.equal(row.reason, 'qr_anchor_not_a_room');
  }
});

test('no routing topology leaked into the seed', () => {
  for (const r of seed.records) {
    assert.ok(['room', 'facility', 'stairs'].includes(r.source.node_type), `${r.location_id} came from a ${r.source.node_type} node`);
  }
  assert.ok(!('edges' in seed), 'seed document carries edges');
});
