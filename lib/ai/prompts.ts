// All AI prompts in one place — easy to tweak tone/level/instructions later.
// Level is 1–10 where 1=beginner, 10=advanced for a 13-year-old.

export function bookFollowUpPrompt(title: string, notes: string): string {
  return `A 13-year-old boy has just read some of the book "${title}" and written these notes:

"${notes}"

Generate ONE short, friendly follow-up question about the book or his notes. The question should be genuinely curious and encourage him to think or share more — not a quiz question. Keep it to 1-2 sentences. Return only the question, nothing else.`
}

export interface PreviousWritingEntry {
  date: string
  prompt_used: string | null
  paragraph: string
  ai_score?: number | string | null
}

function previousWritingContext(previousEntries: PreviousWritingEntry[]): string {
  if (previousEntries.length === 0) {
    return 'No previous writing entries are available for comparison.'
  }

  return previousEntries.map((entry, index) => {
    const score = entry.ai_score != null ? `\nPrevious score: ${entry.ai_score}/100` : ''
    return `Previous writing ${index + 1} (${entry.date}):
Prompt: "${entry.prompt_used ?? 'No prompt saved'}"
Paragraph:
"${entry.paragraph}"${score}`
  }).join('\n\n')
}

export function englishFeedbackPrompt(paragraph: string, prompt: string, level: number, previousEntries: PreviousWritingEntry[] = []): string {
  return `You are a warm, encouraging English teacher reviewing a paragraph written by a 13-year-old Finnish boy. His English level is ${level}/10 (where 1=beginner, 10=advanced for his age).

Writing prompt he was given: "${prompt}"

Here are up to three previous English writing entries from the same learner, oldest to newest:
${previousWritingContext(previousEntries)}

His paragraph:
"${paragraph}"

Give warm, age-appropriate written feedback covering grammar, vocabulary, and structure/coherence. Be encouraging — this is summer learning, not a school exam. Point out 1-2 things done well and 1-2 specific things to improve. Keep feedback to 3-5 sentences.

If previous entries are available, include one concrete sentence about progress or a repeated pattern compared with the previous writing.

Then on a new line output SCORE: followed by a number from 0 to 100 reflecting the overall quality for his level (100 = excellent for level ${level}/10). Output only the feedback and the SCORE line, nothing else.`
}

