#!/usr/bin/env node
/**
 * Health check for your own AWS environment: infrastructure, data, API, and site.
 *
 * Answers the question "is my cloud actually working?" without anyone having to
 * remember seven aws commands. Every check prints [PASS] or [FAIL] and the run
 * continues after a failure, so one broken layer does not hide the rest.
 *
 * Usage: npm run verify
 */
import { awsJson, banner, expectedRecordCount, getStackOutputs } from './lib/stack.mjs'

const results = []

function check(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then((detail) => results.push({ ok: true, name, detail }))
    .catch((error) => results.push({ ok: false, name, detail: error.message }))
}

const expect = (condition, message) => {
  if (!condition) throw new Error(message)
}

banner('verify')

const { stackName, region, status, outputs } = getStackOutputs()
const expected = expectedRecordCount()

await check('stack status', async () => {
  expect(
    ['CREATE_COMPLETE', 'UPDATE_COMPLETE'].includes(status),
    `${stackName} is ${status}`
  )
  return `${stackName} ${status} (${region})`
})

await check('stack outputs', async () => {
  const missing = ['ApiUrl', 'SiteUrl', 'SiteBucketName', 'LocationsTableName'].filter(
    (key) => !outputs[key]
  )
  expect(missing.length === 0, `missing output(s): ${missing.join(', ')}`)
  return Object.keys(outputs).length + ' outputs present'
})

await check('table item count', async () => {
  expect(Boolean(outputs.LocationsTableName), 'no table to scan')
  const data = awsJson([
    'dynamodb',
    'scan',
    '--table-name',
    outputs.LocationsTableName,
    '--select',
    'COUNT',
    '--region',
    region,
  ])
  expect(data.Count === expected, `${outputs.LocationsTableName} holds ${data.Count}, expected ${expected} — run: npm run seed`)
  return `${data.Count} items in ${outputs.LocationsTableName}`
})

await check('GET /api/locations', async () => {
  expect(Boolean(outputs.ApiUrl), 'no ApiUrl output')
  const response = await fetch(`${outputs.ApiUrl}/api/locations`)
  expect(response.status === 200, `HTTP ${response.status}`)
  expect(
    response.headers.get('access-control-allow-origin') === '*',
    'missing Access-Control-Allow-Origin: * — the browser will block this'
  )
  const body = await response.json()
  expect(body.count === expected, `API returned ${body.count} records, expected ${expected}`)
  return `200, ${body.count} records, CORS header present`
})

await check('OPTIONS preflight', async () => {
  const response = await fetch(`${outputs.ApiUrl}/api/locations`, {
    method: 'OPTIONS',
    headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'GET' },
  })
  expect([200, 204].includes(response.status), `HTTP ${response.status}`)
  const allowed = response.headers.get('access-control-allow-methods') ?? ''
  expect(/GET/.test(allowed) && /PUT/.test(allowed), `Allow-Methods is "${allowed}"`)
  return `${response.status}, allows ${allowed}`
})

await check('site root', async () => {
  expect(Boolean(outputs.SiteUrl), 'no SiteUrl output')
  const response = await fetch(outputs.SiteUrl)
  expect(response.status === 200, `HTTP ${response.status} — has the site been published? npm run site:publish`)
  const html = await response.text()
  expect(html.includes('id="root"'), 'the page served is not the app shell')
  return `200 from ${outputs.SiteUrl}`
})

await check('site SPA fallback', async () => {
  const response = await fetch(`${outputs.SiteUrl}/this-path-does-not-exist`)
  const html = await response.text()
  // An S3 website endpoint serves ErrorDocument with the 404 status, and only
  // CloudFront could rewrite that to 200. What matters is that the browser gets the
  // app shell rather than S3's XML error page, so the app still loads on a deep link.
  expect(
    html.includes('id="root"'),
    `HTTP ${response.status} and the body is not the app shell — ErrorDocument is not index.html`
  )
  return `unknown paths return the app (HTTP ${response.status}, as S3 website endpoints do)`
})

console.log('')
for (const { ok, name, detail } of results) {
  console.log(`${ok ? '[PASS]' : '[FAIL]'} ${name} — ${detail}`)
}

const failed = results.filter((r) => !r.ok).length
console.log(`\n${results.length - failed}/${results.length} checks passed`)
if (failed) process.exit(1)
