import { GoogleGenerativeAI } from '@google/generative-ai'

let _gemini: GoogleGenerativeAI | null = null

function getGemini(): GoogleGenerativeAI {
  if (!_gemini) {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set')
    _gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  }
  return _gemini
}

export async function generateText(prompt: string, modelName = 'gemini-3.1-flash-lite-preview'): Promise<string> {
  const model = getGemini().getGenerativeModel({ model: modelName })
  const result = await model.generateContent(prompt)
  return result.response.text()
}
