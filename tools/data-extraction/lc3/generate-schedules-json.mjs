import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = join(HERE, 'lc3-schedules.seed.csv');
const JSON_PATH = join(HERE, 'lc3-schedules.seed.json');

const csv = readFileSync(CSV_PATH, 'utf8').trim().split('\n');
const headers = csv[0].split(',');

const records = csv.slice(1).map(line => {
  const values = line.split(',');
  const record = {};
  headers.forEach((h, i) => {
    record[h] = values[i];
  });
  
  // Format: partition key = room_code, sort key = schedule_slot
  // schedule_slot = ${day_of_week}#${start_time}#${event_code}
  record.schedule_slot = `${record.day_of_week}#${record.start_time}#${record.event_code}`;
  
  return record;
});

writeFileSync(JSON_PATH, JSON.stringify({ records }, null, 2));
console.log(`Wrote ${records.length} records to ${JSON_PATH}`);
