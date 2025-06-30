// app/layout.tsx
import './globals.css'

export const metadata = {
  title: 'Loveable AI Builder',
  description: 'Exact Loveable clone with Supabase integration',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-white">{children}</body>
    </html>
  )
}
