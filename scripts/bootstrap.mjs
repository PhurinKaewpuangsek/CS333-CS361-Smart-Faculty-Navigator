#!/usr/bin/env node
/**
 * One command that turns an empty AWS Academy account into a working environment:
 * deploy the stack, load the data, point the frontend at it, publish the site, and
 * prove it all works.
 *
 * Usage:
 *   npm run bootstrap
 *   npm run bootstrap -- --skip-deploy    # frontend-only loop, nothing in the cloud changed
 */
import { join } from 'node:path'
import { banner, getStackOutputs, hasSwitch, repoRoot, run } from './lib/stack.mjs'

const script = (name) => join(repoRoot, 'scripts', name)

if (!hasSwitch('skip-deploy')) {
  banner('deploy')
  // samconfig.toml supplies the stack name, region, and capabilities.
  run('sam', ['build'])
  run('sam', ['deploy', '--no-confirm-changeset', '--no-fail-on-empty-changeset'])
}

run('node', [script('seed.mjs')])
run('node', [script('write-env.mjs')])
run('node', [script('publish-site.mjs')])
run('node', [script('verify.mjs')])

const { outputs } = getStackOutputs()
banner('ready')
console.log(`site : ${outputs.SiteUrl}`)
console.log(`api  : ${outputs.ApiUrl}/api/locations`)
console.log(`table: ${outputs.LocationsTableName}`)
console.log('\nlocal dev against this same API: npm run dev')
