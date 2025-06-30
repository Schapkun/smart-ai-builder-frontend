
"use client"

import { useState } from "react"

export default function Home() {
  const [prompt, setPrompt] = useState("")
  const [htmlOutput, setHtmlOutput] = useState("")
  const [supabaseOutput, setSupabaseOutput] = useState("")
  const [version, setVersion] = useState("")

  const handleSubmit = async () => {
    setHtmlOutput("<p>Even wachten...</p>")
    const res = await fetch("https://smart-ai-builder-backend.onrender.com/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    })

    const data = await res.json()
    setHtmlOutput(data.html)
    setSupabaseOutput(data.supabase_instructions)
    setVersion(data.version_timestamp)
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      <div className="w-1/3 p-6 border-r border-zinc-800 flex flex-col gap-4 bg-zinc-900">
        <h1 className="text-xl font-semibold">💬 Prompt</h1>
        <textarea
          className="bg-zinc-800 p-4 rounded resize-none h-48 text-white"
          placeholder="Bijv. Maak formulier met naam en email veld."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          onClick={handleSubmit}
          className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded font-medium"
        >
          Uitvoeren
        </button>

        <div className="mt-6">
          <h2 className="font-medium text-sm text-zinc-400 mb-1">🛠 Supabase instructies</h2>
          <pre className="bg-zinc-800 p-3 rounded text-sm whitespace-pre-wrap break-words">{supabaseOutput || "-"}</pre>
        </div>

        <div className="mt-4">
          <h2 className="font-medium text-sm text-zinc-400 mb-1">🕒 Versie</h2>
          <pre className="text-zinc-300 text-sm">{version || "-"}</pre>
        </div>
      </div>

      <div className="w-2/3 p-6 overflow-y-auto">
        <h1 className="text-xl font-semibold mb-4">👁️ Preview</h1>
        <div
          className="bg-white text-black rounded p-4 shadow"
          dangerouslySetInnerHTML={{ __html: htmlOutput }}
        />
      </div>
    </div>
  )
}
