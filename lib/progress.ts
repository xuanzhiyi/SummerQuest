import sql from './db'
import type { Track } from '@/types'

export interface TrackProgress {
  track: Track
  total_points: number
  points_per_entry: number
  current_streak: number
  thresholds: ThresholdProgress[]
}

export interface ThresholdProgress {
  id: number
  points_required: number
  reward_description: string
  unlocked: boolean
  requested_at: string | null
  fulfilled_at: string | null
  dismissed_at: string | null
}

// Streak: consecutive days (ending today or yesterday) with at least one entry in this track.
// Gaps pause the streak — never reset it. We count backwards from the most recent entry.
async function getStreak(userId: number, track: Track): Promise<number> {
  const table = `entries_${track === 'ai_project' ? 'ai_project' : track}`
  // Get all distinct dates for this user+track, ordered desc
  const rows = await sql.unsafe(
    `SELECT DISTINCT date::text FROM ${table} WHERE user_id = $1 ORDER BY date DESC`,
    [userId]
  )
  if (rows.length === 0) return 0

  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const mostRecent = rows[0].date

  // Streak only active if most recent entry was today or yesterday
  if (mostRecent !== today && mostRecent !== yesterday) return 0

  let streak = 0
  let expected = mostRecent
  for (const row of rows) {
    if (row.date === expected) {
      streak++
      // Move expected back one day
      const d = new Date(expected + 'T12:00:00')
      d.setDate(d.getDate() - 1)
      expected = d.toISOString().slice(0, 10)
    } else {
      break
    }
  }
  return streak
}

export async function getAllProgress(userId: number): Promise<TrackProgress[]> {
  const TRACKS: Track[] = [
    'sport', 'piano', 'math', 'books', 'english', 'finnish',
    'chinese', 'swedish', 'french', 'science', 'ai_project',
  ]

  const [settingsRows, thresholdRows, ...streakResults] = await Promise.all([
    sql`SELECT track, points_per_entry FROM track_settings`,
    sql`SELECT * FROM reward_thresholds ORDER BY track, points_required`,
    ...TRACKS.map((t) => getStreak(userId, t)),
  ])

  // Point totals per track (live = current points_per_entry * entry count)
  const totalRows = await sql`
    SELECT track, SUM(pts) AS total FROM (
      SELECT 'books'      AS track, ts.points_per_entry AS pts FROM entries_books       JOIN track_settings ts ON ts.track = 'books'       WHERE user_id = ${userId}
      UNION ALL
      SELECT 'english'    AS track, ts.points_per_entry AS pts FROM entries_english     JOIN track_settings ts ON ts.track = 'english'     WHERE user_id = ${userId}
      UNION ALL
      SELECT 'finnish'    AS track, ts.points_per_entry AS pts FROM entries_finnish     JOIN track_settings ts ON ts.track = 'finnish'     WHERE user_id = ${userId}
      UNION ALL
      SELECT 'chinese'    AS track, ts.points_per_entry AS pts FROM entries_chinese     JOIN track_settings ts ON ts.track = 'chinese'     WHERE user_id = ${userId}
      UNION ALL
      SELECT 'swedish'    AS track, ts.points_per_entry AS pts FROM entries_swedish     JOIN track_settings ts ON ts.track = 'swedish'     WHERE user_id = ${userId}
      UNION ALL
      SELECT 'french'     AS track, ts.points_per_entry AS pts FROM entries_french      JOIN track_settings ts ON ts.track = 'french'      WHERE user_id = ${userId}
      UNION ALL
      SELECT 'math'       AS track, ts.points_per_entry AS pts FROM entries_math        JOIN track_settings ts ON ts.track = 'math'        WHERE user_id = ${userId}
      UNION ALL
      SELECT 'science'    AS track, ts.points_per_entry AS pts FROM entries_science     JOIN track_settings ts ON ts.track = 'science'     WHERE user_id = ${userId}
      UNION ALL
      SELECT 'ai_project' AS track, ts.points_per_entry AS pts FROM entries_ai_project  JOIN track_settings ts ON ts.track = 'ai_project'  WHERE user_id = ${userId}
      UNION ALL
      SELECT 'sport'      AS track, ts.points_per_entry AS pts FROM entries_sport       JOIN track_settings ts ON ts.track = 'sport'       WHERE user_id = ${userId}
      UNION ALL
      SELECT 'piano'      AS track, ts.points_per_entry AS pts FROM entries_piano       JOIN track_settings ts ON ts.track = 'piano'       WHERE user_id = ${userId}
    ) x GROUP BY track
  `

  const pointsMap = new Map<string, number>()
  for (const r of totalRows) pointsMap.set(r.track, Number(r.total))

  const settingsMap = new Map<string, number>()
  for (const r of settingsRows) settingsMap.set(r.track, Number(r.points_per_entry))

  return TRACKS.map((track, i) => {
    const total = pointsMap.get(track) ?? 0
    const trackThresholds = (thresholdRows as Array<Record<string, unknown>>)
      .filter((t) => t.track === track)
      .map((t) => ({
        id: t.id as number,
        points_required: t.points_required as number,
        reward_description: t.reward_description as string,
        unlocked: total >= (t.points_required as number),
        requested_at: t.requested_at as string | null,
        fulfilled_at: t.fulfilled_at as string | null,
        dismissed_at: t.dismissed_at as string | null,
      }))

    return {
      track,
      total_points: total,
      points_per_entry: settingsMap.get(track) ?? 10,
      current_streak: streakResults[i] as number,
      thresholds: trackThresholds,
    }
  })
}
