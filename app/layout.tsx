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
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600&family=Nunito:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full text-gray-800 antialiased" style={{ background: '#FFFBF5', fontFamily: "'Nunito', sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
