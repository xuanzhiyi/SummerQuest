// Renders text containing {汉字|hàn zì} annotations as <ruby> elements
// so pinyin appears directly above the corresponding characters.
const RUBY_PATTERN = /\{([^|{}]+)\|([^{}]+)\}/g

export default function RubyText({ text, className }: { text: string; className?: string }) {
  const parts: { base: string; pinyin?: string }[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  RUBY_PATTERN.lastIndex = 0
  while ((match = RUBY_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ base: text.slice(lastIndex, match.index) })
    }
    parts.push({ base: match[1], pinyin: match[2] })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    parts.push({ base: text.slice(lastIndex) })
  }

  return (
    <p className={className} style={{ whiteSpace: 'pre-wrap', lineHeight: 2.1 }}>
      {parts.map((p, i) =>
        p.pinyin ? (
          <ruby key={i}>
            {p.base}
            <rt style={{ fontSize: '0.6em', color: '#6B7280' }}>{p.pinyin}</rt>
          </ruby>
        ) : (
          <span key={i}>{p.base}</span>
        )
      )}
    </p>
  )
}
