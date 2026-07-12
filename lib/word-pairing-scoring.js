export function computeWordPairingResult(wordsShown, results) {
  if (!Array.isArray(wordsShown) || !Array.isArray(results)) {
    return null
  }

  const shownIds = new Set(wordsShown.map((word) => String(word.wordId)))
  const normalizedResults = results
    .filter((result) => shownIds.has(String(result.wordId)) && shownIds.has(String(result.selectedWordId)))
    .map((result) => {
      const wordId = String(result.wordId)
      const selectedWordId = String(result.selectedWordId)
      return { wordId, selectedWordId, correct: wordId === selectedWordId }
    })

  if (normalizedResults.length !== wordsShown.length) {
    return null
  }

  const correctCount = normalizedResults.filter((result) => result.correct).length
  const score = Math.round((correctCount / wordsShown.length) * 100)

  return { normalizedResults, score }
}
