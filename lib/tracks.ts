export type QuestCategory = 'Active' | 'Mind' | 'Home' | 'Family'

export type QuestTrack =
  | 'sport'
  | 'math'
  | 'books'
  | 'chinese'
  | 'swedish'
  | 'french'
  | 'word_english_finnish'
  | 'word_english_chinese'
  | 'word_english_swedish'
  | 'word_english_french'
  | 'piano'
  | 'english'
  | 'english-reading'
  | 'finnish'
  | 'finnish-reading'
  | 'science'
  | 'ai_project'
  | 'diary'

export interface QuestDefinition {
  track: QuestTrack
  settingsTrack: string
  table?: string
  code: string
  label: string
  title: string
  category: QuestCategory
  hasLevel?: boolean
  aiGraded?: boolean
  hasDailyTarget?: boolean
  hasPointCap?: boolean
  wordPairing?: boolean
}

export const QUEST_DEFINITIONS: QuestDefinition[] = [
  { track: 'sport', settingsTrack: 'sport', table: 'entries_sport', code: 'RUN', label: 'Sport', title: 'Sport', category: 'Active' },
  { track: 'math', settingsTrack: 'math', table: 'entries_math', code: '123', label: 'Math', title: 'Math', category: 'Mind', hasLevel: true, aiGraded: true },
  { track: 'books', settingsTrack: 'books', table: 'entries_books', code: 'BK', label: 'Books', title: 'Books', category: 'Mind' },
  { track: 'chinese', settingsTrack: 'chinese', table: 'entries_chinese', code: 'CN', label: 'Chinese', title: 'Chinese Reading', category: 'Mind', hasLevel: true },
  { track: 'swedish', settingsTrack: 'swedish', table: 'entries_swedish', code: 'SE', label: 'Swedish', title: 'Swedish Reading', category: 'Mind', hasLevel: true },
  { track: 'french', settingsTrack: 'french', table: 'entries_french', code: 'FR', label: 'French', title: 'French Reading', category: 'Mind', hasLevel: true },
  { track: 'word_english_finnish', settingsTrack: 'word_english_finnish', code: 'FI-W', label: 'Finnish words', title: 'Finnish Words', category: 'Mind', hasLevel: true, hasDailyTarget: true, hasPointCap: true, wordPairing: true },
  { track: 'word_english_chinese', settingsTrack: 'word_english_chinese', code: 'CN-W', label: 'Chinese words', title: 'Chinese Words', category: 'Mind', hasLevel: true, hasDailyTarget: true, hasPointCap: true, wordPairing: true },
  { track: 'word_english_swedish', settingsTrack: 'word_english_swedish', code: 'SE-W', label: 'Swedish words', title: 'Swedish Words', category: 'Mind', hasLevel: true, hasDailyTarget: true, hasPointCap: true, wordPairing: true },
  { track: 'word_english_french', settingsTrack: 'word_english_french', code: 'FR-W', label: 'French words', title: 'French Words', category: 'Mind', hasLevel: true, hasDailyTarget: true, hasPointCap: true, wordPairing: true },
  { track: 'piano', settingsTrack: 'piano', table: 'entries_piano', code: 'PN', label: 'Piano', title: 'Piano', category: 'Mind' },
  { track: 'english', settingsTrack: 'english', table: 'entries_english', code: 'EN', label: 'English', title: 'English Writing', category: 'Mind', hasLevel: true, aiGraded: true },
  { track: 'english-reading', settingsTrack: 'english_reading', table: 'entries_english_reading', code: 'EN-R', label: 'English Reading', title: 'English Reading', category: 'Mind', hasLevel: true },
  { track: 'finnish', settingsTrack: 'finnish', table: 'entries_finnish', code: 'FI', label: 'Finnish', title: 'Finnish Writing', category: 'Mind', hasLevel: true, aiGraded: true },
  { track: 'finnish-reading', settingsTrack: 'finnish_reading', table: 'entries_finnish_reading', code: 'FI-R', label: 'Finnish Reading', title: 'Finnish Reading', category: 'Mind', hasLevel: true },
  { track: 'science', settingsTrack: 'science', table: 'entries_science', code: 'SCI', label: 'Science', title: 'Science', category: 'Mind', hasLevel: true, aiGraded: true },
  { track: 'ai_project', settingsTrack: 'ai_project', table: 'entries_ai_project', code: 'AI', label: 'AI Project', title: 'AI Project', category: 'Mind' },
  { track: 'diary', settingsTrack: 'diary', table: 'entries_diary', code: 'DY', label: 'Diary', title: 'Diary', category: 'Mind' },
]

export const TOTAL_QUESTS = QUEST_DEFINITIONS.length
export const QUEST_BY_TRACK = Object.fromEntries(QUEST_DEFINITIONS.map((quest) => [quest.track, quest])) as Record<QuestTrack, QuestDefinition>
export const QUEST_BY_SETTINGS_TRACK = Object.fromEntries(QUEST_DEFINITIONS.map((quest) => [quest.settingsTrack, quest])) as Record<string, QuestDefinition>
export const TRACK_LABELS = Object.fromEntries(QUEST_DEFINITIONS.map((quest) => [quest.settingsTrack, quest.label])) as Record<string, string>

export function getQuestByTrack(track: string): QuestDefinition | undefined {
  return QUEST_BY_TRACK[track as QuestTrack]
}

export function getQuestBySettingsTrack(track: string): QuestDefinition | undefined {
  return QUEST_BY_SETTINGS_TRACK[track]
}

export function getEntryTableForSettingsTrack(track: string): string | null {
  return getQuestBySettingsTrack(track)?.table ?? null
}
