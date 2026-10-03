export const REQUIRED_FLUENCY_ATTEMPTS = 3
export const MIN_READING_SECONDS = 5
export const MAX_READING_SECONDS = 30 * 60
export const MAX_CORRECT_WORDS_PER_MINUTE = 2000

export interface FluencyAttempt {
  duration_seconds: number
  errors: number
  correct_words_per_minute: number
}

export function countReadingWords(text: string): number {
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/u).length : 0
}

export function createFluencyAttempt(text: string, durationSeconds: unknown, errors: unknown): FluencyAttempt | null {
  const wordCount = countReadingWords(text)
  if (!wordCount
    || !Number.isInteger(durationSeconds)
    || (durationSeconds as number) < MIN_READING_SECONDS
    || (durationSeconds as number) > MAX_READING_SECONDS
    || !Number.isInteger(errors)
    || (errors as number) < 0
    || (errors as number) > wordCount) {
    return null
  }

  return {
    duration_seconds: durationSeconds as number,
    errors: errors as number,
    correct_words_per_minute: Math.round(((wordCount - (errors as number)) * 60) / (durationSeconds as number)),
  }
}

export function isValidFluencyAttempts(value: unknown): value is FluencyAttempt[] {
  return Array.isArray(value)
    && value.length === REQUIRED_FLUENCY_ATTEMPTS
    && value.every(isValidFluencyAttempt)
}

export function isValidFluencyAttempt(value: unknown): value is FluencyAttempt {
  if (typeof value !== 'object' || value === null) return false
  const attempt = value as FluencyAttempt
  return Number.isInteger(attempt.duration_seconds)
    && attempt.duration_seconds >= MIN_READING_SECONDS
    && attempt.duration_seconds <= MAX_READING_SECONDS
    && Number.isInteger(attempt.errors)
    && attempt.errors >= 0
    && Number.isInteger(attempt.correct_words_per_minute)
    && attempt.correct_words_per_minute >= 0
    && attempt.correct_words_per_minute <= MAX_CORRECT_WORDS_PER_MINUTE
}
