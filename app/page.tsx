"use client"

import { useState } from "react"

export default function Home() {
  const [prompt, setPrompt] = useState("")
  const [htmlOutput, setHtmlOutput] = useState("<p>Voer een prompt in en klik op Execute.</p>")
  const [supabaseOutput, setSupabaseOutput] = useState("")
  const [version, setVersion] = useState("")
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<any[]>([])

  const handleSubmit = async () => {
    setHtmlOutput("<p>Laden...</p>")
    try {
      const res = await fetch("https://smart-ai-builder-backend.onrender.com/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
      if (!res.ok) throw new Error("Backend fout: " + res.statusText)
      const data = await res.json()
      if (!data.html || data.html.trim() === "") {
        setHtmlOutput("<p>Geen geldige HTML ontvangen van backend.</p>")
      } else {
        setHtmlOutput(data.html)
      }
      setSupabaseOutput(data.supabase_instructions || "-")
      setVersion(data.version_timestamp || "-")

      // Voeg toe aan geschiedenis
      setHistory(prev => [
        ...prev,
        {
          prompt,
          html: data.html,
          supabase_instructions: data.supabase_instructions,
          timestamp: data.version_timestamp,
        },
      ])
    } catch (e: any) {
      setHtmlOutput(`<p class="text-red-600">Fout bij AI-aanroep: ${e.message}</p>`)
    }
  }

  const restoreFromHistory = (item: any) => {
    setPrompt(item.prompt)
    setHtmlOutput(item.html)
    setSupabaseOutput(item.supabase_instructions)
    setVersion(item.timestamp)
    setShowHistory(false)
  }

  return (
    <div className="flex h-screen bg-zinc-900 text-white font-sans">
      {/* Sidebar */}
      <aside className="w-1/3 bg-zinc-900 p-6 flex flex-col gap-6 border-r border-zinc-800">
        <h1 className="text-2xl font-bold">Prompt</h1>
        <textarea
          className="flex-grow bg-zinc-800 p-4 rounded resize-none text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Type je prompt hier..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          className="bg-green-600 hover:bg-green-500 px-6 py-3 rounded text-lg font-semibold transition"
          onClick={handleSubmit}
        >
          Execute
        </button>

        <div>
          <h2 className="font-semibold text-sm text-zinc-400 mb-1">Supabase Instructions</h2>
          <pre className="bg-zinc-800 p-3 rounded text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">{supabaseOutput}</pre>
        </div>

        <div>
          <h2 className="font-semibold text-sm text-zinc-400 mb-1">Version</h2>
          <p className="text-xs text-zinc-300">{version}</p>
        </div>

        <button
          className="mt-auto text-sm text-green-500 hover:underline"
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? "Sluit versiegeschiedenis" : "Open versiegeschiedenis"}
        </button>

        {showHistory && (
          <div className="mt-4 max-h-48 overflow-auto bg-zinc-800 p-2 rounded text-xs">
            {history.length === 0 && <p className="text-zinc-400">Geen geschiedenis</p>}
            {history.map((item, i) => (
              <div
                key={i}
                className="cursor-pointer py-1 px-2 rounded hover:bg-green-700"
                onClick={() => restoreFromHistory(item)}
              >
                <div className="font-semibold truncate">{item.prompt || "<leeg>"}</div>
                <div className="text-zinc-400 text-xs truncate">{item.timestamp}</div>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* Preview paneel */}
      <main className="flex-1 p-6 overflow-auto bg-white text-black rounded-l-3xl shadow-inner">
        <h1 className="text-2xl font-bold mb-6">Live Preview</h1>
        <div
          className="rounded bg-white p-6 shadow-inner min-h-[500px] prose max-w-none overflow-auto"
          dangerouslySetInnerHTML={{ __html: htmlOutput }}
        />
      </main>
    </div>
  )
}
