'use client'

import { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

// Render a string that may contain $...$ inline math and $$...$$ display math
export default function MathText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    // Replace $$...$$ (display) then $...$ (inline) with rendered KaTeX HTML
    const html = text
      .replace(/\$\$([^$]+)\$\$/g, (_, expr) => {
        try {
          return katex.renderToString(expr.trim(), { displayMode: true, throwOnError: false })
        } catch {
          return `<span>${expr}</span>`
        }
      })
      .replace(/\$([^$\n]+)\$/g, (_, expr) => {
        try {
          return katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false })
        } catch {
          return `<span>${expr}</span>`
        }
      })
      // Preserve newlines as <br>
      .replace(/\n/g, '<br/>')

    ref.current.innerHTML = html
  }, [text])

  return <div ref={ref} className={className} />
}
