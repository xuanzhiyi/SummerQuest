export type Role = 'admin' | 'child' | 'viewer'

export type Track =
  | 'books'
  | 'english'
  | 'finnish'
  | 'chinese'
  | 'swedish'
  | 'french'
  | 'math'
  | 'science'
  | 'ai_project'
  | 'sport'
  | 'piano'

export const AI_GRADED_TRACKS: Track[] = ['english', 'finnish', 'math', 'science']
export const READING_TRACKS: Track[] = ['chinese', 'swedish', 'french']
export const DAILY_TRACKS: Track[] = ['sport', 'math', 'chinese', 'swedish', 'french', 'books']

// Effort signal shown on calendar tiles (derived from weighted AI score)
export type EffortSignal = 'great' | 'good' | 'keep_practicing'

export function scoreToEffortSignal(score: number): EffortSignal {
  if (score >= 75) return 'great'
  if (score >= 40) return 'good'
  return 'keep_practicing'
}

export const EFFORT_SIGNAL_LABEL: Record<EffortSignal, string> = {
  great: '🌟 Great',
  good: '👍 Good',
  keep_practicing: '🌱 Keep practicing',
}

export interface User {
  id: number
  name: string
  role: Role
  username?: string
  email?: string
}

export interface TrackSettings {
  track: Track
  current_level: number
  effort_weight: number
  points_per_entry: number
  updated_at: string
}

export interface RewardThreshold {
  id: number
  track: Track
  points_required: number
  reward_description: string
  requested_at: string | null
  fulfilled_at: string | null
  dismissed_at: string | null
  created_at: string
}

// Calendar tile data (one per day)
export interface DayTile {
  date: string // YYYY-MM-DD
  total_points: number
  completed_quests: number  // distinct tracks with at least one entry
  effort_signal: EffortSignal | null // null if no AI-graded entries that day
}

export const TOTAL_QUESTS = 15 // 11 regular tracks + 4 word pairing language pairs
