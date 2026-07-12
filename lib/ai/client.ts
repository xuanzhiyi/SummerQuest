import { GoogleGenerativeAI } from '@google/generative-ai'
import { DEFAULT_AI_MODEL } from './settings'

let _gemini: GoogleGenerativeAI | null = null

function getGemini(): GoogleGenerativeAI {
  if (!_gemini) {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set')
    _gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  }
  return _gemini
}

export async function generateText(prompt: string, modelName = DEFAULT_AI_MODEL): Promise<string> {
  const model = getGemini().getGenerativeModel({ model: modelName })
  const result = await model.generateContent(prompt)
  return result.response.text()
}
