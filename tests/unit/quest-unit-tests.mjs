import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { computeWordPairingResult } from '../../lib/word-pairing-scoring.js'
import { MIN_WRITING_CHARACTERS, validateWritingLength, writingCharacterCount } from '../../lib/writing-validation.ts'
import { READING_TOPICS, withReadingTopic } from '../../lib/reading-topics.ts'

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

test('writing prompts use a 100-topic pool instead of the old repeated prompts', async () => {
  const prompts = await source('lib/ai/prompts.ts')
  const topicBlock = prompts.match(/const WRITING_TOPIC_STEMS = \[([\s\S]*?)\n\]/)
  assert.ok(topicBlock, 'WRITING_TOPIC_STEMS should exist')

  const topics = [...topicBlock[1].matchAll(/'([^']+)'/g)].map((match) => match[1])
  assert.equal(topics.length, 100)
  assert.equal(new Set(topics).size, 100)
  assert.match(prompts, /export const ENGLISH_WRITING_PROMPTS = WRITING_TOPIC_STEMS\.map/)
  assert.match(prompts, /export const FINNISH_WRITING_PROMPTS = WRITING_TOPIC_STEMS\.map/)
  assert.doesNotMatch(prompts, /export const ENGLISH_WRITING_PROMPTS = \[\s*'Describe your perfect summer day\.'/)
  assert.doesNotMatch(prompts, /export const FINNISH_WRITING_PROMPTS = \[/)
})

test('writing validation enforces the configured character minimum consistently', () => {
  assert.equal(writingCharacterCount(`  ${'a'.repeat(MIN_WRITING_CHARACTERS)}  `), MIN_WRITING_CHARACTERS)
  assert.deepEqual(validateWritingLength('a'.repeat(MIN_WRITING_CHARACTERS)), { ok: true, count: MIN_WRITING_CHARACTERS })

  const short = validateWritingLength('a'.repeat(MIN_WRITING_CHARACTERS - 1))
  assert.equal(short.ok, false)
  assert.equal(short.count, MIN_WRITING_CHARACTERS - 1)
  assert.match(short.error, new RegExp(`at least ${MIN_WRITING_CHARACTERS} characters`))
})

test('writing UI and APIs use shared character-length validation', async () => {
  const form = await source('components/tracks/WritingForm.tsx')
  const englishRoute = await source('app/api/entries/english/route.ts')
  const finnishRoute = await source('app/api/entries/finnish/route.ts')

  assert.match(form, /MIN_WRITING_CHARACTERS/)
  assert.match(form, /writingCharacterCount\(paragraph\)/)
  assert.match(form, /disabled=\{loading \|\| !hasMinimumLength\}/)

  for (const route of [englishRoute, finnishRoute]) {
    assert.match(route, /validateWritingLength\(paragraph\)/)
    assert.match(route, /character_count: lengthValidation\.count/)
  }
})

test('reading topic pool feeds one hard-coded topic to the live AI prompt', () => {
  const prompt = withReadingTopic('Generate a passage.', 'a quiet forest path with an unexpected discovery')

  assert.match(prompt, /Generate a passage\./)
  assert.match(prompt, /Use this specific topic/)
  assert.match(prompt, /a quiet forest path with an unexpected discovery/)
  assert.equal(READING_TOPICS.length, 50)
  assert.equal(new Set(READING_TOPICS).size, 50)
})

test('diary feedback prompt includes current diary and previous diary context without scoring', async () => {
  const prompts = await source('lib/ai/prompts.ts')
  const promptBlock = prompts.slice(
    prompts.indexOf('export function diaryFeedbackPrompt'),
    prompts.indexOf('export function englishFeedbackPrompt'),
  )

  assert.match(promptBlock, /export function diaryFeedbackPrompt/)
  assert.match(promptBlock, /previousDiaryContext\(previousEntries\)/)
  assert.match(promptBlock, /Current diary language/)
  assert.match(promptBlock, /Current diary:/)
  assert.match(promptBlock, /connect today's entry to a past mood, interest, habit, or progress pattern/)
  assert.doesNotMatch(promptBlock, /SCORE:/)
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