export function finnishFeedbackPrompt(paragraph: string, prompt: string, level: number, previousEntries: PreviousWritingEntry[] = []): string {
  return `You are a warm, encouraging Finnish teacher reviewing a paragraph written by a 13-year-old boy who grew up in Helsinki. His Finnish level is ${level}/10 (where 1=beginner, 10=advanced for his age).

Writing prompt he was given: "${prompt}"

Here are up to three previous Finnish writing entries from the same learner, oldest to newest:
${previousWritingContext(previousEntries)}

His paragraph:
"${paragraph}"

Give warm, age-appropriate written feedback in Finnish covering grammar, vocabulary, and structure/coherence. Be encouraging — this is summer learning, not a school exam. Point out 1-2 things done well and 1-2 specific things to improve. Keep feedback to 3-5 sentences.

If previous entries are available, include one concrete sentence in Finnish about progress or a repeated pattern compared with the previous writing.

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
const LEGACY_ENGLISH_WRITING_PROMPTS = [
  'Describe your perfect summer day.',
  'If you could invent anything, what would it be and why?',
  'Write about a time you learned something new.',
  'Describe your favourite place in Helsinki.',
  'What would you do if you had one week completely free?',
  'Write about a book, game, or film you enjoy.',
  'If you could travel anywhere, where would you go and what would you do?',
  'Describe someone you admire and explain why.',
]

const WRITING_TOPIC_STEMS = [
  'a tiny superpower that lasts one day',
  'a secret door at school',
  'the best treehouse for friends',
  'a silent clean city',
  'a lost robot that needs help',
  'a good teammate',
  'a meal for visitors from another country',
  'a museum where objects speak',
  'a rainy summer afternoon',
  'a new sport made from two sports',
  'a message inside an old bottle',
  'using AI safely',
  'Helsinki in the year 2050',
  'a friendly animal that follows you home',
  'sleep, food, exercise, and learning',
  'a video game level based on your neighborhood',
  'a time machine that moves one day forward',
  'a satisfying book ending',
  'an island where children make the rules',
  'a strange sound from the forest',
  'a perfect family game night',
  'a brave but nervous character',
  'a map under a park bench',
  'something schools should teach more often',
  'a room designed for creativity',
  'a pet dragon afraid of heights',
  'solving disagreements fairly',
  'summer camp on Mars',
  'the most useful app you can imagine',
  'why practice improves skill',
  'a football match in changing weather',
  'a library where books choose readers',
  'what makes a good friend',
  'a day without screens',
  'a tiny planet in your garden',
  'protecting the Baltic Sea',
  'a music performance from the piano point of view',
  'a swimming pool mystery',
  'courage in everyday life',
  'a shop that sells impossible objects',
  'a bicycle ride that becomes an adventure',
  'checking if online information is trustworthy',
  'a school subject that should exist',
  'meeting your future self for ten minutes',
  'what makes a good leader',
  'a house for winter and summer',
  'a family trip that goes wrong but becomes fun',
  'how learning languages changes your view',
  'a planet where people communicate with music',
  'a competition won by kindness',
  'training for a difficult challenge',
  'a garden with unusual plants',
  'a message from Antarctica',
  'improving your local park',
  'the best birthday surprise',
  'a robot teacher that learns from students',
  'why mistakes can be useful',
  'one hour of weaker gravity',
  'friendship between different people',
  'a small business for kids',
  'a castle made of ice and light',
  'a race where speed is not the goal',
  'what makes a movie scene exciting',
  'a hidden cafe during thunderstorms',
  'helping someone new to your city',
  'technology that improves homework',
  'a forest path that changes every time',
  'a family tradition you would create',
  'why teamwork is difficult but powerful',
  'a spaceship designed by teenagers',
  'a magical science experiment mistake',
  'what makes a place feel like home',
  'a school day from your backpack point of view',
  'discovering a hobby by accident',
  'making public transport more fun',
  'a beach where sand records memories',
  'a chess game against a talking computer',
  'why nature matters in a city',
  'a festival for creativity',
  'a secret club that solves small problems',
  'preparing for a speech',
  'a winter day that becomes summer',
  'a camera that photographs the future',
  'what makes a joke funny',
  'a mountain hike with an unexpected discovery',
  'a day when every city sign changes',
  'a better school lunch',
  'borrowing a skill for one hour',
  'an old key that opens something surprising',
  'patience when learning music',
  'a superhero whose power is listening',
  'a sports team of humans and robots',
  'one day as mayor',
  'a train journey across Finland',
  'an invention that helps people be kinder',
  'finding a wallet on the street',
  'the most peaceful place you can imagine',
  'a cooperative game',
  'how you want to improve before summer ends',
  'a new holiday your family invents',
]

export const ENGLISH_WRITING_PROMPTS = WRITING_TOPIC_STEMS.map((topic) => `Write about ${topic}.`)

export const FINNISH_WRITING_PROMPTS = WRITING_TOPIC_STEMS.map((topic) => `Kirjoita suomeksi aiheesta: ${topic}.`)

const LEGACY_FINNISH_WRITING_PROMPTS = [
  'Kuvaile täydellinen kesäpäivä.',
  'Jos voisit keksiä jonkin laitteen tai asian, mikä se olisi ja miksi?',
  'Kirjoita jostakin, jonka olet oppinut viime aikoina.',
  'Kuvaile suosikkipaikkaasi Helsingissä.',
  'Mitä tekisit, jos sinulla olisi viikko täysin vapaata?',
  'Kirjoita kirjasta, pelistä tai elokuvasta, josta pidät.',
  'Jos voisit matkustaa jonnekin, minne menisit ja mitä tekisit?',
  'Kuvaile jotakuta, jota ihastat, ja kerro miksi.',
]
