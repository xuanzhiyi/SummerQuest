export function computeWordPairingResult(wordsShown, results) {
  if (!Array.isArray(wordsShown) || !Array.isArray(results)) {
    return null
  }

  if (wordsShown.length === 0 || results.length !== wordsShown.length) {
    return null
  }

  const shownIds = new Set(wordsShown.map((word) => String(word.wordId)))
  if (shownIds.size !== wordsShown.length) {
    return null
  }

  const answeredIds = new Set()
  const normalizedResults = results
    .filter((result) => {
      const wordId = String(result.wordId)
      const selectedWordId = String(result.selectedWordId)
      if (!shownIds.has(wordId) || !shownIds.has(selectedWordId) || answeredIds.has(wordId)) {
        return false
      }
      answeredIds.add(wordId)
      return true
    })
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
