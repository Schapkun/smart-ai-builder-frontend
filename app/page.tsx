"use client"

import { useState } from "react"

export default function Home() {
  const [prompt, setPrompt] = useState("")
  const [htmlOutput, setHtmlOutput] = useState("<p>Voer een prompt in en klik op Execute.</p>")
  const [supabaseOutput, setSupabaseOutput] = useState("")
  const [version, setVersion] = useState("")

  const handleSubmit = async () => {
    setHtmlOutput("<p>Loading...</p>")
    try {
      const res = await fetch("https://smart-ai-builder-backend.onrender.com/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
      if (!res.ok) throw new Error("Backend error: " + res.statusText)
      const data = await res.json()
      if (!data.html || data.html.trim() === "") {
        setHtmlOutput("<p>Geen geldige HTML ontvangen van backend.</p>")
      } else {
        setHtmlOutput(data.html)
      }
      setSupabaseOutput(data.supabase_instructions || "-")
      setVersion(data.version_timestamp || "-")
    } catch (e: any) {
      setHtmlOutput(`<p class="text-red-600">Fout bij AI-aanroep: ${e.message}</p>`)
    }
  }

  return (
    <div className="flex h-screen bg-zinc-900 text-white">
      {/* Linker paneel */}
      <section className="w-1/3 p-6 flex flex-col gap-4 border-r border-zinc-700">
        <h1 className="text-2xl font-semibold mb-4">Prompt</h1>
        <textarea
          className="flex-grow bg-zinc-800 rounded p-4 text-white resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Type je prompt hier..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          className="bg-green-600 hover:bg-green-500 py-2 rounded text-lg font-semibold transition"
          onClick={handleSubmit}
        >
          Execute
        </button>

        <div>
          <h2 className="text-sm font-medium text-zinc-400 mb-1">Supabase Instructions</h2>
          <pre className="bg-zinc-800 p-3 rounded max-h-32 overflow-y-auto text-xs whitespace-pre-wrap break-words">
            {supabaseOutput}
          </pre>
        </div>

        <div>
          <h2 className="text-sm font-medium text-zinc-400 mb-1">Version</h2>
          <pre className="text-zinc-400 text-xs">{version}</pre>
        </div>
      </section>

      {/* Rechter paneel */}
      <section className="w-2/3 p-6 overflow-y-auto bg-white text-black rounded-l-3xl shadow-lg">
        <h1 className="text-2xl font-semibold mb-6">Live Preview</h1>
        <div
          className="rounded bg-white p-6 shadow-inner min-h-[400px] prose max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlOutput }}
        />
      </section>
    </div>
  )
}
