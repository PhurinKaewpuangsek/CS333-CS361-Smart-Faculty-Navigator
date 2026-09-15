#!/usr/bin/env node
/**
 * Builds the frontend and publishes it to the website bucket the stack created.
 *
 * Usage: npm run site:publish
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { banner, fail, getStackOutputs, repoRoot, run } from './lib/stack.mjs'

banner('site:publish')

const { region, outputs } = getStackOutputs()
const bucket = outputs.SiteBucketName
if (!bucket) fail('The stack has no SiteBucketName output. Deploy first: npm run deploy')

// Vite bakes VITE_API_BASE_URL into the bundle at build time, so a missing .env.local
// would publish a site that quietly calls "/api/locations" on the S3 host and shows
// an empty map. Refuse rather than ship that.
if (!existsSync(join(repoRoot, 'frontend', '.env.local'))) {
  fail('frontend/.env.local is missing, so the build would have no API URL. Run: npm run env:pull')
}

run('npm', ['--prefix', join(repoRoot, 'frontend'), 'run', 'build'])

const dist = join(repoRoot, 'frontend', 'dist')
run('aws', ['s3', 'sync', dist, `s3://${bucket}`, '--delete', '--no-progress', '--region', region])

// Asset filenames are content-hashed and may cache forever, but index.html points at
// them by name: if it is cached, the next publish serves a shell asking for deleted files.
run('aws', [
  's3',
  'cp',
  join(dist, 'index.html'),
  `s3://${bucket}/index.html`,
  '--cache-control',
  'no-cache',
  '--content-type',
  'text/html',
  '--region',
  region,
])

console.log(`\npublished to ${outputs.SiteUrl ?? `s3://${bucket}`}`)
