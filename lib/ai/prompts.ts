// All AI prompts in one place — easy to tweak tone/level/instructions later.
// Level is 1–10 where 1=beginner, 10=advanced for a 13-year-old.

export function bookFollowUpPrompt(title: string, notes: string): string {
  return `A 13-year-old boy has just read some of the book "${title}" and written these notes:

"${notes}"

Generate ONE short, friendly follow-up question about the book or his notes. The question should be genuinely curious and encourage him to think or share more — not a quiz question. Keep it to 1-2 sentences. Return only the question, nothing else.`
}

export function englishFeedbackPrompt(paragraph: string, prompt: string, level: number): string {
  return `You are a warm, encouraging English teacher reviewing a paragraph written by a 13-year-old Finnish boy. His English level is ${level}/10 (where 1=beginner, 10=advanced for his age).

Writing prompt he was given: "${prompt}"

His paragraph:
"${paragraph}"

Give warm, age-appropriate written feedback covering grammar, vocabulary, and structure/coherence. Be encouraging — this is summer learning, not a school exam. Point out 1-2 things done well and 1-2 specific things to improve. Keep feedback to 3-5 sentences.

Then on a new line output SCORE: followed by a number from 0 to 100 reflecting the overall quality for his level (100 = excellent for level ${level}/10). Output only the feedback and the SCORE line, nothing else.`
}

export function finnishFeedbackPrompt(paragraph: string, prompt: string, level: number): string {
  return `You are a warm, encouraging Finnish teacher reviewing a paragraph written by a 13-year-old boy who grew up in Helsinki. His Finnish level is ${level}/10 (where 1=beginner, 10=advanced for his age).

Writing prompt he was given: "${prompt}"

His paragraph:
"${paragraph}"

Give warm, age-appropriate written feedback in Finnish covering grammar, vocabulary, and structure/coherence. Be encouraging — this is summer learning, not a school exam. Point out 1-2 things done well and 1-2 specific things to improve. Keep feedback to 3-5 sentences.

Then on a new line output SCORE: followed by a number from 0 to 100 reflecting the overall quality for his level. Output only the feedback and the SCORE line, nothing else.`
}

export function chineseReadingPrompt(level: number): string {
  return `Generate a short Chinese reading passage appropriate for a 13-year-old learner at Chinese level ${level}/10 (where 1=complete beginner/pinyin needed, 5=intermediate/HSK3-4 range, 10=advanced). He is a native Finnish and English speaker learning Chinese.

The passage should be:
- 80-150 characters long (shorter for lower levels, longer for higher)
- On an interesting topic for a teenager (nature, tech, sports, daily life, etc.)

Pinyin formatting — this is important:
- Do NOT write pinyin as a separate line or paragraph.
- Instead, wrap each Chinese word/character that needs pinyin inline using this exact syntax: {字|zì} — the Chinese text first, then a pipe "|", then its pinyin (with tone marks), inside curly braces. Example: {你好|nǐ hǎo}.
- Plain Chinese text that does not need pinyin should be written normally, with no braces.
- If level is 3 or below, annotate EVERY word/character with pinyin this way.
- If level is 4-10, only annotate words that are genuinely difficult or uncommon for that level — leave easy/common characters unannotated.
- Punctuation stays outside the braces.

Return only the passage using this inline annotation syntax, nothing else — no separate pinyin paragraph, no explanations.`
}

export function swedishReadingPrompt(level: number): string {
  return `Generate a short Swedish reading passage appropriate for a 13-year-old learner at Swedish level ${level}/10 (where 1=absolute beginner, 5=intermediate/A2-B1, 10=advanced/near-native). He is a native Finnish and English speaker learning Swedish as a school subject.

The passage should be:
- 80-150 words long (shorter for lower levels, longer for higher)
- On an interesting, age-appropriate topic
- Use vocabulary appropriate for the level

Return only the passage, nothing else.`
}

export function frenchReadingPrompt(level: number): string {
  return `Generate a short French reading passage appropriate for a 13-year-old learner at French level ${level}/10 (where 1=absolute beginner, 5=intermediate/A2-B1, 10=advanced). He is a native Finnish and English speaker learning French.

The passage should be:
- 80-150 words long (shorter for lower levels, longer for higher)
- On an interesting, age-appropriate topic

Return only the passage, nothing else.`
}

export function englishReadingPrompt(level: number): string {
  return `Generate a short English reading passage appropriate for a 13-year-old at English level ${level}/10 (where 1=very simple sentences, 5=intermediate/B1, 10=advanced/native-level). He is a native Finnish speaker with strong English skills.

The passage should be:
- 80-150 words long (shorter for lower levels, longer for higher)
- On an interesting, age-appropriate topic (nature, tech, sports, history, daily life, etc.)
- Vocabulary and sentence complexity appropriate for the level

Return only the passage, nothing else.`
}

