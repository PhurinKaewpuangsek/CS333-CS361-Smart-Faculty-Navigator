#!/usr/bin/env node
/**
 * Loads the LC3 dataset into the table your own stack owns.
 *
 * The table name comes from the stack Outputs, never from a literal: that is what
 * stops a seed run in one person's terminal from writing into the table another
 * person is demoing from.
 *
 * Usage: npm run seed  [-- --dry-run]
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { banner, fail, getStackOutputs, hasSwitch, repoRoot, run } from './lib/stack.mjs'

banner('seed')

const { region, outputs } = getStackOutputs()
const table = outputs.LocationsTableName
if (!table) fail('The stack has no LocationsTableName output. Deploy first: npm run deploy')

// The seeder lives in tools/data-extraction and brings its own AWS SDK dependencies.
const toolsDir = join(repoRoot, 'tools', 'data-extraction')
if (!existsSync(join(toolsDir, 'node_modules'))) {
  console.log('installing the seeder dependencies (first run only)...')
  run('npm', ['ci', '--prefix', toolsDir])
}

console.log(`table: ${table} (${region})\n`)

run('node', [
  join(toolsDir, 'lc3', 'seed-dynamodb.mjs'),
  '--table',
  table,
  // Passed explicitly: the Learner Lab credential block sets no default region.
  '--region',
  region,
  ...(hasSwitch('dry-run') ? ['--dry-run'] : []),
])
