#!/usr/bin/env node
/**
 * Empties the website bucket.
 *
 * CloudFormation refuses to delete a bucket that still holds objects, so `sam delete`
 * fails halfway through and leaves a half-torn-down stack unless this runs first.
 *
 * Usage: npm run site:empty  [-- --yes]
 */
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { banner, fail, getStackOutputs, hasSwitch, run } from './lib/stack.mjs'

banner('site:empty')

const { region, outputs } = getStackOutputs()
const bucket = outputs.SiteBucketName
if (!bucket) fail('The stack has no SiteBucketName output — there is nothing to empty.')

if (!hasSwitch('yes')) {
  const rl = createInterface({ input: stdin, output: stdout })
  const answer = await rl.question(`Delete every object in ${bucket}? Type the bucket name to confirm: `)
  rl.close()
  if (answer.trim() !== bucket) fail('Name did not match — nothing was deleted.')
}

run('aws', ['s3', 'rm', `s3://${bucket}`, '--recursive', '--region', region])
console.log(`\n${bucket} is empty. You can now run: sam delete`)
