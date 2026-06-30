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

// Local "today" in Europe/Helsinki — avoids UTC date drift near midnight for CEST/EEST users
export function todayDate(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Helsinki' }).format(new Date())
}

export function isToday(date: string): boolean {
  return date === todayDate()
}

export function isPast(date: string): boolean {
  return date < todayDate()
}

// Load daily point totals and effort signals for all program days
export async function getCalendarTiles(userId: number): Promise<DayTile[]> {
  const pointsRows = await sql`
    WITH daily AS (
      SELECT date, SUM(pts) AS total_points FROM (
        SELECT date, points_per_entry AS pts FROM entries_books      JOIN track_settings ON track_settings.track = 'books'       AND track_settings.child_user_id = ${userId} WHERE entries_books.user_id      = ${userId}
        UNION ALL
        SELECT date, points_per_entry AS pts FROM entries_english    JOIN track_settings ON track_settings.track = 'english'     AND track_settings.child_user_id = ${userId} WHERE entries_english.user_id    = ${userId}
        UNION ALL
        SELECT date, points_per_entry AS pts FROM entries_finnish    JOIN track_settings ON track_settings.track = 'finnish'     AND track_settings.child_user_id = ${userId} WHERE entries_finnish.user_id    = ${userId}
        UNION ALL
        SELECT date, points_per_entry AS pts FROM entries_chinese    JOIN track_settings ON track_settings.track = 'chinese'     AND track_settings.child_user_id = ${userId} WHERE entries_chinese.user_id    = ${userId}
        UNION ALL
        SELECT date, points_per_entry AS pts FROM entries_swedish    JOIN track_settings ON track_settings.track = 'swedish'     AND track_settings.child_user_id = ${userId} WHERE entries_swedish.user_id    = ${userId}
        UNION ALL
        SELECT date, points_per_entry AS pts FROM entries_french     JOIN track_settings ON track_settings.track = 'french'      AND track_settings.child_user_id = ${userId} WHERE entries_french.user_id     = ${userId}
        UNION ALL
        SELECT date, points_per_entry AS pts FROM entries_math       JOIN track_settings ON track_settings.track = 'math'        AND track_settings.child_user_id = ${userId} WHERE entries_math.user_id       = ${userId}
        UNION ALL
        SELECT date, points_per_entry AS pts FROM entries_science    JOIN track_settings ON track_settings.track = 'science'     AND track_settings.child_user_id = ${userId} WHERE entries_science.user_id    = ${userId}
        UNION ALL
        SELECT date, points_per_entry AS pts FROM entries_ai_project JOIN track_settings ON track_settings.track = 'ai_project'  AND track_settings.child_user_id = ${userId} WHERE entries_ai_project.user_id = ${userId}
        UNION ALL
        SELECT date, points_per_entry AS pts FROM entries_sport      JOIN track_settings ON track_settings.track = 'sport'       AND track_settings.child_user_id = ${userId} WHERE entries_sport.user_id      = ${userId}
        UNION ALL
        SELECT date, points_per_entry AS pts FROM entries_piano      JOIN track_settings ON track_settings.track = 'piano'       AND track_settings.child_user_id = ${userId} WHERE entries_piano.user_id      = ${userId}
        UNION ALL
        SELECT date, points_per_entry AS pts FROM entries_diary            JOIN track_settings ON track_settings.track = 'diary'            AND track_settings.child_user_id = ${userId} WHERE entries_diary.user_id           = ${userId}
        UNION ALL
        SELECT date, points_per_entry AS pts FROM entries_english_reading JOIN track_settings ON track_settings.track = 'english_reading' AND track_settings.child_user_id = ${userId} WHERE entries_english_reading.user_id = ${userId}
        UNION ALL
        SELECT date, points_per_entry AS pts FROM entries_finnish_reading JOIN track_settings ON track_settings.track = 'finnish_reading' AND track_settings.child_user_id = ${userId} WHERE entries_finnish_reading.user_id = ${userId}
        UNION ALL
        SELECT date, points_awarded   AS pts FROM entries_word_pairing WHERE user_id = ${userId}
      ) all_entries
      GROUP BY date
    )
    SELECT date::text AS date, total_points FROM daily
  `

  const questCountRows = await sql`
    SELECT date::text AS date, COUNT(DISTINCT track) AS quest_count FROM (
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
      SELECT date, 'diary'            FROM entries_diary            WHERE user_id = ${userId}
      UNION ALL
      SELECT date, 'english_reading'  FROM entries_english_reading  WHERE user_id = ${userId}
      UNION ALL
      SELECT date, 'finnish_reading'  FROM entries_finnish_reading  WHERE user_id = ${userId}
      UNION ALL
      SELECT date, 'word_' || language_pair FROM entries_word_pairing WHERE user_id = ${userId}
    ) all_tracks
    GROUP BY date
  `

  const signalRows = await sql`
    WITH ai_entries AS (
      SELECT date, ai_score, effort_weight FROM entries_english  JOIN track_settings ON track_settings.track = 'english'  AND track_settings.child_user_id = ${userId} WHERE entries_english.user_id  = ${userId} AND ai_score IS NOT NULL
      UNION ALL
      SELECT date, ai_score, effort_weight FROM entries_finnish  JOIN track_settings ON track_settings.track = 'finnish'  AND track_settings.child_user_id = ${userId} WHERE entries_finnish.user_id  = ${userId} AND ai_score IS NOT NULL
      UNION ALL
      SELECT date, ai_score, effort_weight FROM entries_math     JOIN track_settings ON track_settings.track = 'math'     AND track_settings.child_user_id = ${userId} WHERE entries_math.user_id     = ${userId} AND ai_score IS NOT NULL
      UNION ALL
      SELECT date, ai_score, effort_weight FROM entries_science  JOIN track_settings ON track_settings.track = 'science'  AND track_settings.child_user_id = ${userId} WHERE entries_science.user_id  = ${userId} AND ai_score IS NOT NULL
    )
    SELECT date::text AS date, SUM(ai_score * effort_weight) / NULLIF(SUM(effort_weight), 0) AS weighted_score
    FROM ai_entries GROUP BY date
  `

  const pointsMap = new Map<string, number>()
  for (const row of pointsRows) pointsMap.set(row.date as string, Number(row.total_points))

  const questCountMap = new Map<string, number>()
  for (const row of questCountRows) questCountMap.set(String(row.date).slice(0, 10), Number(row.quest_count))

  const signalMap = new Map<string, EffortSignal>()
  for (const row of signalRows) signalMap.set(row.date as string, scoreToEffortSignal(Number(row.weighted_score)))

  return programDates().map((date) => ({
    date,
    total_points: pointsMap.get(date) ?? 0,
    completed_quests: questCountMap.get(date) ?? 0,
    effort_signal: signalMap.get(date) ?? null,
  }))
}

