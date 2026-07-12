import sql from '@/lib/db'

export const DEFAULT_AI_MODEL = 'gemini-3.1-flash-lite-preview'

export async function getConfiguredAiModel(): Promise<string> {
  const [row] = await sql`SELECT value FROM system_settings WHERE key = 'ai_model'`
  return String(row?.value ?? DEFAULT_AI_MODEL)
}