export function finnishReadingPrompt(level: number): string {
  return `Generate a short Finnish reading passage appropriate for a 13-year-old at Finnish level ${level}/10 (where 1=very simple sentences, 5=intermediate, 10=advanced/native-level). He is a native Finnish speaker.

The passage should be:
- 80-150 words long (shorter for lower levels, longer for higher)
- On an interesting, age-appropriate topic
- Vocabulary and sentence complexity appropriate for the level

Return only the passage, nothing else.`
}

export function mathProblemsPrompt(level: number): string {
  return `Generate a small set of 3-4 math problems for a 13-year-old Finnish student at the grade 6→7 transition (topics: fractions/decimals, percentages, basic geometry, simple equations, basic statistics). Difficulty level: ${level}/10.

Format each problem with its number, the Finnish text, then a Chinese translation in parentheses on the same line. Use LaTeX notation for all mathematical expressions (inline: $...$, display: $$...$$).

Example format:
1. Laske: $3 + 5 \\cdot 2$ (计算：$3 + 5 \\cdot 2$)
2. Ratkaise yhtälö: $2x - 4 = 10$ (解方程：$2x - 4 = 10$)

Return only the numbered problems, nothing else.`
}

export function mathFeedbackPrompt(problems: string, answers: string, level: number): string {
  return `A 13-year-old Finnish student at math level ${level}/10 answered these problems:

Problems:
${problems}

His answers:
${answers}

Give warm, encouraging written feedback as an overall summary: what he got right, what needs work, and a brief explanation for any mistakes. Do NOT give a pass/fail verdict. Keep it to 3-5 sentences and age-appropriate in tone. Write the feedback in English first, then add a Chinese translation after a blank line starting with "中文：".

Then on a new line output SCORE: followed by a number from 0 to 100 reflecting overall performance for his level. Output only the feedback, the Chinese translation, and the SCORE line, nothing else.`
}

export function scienceProblemsPrompt(level: number): string {
  return `Generate 2-3 short science questions for a 13-year-old Finnish student at the grade 6→7 transition. Topics should come from Finnish ympäristöoppi/science curriculum: basic biology, physics, chemistry concepts appropriate for this age. Difficulty level: ${level}/10.

Format the questions clearly, numbered. Mix question types (e.g. explain, calculate, identify).

Return only the numbered questions, nothing else.`
}

export function scienceFeedbackPrompt(problems: string, answers: string, level: number): string {
  return `A 13-year-old Finnish student at science level ${level}/10 answered these questions:

Questions:
${problems}

His answers:
${answers}

Give warm, encouraging written feedback as an overall summary: what he understood well, what needs clarification, and brief explanations for anything he got wrong. Keep it to 3-5 sentences, age-appropriate and supportive in tone.

Then on a new line output SCORE: followed by a number from 0 to 100 reflecting overall performance for his level. Output only the feedback and the SCORE line, nothing else.`
}

// Extract numeric score from AI response that ends with "SCORE: XX"
export function extractScore(response: string): { feedback: string; score: number } {
  const match = response.match(/SCORE:\s*(\d+(?:\.\d+)?)\s*$/im)
  if (!match) return { feedback: response.trim(), score: 70 } // fallback
  const score = Math.min(100, Math.max(0, parseFloat(match[1])))
  const feedback = response.slice(0, match.index).trim()
  return { feedback, score }
}

// Writing prompts shown to child (static list — admin can expand later)
export const ENGLISH_WRITING_PROMPTS = [
  'Describe your perfect summer day.',
  'If you could invent anything, what would it be and why?',
  'Write about a time you learned something new.',
  'Describe your favourite place in Helsinki.',
  'What would you do if you had one week completely free?',
  'Write about a book, game, or film you enjoy.',
  'If you could travel anywhere, where would you go and what would you do?',
  'Describe someone you admire and explain why.',
]

export const FINNISH_WRITING_PROMPTS = [
  'Kuvaile täydellinen kesäpäivä.',
  'Jos voisit keksiä jonkin laitteen tai asian, mikä se olisi ja miksi?',
  'Kirjoita jostakin, jonka olet oppinut viime aikoina.',
  'Kuvaile suosikkipaikkaasi Helsingissä.',
  'Mitä tekisit, jos sinulla olisi viikko täysin vapaata?',
  'Kirjoita kirjasta, pelistä tai elokuvasta, josta pidät.',
  'Jos voisit matkustaa jonnekin, minne menisit ja mitä tekisit?',
  'Kuvaile jotakuta, jota ihastat, ja kerro miksi.',
]