export async function getTrackTotals(userId: number) {
  const rows = await sql`
    SELECT track, SUM(pts) AS total FROM (
      SELECT 'books'      AS track, points_per_entry AS pts FROM entries_books      JOIN track_settings ON track_settings.track = 'books'       AND track_settings.child_user_id = ${userId} WHERE entries_books.user_id      = ${userId}
      UNION ALL
      SELECT 'english'    AS track, points_per_entry AS pts FROM entries_english    JOIN track_settings ON track_settings.track = 'english'     AND track_settings.child_user_id = ${userId} WHERE entries_english.user_id    = ${userId}
      UNION ALL
      SELECT 'finnish'    AS track, points_per_entry AS pts FROM entries_finnish    JOIN track_settings ON track_settings.track = 'finnish'     AND track_settings.child_user_id = ${userId} WHERE entries_finnish.user_id    = ${userId}
      UNION ALL
      SELECT 'chinese'    AS track, points_per_entry AS pts FROM entries_chinese    JOIN track_settings ON track_settings.track = 'chinese'     AND track_settings.child_user_id = ${userId} WHERE entries_chinese.user_id    = ${userId}
      UNION ALL
      SELECT 'swedish'    AS track, points_per_entry AS pts FROM entries_swedish    JOIN track_settings ON track_settings.track = 'swedish'     AND track_settings.child_user_id = ${userId} WHERE entries_swedish.user_id    = ${userId}
      UNION ALL
      SELECT 'french'     AS track, points_per_entry AS pts FROM entries_french     JOIN track_settings ON track_settings.track = 'french'      AND track_settings.child_user_id = ${userId} WHERE entries_french.user_id     = ${userId}
      UNION ALL
      SELECT 'math'       AS track, points_per_entry AS pts FROM entries_math       JOIN track_settings ON track_settings.track = 'math'        AND track_settings.child_user_id = ${userId} WHERE entries_math.user_id       = ${userId}
      UNION ALL
      SELECT 'science'    AS track, points_per_entry AS pts FROM entries_science    JOIN track_settings ON track_settings.track = 'science'     AND track_settings.child_user_id = ${userId} WHERE entries_science.user_id    = ${userId}
      UNION ALL
      SELECT 'ai_project' AS track, points_per_entry AS pts FROM entries_ai_project JOIN track_settings ON track_settings.track = 'ai_project'  AND track_settings.child_user_id = ${userId} WHERE entries_ai_project.user_id = ${userId}
      UNION ALL
      SELECT 'sport'      AS track, points_per_entry AS pts FROM entries_sport      JOIN track_settings ON track_settings.track = 'sport'       AND track_settings.child_user_id = ${userId} WHERE entries_sport.user_id      = ${userId}
      UNION ALL
      SELECT 'piano'      AS track, points_per_entry AS pts FROM entries_piano      JOIN track_settings ON track_settings.track = 'piano'       AND track_settings.child_user_id = ${userId} WHERE entries_piano.user_id      = ${userId}
      UNION ALL
      SELECT 'diary'            AS track, points_per_entry AS pts FROM entries_diary            JOIN track_settings ON track_settings.track = 'diary'            AND track_settings.child_user_id = ${userId} WHERE entries_diary.user_id           = ${userId}
      UNION ALL
      SELECT 'english_reading'  AS track, points_per_entry AS pts FROM entries_english_reading JOIN track_settings ON track_settings.track = 'english_reading' AND track_settings.child_user_id = ${userId} WHERE entries_english_reading.user_id = ${userId}
      UNION ALL
      SELECT 'finnish_reading'  AS track, points_per_entry AS pts FROM entries_finnish_reading JOIN track_settings ON track_settings.track = 'finnish_reading' AND track_settings.child_user_id = ${userId} WHERE entries_finnish_reading.user_id = ${userId}
    ) all_entries
    GROUP BY track
  `
  const map: Record<string, number> = {}
  for (const row of rows) map[row.track] = Number(row.total)
  return map
}
