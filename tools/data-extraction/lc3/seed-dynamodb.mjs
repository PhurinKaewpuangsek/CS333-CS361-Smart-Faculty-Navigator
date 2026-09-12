/**
 * Loads the LC3 seed dataset into a DynamoDB locations table.
 *
 *   node tools/data-extraction/lc3/seed-dynamodb.mjs --table <name> [--dry-run]
 *
 * The target table is never defaulted. AGENTS.md §8.4 requires a seed script to be
 * pointed at a personal Learner Lab sandbox table explicitly; production data reaches
 * the shared stack through the CD pipeline, not from someone's laptop.
 *
 * Uses BatchWriteItem (25 items per request, the DynamoDB hard limit) and retries
 * whatever the service hands back as UnprocessedItems with exponential backoff.
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SEED_PATH = join(HERE, 'lc3-locations.seed.json');

/** DynamoDB caps BatchWriteItem at 25 requests. */
const BATCH_SIZE = 25;
const MAX_RETRIES = 5;

function parseArgs(argv) {
  const args = { table: process.env.TABLE_NAME, dryRun: false, region: process.env.AWS_REGION };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--table') args.table = argv[++i];
    else if (arg.startsWith('--table=')) args.table = arg.slice('--table='.length);
    else if (arg === '--region') args.region = argv[++i];
    else if (arg.startsWith('--region=')) args.region = arg.slice('--region='.length);
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!args.table) {
    throw new Error(
      'Target table is required. Pass --table <name> or set TABLE_NAME.\n' +
        'Point this at your own sandbox table, not the shared production stack (AGENTS.md §8.4).'
    );
  }
  return args;
}

/** Splits records into BatchWriteItem-sized chunks. */
export function chunk(items, size = BATCH_SIZE) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * DynamoDB rejects empty strings inside sets and undefined values outright.
 * The seed only ever carries JSON scalars, arrays, and plain objects, so a
 * shallow undefined strip is all that is needed to make every record writable.
 */
export function toItem(record) {
  return JSON.parse(JSON.stringify(record));
}

export function readSeedRecords(seedPath = SEED_PATH) {
  const seed = JSON.parse(readFileSync(seedPath, 'utf8'));
  if (!Array.isArray(seed.records) || seed.records.length === 0) {
    throw new Error(`No records found in ${seedPath}`);
  }
  const missingKey = seed.records.find((r) => !r.location_id);
  if (missingKey) {
    throw new Error(`Every record needs a location_id (partition key); found one without.`);
  }
  return seed.records;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function writeBatch(docClient, BatchWriteCommand, tableName, batch, batchNumber) {
  let requestItems = {
    [tableName]: batch.map((record) => ({ PutRequest: { Item: toItem(record) } })),
  };

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const result = await docClient.send(new BatchWriteCommand({ RequestItems: requestItems }));
    const unprocessed = result.UnprocessedItems?.[tableName] ?? [];

    if (unprocessed.length === 0) return;

    if (attempt === MAX_RETRIES) {
      throw new Error(
        `Batch ${batchNumber}: ${unprocessed.length} items still unprocessed after ${MAX_RETRIES} retries`
      );
    }

    const backoffMs = 2 ** attempt * 100;
    console.warn(
      `  batch ${batchNumber}: ${unprocessed.length} unprocessed, retrying in ${backoffMs}ms`
    );
    await sleep(backoffMs);
    requestItems = { [tableName]: unprocessed };
  }
}

async function main() {
  const { table, dryRun, region } = parseArgs(process.argv.slice(2));
  const records = readSeedRecords();
  const batches = chunk(records);

  console.log(`Seed file : ${resolve(SEED_PATH)}`);
  console.log(`Table     : ${table}`);
  console.log(`Records   : ${records.length}`);
  console.log(`Batches   : ${batches.length} (${batches.map((b) => b.length).join('/')})`);
  console.log(`Mode      : ${dryRun ? 'DRY RUN — no AWS calls will be made' : 'WRITE'}`);
  console.log('');

  if (dryRun) {
    batches.forEach((batch, i) => {
      console.log(
        `batch ${i + 1}: ${batch.length} items  ${batch[0].location_id} … ${batch[batch.length - 1].location_id}`
      );
    });
    console.log(`\nDry run complete. ${records.length} items would be written to "${table}".`);
    return;
  }

  // Imported lazily so --dry-run works without AWS SDK credentials or network.
  const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
  const { DynamoDBDocumentClient, BatchWriteCommand } = await import('@aws-sdk/lib-dynamodb');

  const docClient = DynamoDBDocumentClient.from(
    new DynamoDBClient(region ? { region } : {}),
    { marshallOptions: { removeUndefinedValues: true } }
  );

  for (const [i, batch] of batches.entries()) {
    await writeBatch(docClient, BatchWriteCommand, table, batch, i + 1);
    console.log(`batch ${i + 1}/${batches.length}: wrote ${batch.length} items`);
  }

  console.log(`\nDone. ${records.length} items written to "${table}".`);
}

// Only run when invoked directly, so the helpers above stay unit-testable.
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    console.error(`\nSeeding failed: ${error.message}`);
    process.exitCode = 1;
  });
}
