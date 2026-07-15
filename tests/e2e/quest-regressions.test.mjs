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

test('word pairing scoring is server-verifiable and rejects incomplete/tampered results', () => {
  const wordsShown = [
    { wordId: 'w1', english: 'hello', target: 'hei' },
    { wordId: 'w2', english: 'blue', target: 'sininen' },
    { wordId: 'w3', english: 'book', target: 'kirja' },
  ]

  assert.deepEqual(
    computeWordPairingResult(wordsShown, [
      { wordId: 'w1', selectedWordId: 'w1' },
      { wordId: 'w2', selectedWordId: 'w2' },
      { wordId: 'w3', selectedWordId: 'w3' },
    ]),
    {
      score: 100,
      normalizedResults: [
        { wordId: 'w1', selectedWordId: 'w1', correct: true },
        { wordId: 'w2', selectedWordId: 'w2', correct: true },
        { wordId: 'w3', selectedWordId: 'w3', correct: true },
      ],
    },
  )

  assert.equal(
    computeWordPairingResult(wordsShown, [
      { wordId: 'w1', selectedWordId: 'w1' },
      { wordId: 'w2', selectedWordId: 'w3' },
      { wordId: 'w3', selectedWordId: 'w2' },
    ])?.score,
    33,
  )

  assert.equal(
    computeWordPairingResult(wordsShown, [
      { wordId: 'w1', selectedWordId: 'w1' },
      { wordId: 'w2', selectedWordId: 'outside-payload' },
      { wordId: 'w3', selectedWordId: 'w3' },
    ]),
    null,
  )
})

test('word pairing API uses server-computed score and perfect-only XP', async () => {
  const route = await source('app/api/entries/word-pairing/route.ts')

  assert.match(route, /computeWordPairingResult\(words_shown,\s*results\)/)
  assert.doesNotMatch(route, /const\s*\{[^}]*score[^}]*\}\s*=\s*await\s+req\.json\(\)/)
  assert.match(route, /const earnedRaw = score === 100 \? basePoints : 0/)
  assert.match(route, /JSON\.stringify\(normalizedResults\)/)
})

test('word pairing difficulty level is used for initial and next rounds', async () => {
  const content = await source('components/tracks/QuestPageContent.tsx')
  const game = await source('components/game/WordPairingGame.tsx')

  assert.match(content, /initialWords=\{getRandomWords\(languagePair,\s*5,\s*level\)\}/)
  assert.match(content, /level=\{level\}/)
  assert.match(game, /getRandomWords\(languagePair,\s*5,\s*level\)/)
})

test('reading exercise difficulty levels come from track_settings', async () => {
  const routes = [
    ['app/api/entries/chinese/route.ts', 'chinese'],
    ['app/api/entries/swedish/route.ts', 'swedish'],
    ['app/api/entries/french/route.ts', 'french'],
    ['app/api/entries/english-reading/route.ts', 'english_reading'],
    ['app/api/entries/finnish-reading/route.ts', 'finnish_reading'],
  ]

  for (const [path, track] of routes) {
    const route = await source(path)
    assert.match(route, new RegExp(`current_level FROM track_settings WHERE track = '${track}'`))
    assert.match(route, /const level = settings\?\.current_level \?\? 5/)
    assert.match(route, /generateText\(withReadingTopic\([^,\n]+\(level\)\),\s*aiModel\)/)
  }
})

test('reading routes send a hard-coded random topic to live AI generation', async () => {
  const routes = [
    ['app/api/entries/chinese/route.ts', 'chinese'],
    ['app/api/entries/swedish/route.ts', 'swedish'],
    ['app/api/entries/french/route.ts', 'french'],
    ['app/api/entries/english-reading/route.ts', 'english_reading'],
    ['app/api/entries/finnish-reading/route.ts', 'finnish_reading'],
  ]

  for (const [path, language] of routes) {
    const route = await source(path)
    assert.match(route, /withReadingTopic/)
    assert.doesNotMatch(route, /getRecentReadingTexts/)
  }

  const topics = await source('lib/reading-topics.ts')
  assert.match(topics, /export const READING_TOPICS = \[/)
  assert.match(topics, /export function withReadingTopic/)
})

test('AI-generating quest routes use the configured model', async () => {
  const routes = [
    'app/api/entries/books/route.ts',
    'app/api/entries/chinese/route.ts',
    'app/api/entries/english-reading/route.ts',
    'app/api/entries/english/route.ts',
    'app/api/entries/finnish-reading/route.ts',
    'app/api/entries/finnish/route.ts',
    'app/api/entries/french/route.ts',
    'app/api/entries/math/route.ts',
    'app/api/entries/science/route.ts',
    'app/api/entries/swedish/route.ts',
  ]

  for (const path of routes) {
    const route = await source(path)
    assert.match(route, /getConfiguredAiModel/)
    const generateTextLines = route.split(/\r?\n/).filter((line) => line.includes('generateText('))
    assert.ok(generateTextLines.length > 0, `${path} should call generateText`)
    for (const line of generateTextLines) {
      assert.match(line, /generateText\(.+,\s*(aiModel|await getConfiguredAiModel\(\))\)/)
    }
  }
})

test('quest metadata is centralized for key UI and reward paths', async () => {
  const registry = await source('lib/tracks.ts')
  const dayDetail = await source('components/calendar/DayDetail.tsx')
  const settingsForm = await source('components/admin/SettingsForm.tsx')
  const rewardsQueue = await source('components/admin/RewardsQueue.tsx')
  const rewardRequest = await source('app/api/rewards/request/route.ts')

  assert.match(registry, /export const QUEST_DEFINITIONS/)
  assert.match(registry, /getEntryTableForSettingsTrack/)
  assert.match(dayDetail, /QUEST_DEFINITIONS/)
  assert.doesNotMatch(dayDetail, /const ALL_QUESTS = \[/)
  assert.match(settingsForm, /getQuestBySettingsTrack/)
  assert.doesNotMatch(settingsForm, /const HAS_LEVEL = new Set/)
  assert.match(rewardsQueue, /TRACK_LABELS/)
  assert.doesNotMatch(rewardsQueue, /const TRACK_LABELS/)
  assert.match(rewardRequest, /getEntryTableForSettingsTrack\(track\)/)
  assert.doesNotMatch(rewardRequest, /const tableByTrack/)
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
  console.error(`${failures} E2E regression test(s) failed`)
  process.exit(1)
}

console.log(`${tests.length} E2E regression tests passed`)
