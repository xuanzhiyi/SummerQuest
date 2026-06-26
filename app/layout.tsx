import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SummerQuest',
  description: "Aleksi's Summer Quest 2026",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-amber-50 text-gray-800 font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
