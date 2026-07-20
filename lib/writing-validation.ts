export const MIN_WRITING_CHARACTERS = 1000

export function writingCharacterCount(text: string): number {
  return text.trim().length
}

export function validateWritingLength(text: string): { ok: true; count: number } | { ok: false; count: number; error: string } {
  const count = writingCharacterCount(text)
  if (count < MIN_WRITING_CHARACTERS) {
    return {
      ok: false,
      count,
      error: `Please write at least ${MIN_WRITING_CHARACTERS} characters before submitting.`,
    }
  }
  return { ok: true, count }
}
