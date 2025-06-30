"use client"

interface SidebarProps {
  prompt: string
  setPrompt: (value: string) => void
  onSubmit: () => void
  supabaseOutput: string
  version: string
  toggleVersionHistory: () => void
}

export default function Sidebar({
  prompt,
  setPrompt,
  onSubmit,
  supabaseOutput,
  version,
  toggleVersionHistory,
}: SidebarProps) {
  return (
    <aside className="w-1/3 p-6 flex flex-col gap-6 border-r border-zinc-800 bg-zinc-900">
      <h1 className="text-2xl font-bold">Prompt</h1>

      <textarea
        className="flex-grow bg-zinc-800 p-4 rounded resize-none text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500"
        placeholder="Type je prompt hier..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <button
        onClick={onSubmit}
        className="bg-green-600 hover:bg-green-500 py-3 rounded text-lg font-semibold transition"
      >
        Execute
      </button>

      <section>
        <h2 className="font-semibold text-sm text-zinc-400 mb-1">Supabase Instructions</h2>
        <pre className="bg-zinc-800 p-3 rounded text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">{supabaseOutput}</pre>
      </section>

      <section>
        <h2 className="font-semibold text-sm text-zinc-400 mb-1">Version</h2>
        <p className="text-xs text-zinc-300">{version}</p>
      </section>

      <button
        className="mt-auto text-sm text-green-500 hover:underline"
        onClick={toggleVersionHistory}
      >
        {`Versiegeschiedenis ${"\u21C5"}`}
      </button>
    </aside>
  )
}
