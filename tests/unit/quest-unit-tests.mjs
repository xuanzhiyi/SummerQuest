import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { computeWordPairingResult } from '../../lib/word-pairing-scoring.js'

const root = new URL('../../', import.meta.url)
const tests = []

function test(name, fn) {
  tests.push({ name, fn })
}

async function source(path) {
  return readFile(new URL(path, root), 'utf8')
}

const sampleWords = [
  { wordId: 'w1', english: 'hello', target: 'hei' },
  { wordId: 'w2', english: 'blue', target: 'sininen' },
  { wordId: 'w3', english: 'book', target: 'kirja' },
]

test('word-pairing scorer returns 100 only when every selected id matches the source id', () => {
  const result = computeWordPairingResult(sampleWords, [
    { wordId: 'w1', selectedWordId: 'w1' },
    { wordId: 'w2', selectedWordId: 'w2' },
    { wordId: 'w3', selectedWordId: 'w3' },
  ])

  assert.equal(result.score, 100)
  assert.deepEqual(result.normalizedResults, [
    { wordId: 'w1', selectedWordId: 'w1', correct: true },
    { wordId: 'w2', selectedWordId: 'w2', correct: true },
    { wordId: 'w3', selectedWordId: 'w3', correct: true },
  ])
})

test('word-pairing scorer rounds partial scores consistently', () => {
  assert.equal(
    computeWordPairingResult(sampleWords, [
      { wordId: 'w1', selectedWordId: 'w1' },
      { wordId: 'w2', selectedWordId: 'w3' },
      { wordId: 'w3', selectedWordId: 'w2' },
    ]).score,
    33,
  )
})

test('word-pairing scorer rejects empty or non-array payloads', () => {
  assert.equal(computeWordPairingResult([], []), null)
  assert.equal(computeWordPairingResult(null, []), null)
  assert.equal(computeWordPairingResult(sampleWords, null), null)
})

test('word-pairing scorer rejects missing, duplicate, and foreign answers', () => {
  assert.equal(
    computeWordPairingResult(sampleWords, [
      { wordId: 'w1', selectedWordId: 'w1' },
      { wordId: 'w2', selectedWordId: 'w2' },
    ]),
    null,
  )

  assert.equal(
    computeWordPairingResult(sampleWords, [
      { wordId: 'w1', selectedWordId: 'w1' },
      { wordId: 'w1', selectedWordId: 'w1' },
      { wordId: 'w3', selectedWordId: 'w3' },
    ]),
    null,
  )

  assert.equal(
    computeWordPairingResult(sampleWords, [
      { wordId: 'w1', selectedWordId: 'w1' },
      { wordId: 'w2', selectedWordId: 'outside-payload' },
      { wordId: 'w3', selectedWordId: 'w3' },
    ]),
    null,
  )
})

test('word-pairing scorer rejects duplicate displayed word ids', () => {
  assert.equal(
    computeWordPairingResult(
      [
        { wordId: 'w1', english: 'hello', target: 'hei' },
        { wordId: 'w1', english: 'hello again', target: 'moi' },
      ],
      [
        { wordId: 'w1', selectedWordId: 'w1' },
        { wordId: 'w1', selectedWordId: 'w1' },
      ],
    ),
    null,
  )
})

test('quest registry has unique tracks and settings keys', async () => {
  const registry = await source('lib/tracks.ts')
  const trackMatches = [...registry.matchAll(/track: '([^']+)'/g)].map((match) => match[1])
  const settingsMatches = [...registry.matchAll(/settingsTrack: '([^']+)'/g)].map((match) => match[1])

  assert.equal(trackMatches.length, 18)
  assert.equal(new Set(trackMatches).size, trackMatches.length)
  assert.equal(new Set(settingsMatches).size, settingsMatches.length)
  assert.ok(settingsMatches.includes('english_reading'))
  assert.ok(settingsMatches.includes('finnish_reading'))
})

test('quest registry keeps word-pairing tracks capability-complete and table-free', async () => {
  const registry = await source('lib/tracks.ts')
  const entries = registry.match(/\{ track: 'word_[^}]+\}/g) ?? []

  assert.equal(entries.length, 4)
  for (const entry of entries) {
    assert.match(entry, /hasLevel: true/)
    assert.match(entry, /hasDailyTarget: true/)
    assert.match(entry, /hasPointCap: true/)
    assert.match(entry, /wordPairing: true/)
    assert.doesNotMatch(entry, /table:/)
  }
})

test('reward request route uses the registry whitelist before unsafe SQL table interpolation', async () => {
  const route = await source('app/api/rewards/request/route.ts')

  assert.match(route, /import \{ getEntryTableForSettingsTrack \} from '@\/lib\/tracks'/)
  assert.match(route, /const table = getEntryTableForSettingsTrack\(track\)/)
  assert.match(route, /if \(!table\) return 0/)
  assert.match(route, /sql\.unsafe/)
  assert.doesNotMatch(route, /const tableByTrack/)
})

test('daily and admin quest UIs depend on the central quest registry', async () => {
  const files = [
    await source('components/calendar/DayDetail.tsx'),
    await source('components/admin/SettingsForm.tsx'),
    await source('components/admin/RewardsQueue.tsx'),
    await source('components/ProgressView.tsx'),
  ]

  assert.match(files[0], /QUEST_DEFINITIONS/)
  assert.match(files[1], /getQuestBySettingsTrack/)
  assert.match(files[2], /TRACK_LABELS/)
  assert.match(files[3], /TRACK_LABELS/)

  for (const file of files) {
    assert.doesNotMatch(file, /const TRACK_LABELS/)
  }
})

let failures = 0
for (const { name, fn } of tests) {
  try {
    await fn()
    console.log(`PASS ${name}`)
  } catch (error) {
    failures += 1
    console.error(`FAIL ${name}`)
    console.error(error)
  }
}

if (failures > 0) {
  console.error(`${failures} unit test(s) failed`)
  process.exit(1)
}

console.log(`${tests.length} unit tests passed`)
