import sql from './db'
import { scoreToEffortSignal, type DayTile, type EffortSignal, TOTAL_QUESTS } from '@/types'

export const PROGRAM_START = '2026-06-26'
export const PROGRAM_END = '2026-08-12'

export function programDates(): string[] {
  const dates: string[] = []
  const cur = new Date(PROGRAM_START)
  const end = new Date(PROGRAM_END)
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

export function isToday(date: string): boolean {
  return date === new Date().toISOString().slice(0, 10)
}

export function isPast(date: string): boolean {
  return date < new Date().toISOString().slice(0, 10)
}

// Load daily point totals and effort signals for all program days
export async function getCalendarTiles(userId: number): Promise<DayTile[]> {
  // Gather points from all per-track tables joined with current settings
  const pointsRows = await sql`
    WITH daily AS (
      SELECT date, SUM(pts) AS total_points FROM (
        SELECT date, points_per_entry AS pts FROM entries_books     JOIN track_settings ON track = 'books'      WHERE user_id = ${userId}
        UNION ALL
        SELECT date, points_per_entry AS pts FROM entries_english   JOIN track_settings ON track = 'english'    WHERE user_id = ${userId}
        UNION ALL
        SELECT date, points_per_entry AS pts FROM entries_finnish   JOIN track_settings ON track = 'finnish'    WHERE user_id = ${userId}
        UNION ALL
        SELECT date, points_per_entry AS pts FROM entries_chinese   JOIN track_settings ON track = 'chinese'    WHERE user_id = ${userId}
        UNION ALL
        SELECT date, points_per_entry AS pts FROM entries_swedish   JOIN track_settings ON track = 'swedish'    WHERE user_id = ${userId}
        UNION ALL
        SELECT date, points_per_entry AS pts FROM entries_french    JOIN track_settings ON track = 'french'     WHERE user_id = ${userId}
        UNION ALL
        SELECT date, points_per_entry AS pts FROM entries_math      JOIN track_settings ON track = 'math'       WHERE user_id = ${userId}
        UNION ALL
        SELECT date, points_per_entry AS pts FROM entries_science   JOIN track_settings ON track = 'science'    WHERE user_id = ${userId}
        UNION ALL
        SELECT date, points_per_entry AS pts FROM entries_ai_project JOIN track_settings ON track = 'ai_project' WHERE user_id = ${userId}
        UNION ALL
        SELECT date, points_per_entry AS pts FROM entries_sport     JOIN track_settings ON track = 'sport'      WHERE user_id = ${userId}
        UNION ALL
        SELECT date, points_per_entry AS pts FROM entries_piano     JOIN track_settings ON track = 'piano'      WHERE user_id = ${userId}
      ) all_entries
      GROUP BY date
    )
    SELECT date, total_points FROM daily
  `

  // Count distinct completed quests per day
  const questCountRows = await sql`
    SELECT date, COUNT(DISTINCT track) AS quest_count FROM (
      SELECT date, 'books'       AS track FROM entries_books       WHERE user_id = ${userId}
      UNION ALL
      SELECT date, 'english'              FROM entries_english      WHERE user_id = ${userId}
      UNION ALL
      SELECT date, 'finnish'              FROM entries_finnish      WHERE user_id = ${userId}
      UNION ALL
      SELECT date, 'chinese'              FROM entries_chinese      WHERE user_id = ${userId}
      UNION ALL
      SELECT date, 'swedish'              FROM entries_swedish      WHERE user_id = ${userId}
      UNION ALL
      SELECT date, 'french'               FROM entries_french       WHERE user_id = ${userId}
      UNION ALL
      SELECT date, 'math'                 FROM entries_math         WHERE user_id = ${userId}
      UNION ALL
      SELECT date, 'science'              FROM entries_science      WHERE user_id = ${userId}
      UNION ALL
      SELECT date, 'ai_project'           FROM entries_ai_project   WHERE user_id = ${userId}
      UNION ALL
      SELECT date, 'sport'                FROM entries_sport        WHERE user_id = ${userId}
      UNION ALL
      SELECT date, 'piano'                FROM entries_piano        WHERE user_id = ${userId}
      UNION ALL
      SELECT date, 'word_' || language_pair FROM entries_word_pairing WHERE user_id = ${userId}
    ) all_tracks
    GROUP BY date
  `

  const questCountMap = new Map<string, number>()
  for (const row of questCountRows) {
    questCountMap.set(String(row.date).slice(0, 10), Number(row.quest_count))
  }

  // Gather weighted AI scores per day (english, finnish, math, science only)
  const signalRows = await sql`
    WITH ai_entries AS (
      SELECT date, ai_score, effort_weight FROM entries_english  JOIN track_settings ON track = 'english'  WHERE user_id = ${userId} AND ai_score IS NOT NULL
      UNION ALL
      SELECT date, ai_score, effort_weight FROM entries_finnish  JOIN track_settings ON track = 'finnish'  WHERE user_id = ${userId} AND ai_score IS NOT NULL
      UNION ALL
      SELECT date, ai_score, effort_weight FROM entries_math     JOIN track_settings ON track = 'math'     WHERE user_id = ${userId} AND ai_score IS NOT NULL
      UNION ALL
      SELECT date, ai_score, effort_weight FROM entries_science  JOIN track_settings ON track = 'science'  WHERE user_id = ${userId} AND ai_score IS NOT NULL
    )
    SELECT
      date,
      SUM(ai_score * effort_weight) / NULLIF(SUM(effort_weight), 0) AS weighted_score
    FROM ai_entries
    GROUP BY date
  `

  const pointsMap = new Map<string, number>()
  for (const row of pointsRows) {
    pointsMap.set(String(row.date).slice(0, 10), Number(row.total_points))
  }

  const signalMap = new Map<string, EffortSignal>()
  for (const row of signalRows) {
    const date = String(row.date).slice(0, 10)
    signalMap.set(date, scoreToEffortSignal(Number(row.weighted_score)))
  }

  return programDates().map((date) => ({
    date,
    total_points: pointsMap.get(date) ?? 0,
    completed_quests: questCountMap.get(date) ?? 0,
    effort_signal: signalMap.get(date) ?? null,
  }))
}

// Cumulative per-track point totals (for per-track quest progress)
export async function getTrackTotals(userId: number) {
  const rows = await sql`
    SELECT track, SUM(pts) AS total FROM (
      SELECT 'books'      AS track, points_per_entry AS pts FROM entries_books      JOIN track_settings ON track_settings.track = 'books'       WHERE user_id = ${userId}
      UNION ALL
      SELECT 'english'    AS track, points_per_entry AS pts FROM entries_english    JOIN track_settings ON track_settings.track = 'english'     WHERE user_id = ${userId}
      UNION ALL
      SELECT 'finnish'    AS track, points_per_entry AS pts FROM entries_finnish    JOIN track_settings ON track_settings.track = 'finnish'     WHERE user_id = ${userId}
      UNION ALL
      SELECT 'chinese'    AS track, points_per_entry AS pts FROM entries_chinese    JOIN track_settings ON track_settings.track = 'chinese'     WHERE user_id = ${userId}
      UNION ALL
      SELECT 'swedish'    AS track, points_per_entry AS pts FROM entries_swedish    JOIN track_settings ON track_settings.track = 'swedish'     WHERE user_id = ${userId}
      UNION ALL
      SELECT 'french'     AS track, points_per_entry AS pts FROM entries_french     JOIN track_settings ON track_settings.track = 'french'      WHERE user_id = ${userId}
      UNION ALL
      SELECT 'math'       AS track, points_per_entry AS pts FROM entries_math       JOIN track_settings ON track_settings.track = 'math'        WHERE user_id = ${userId}
      UNION ALL
      SELECT 'science'    AS track, points_per_entry AS pts FROM entries_science    JOIN track_settings ON track_settings.track = 'science'     WHERE user_id = ${userId}
      UNION ALL
      SELECT 'ai_project' AS track, points_per_entry AS pts FROM entries_ai_project JOIN track_settings ON track_settings.track = 'ai_project'  WHERE user_id = ${userId}
      UNION ALL
      SELECT 'sport'      AS track, points_per_entry AS pts FROM entries_sport      JOIN track_settings ON track_settings.track = 'sport'       WHERE user_id = ${userId}
      UNION ALL
      SELECT 'piano'      AS track, points_per_entry AS pts FROM entries_piano      JOIN track_settings ON track_settings.track = 'piano'       WHERE user_id = ${userId}
    ) all_entries
    GROUP BY track
  `
  const map: Record<string, number> = {}
  for (const row of rows) map[row.track] = Number(row.total)
  return map
}
