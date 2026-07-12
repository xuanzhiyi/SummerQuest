import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SummerQuest',
  description: "Hansen's Summer Quest 2026",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600&family=Nunito:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&family=Sora:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full antialiased" style={{ background: '#0A0E17', fontFamily: "'Sora', sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
