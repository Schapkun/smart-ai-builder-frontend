// app/page.tsx
"use client"

import { useState } from "react"

export default function Home() {
  const [prompt, setPrompt] = useState("")
  const [htmlOutput, setHtmlOutput] = useState("")
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
      const data = await res.json()
      setHtmlOutput(data.html || "<p>No HTML returned</p>")
      setSupabaseOutput(data.supabase_instructions || "-")
      setVersion(data.version_timestamp || "-")
    } catch (e) {
      setHtmlOutput("<p class='text-red-500'>Error loading response</p>")
    }
  }

  return (
    <div className="flex h-screen">
      <section className="w-1/3 bg-zinc-900 p-6 flex flex-col gap-4">
        <h1 className="text-xl font-semibold">Prompt</h1>
        <textarea
          className="bg-zinc-800 p-4 rounded resize-none h-48 text-white"
          placeholder="Type your prompt here..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded font-medium transition"
          onClick={handleSubmit}
        >
          Execute
        </button>

        <div className="mt-6">
          <h2 className="font-medium text-sm text-zinc-400 mb-1">Supabase Instructions</h2>
          <pre className="bg-zinc-800 p-3 rounded text-sm whitespace-pre-wrap break-words">{supabaseOutput}</pre>
        </div>

        <div className="mt-4">
          <h2 className="font-medium text-sm text-zinc-400 mb-1">Version</h2>
          <pre className="text-zinc-300 text-sm">{version}</pre>
        </div>
      </section>

      <section className="w-2/3 p-6 overflow-y-auto bg-white text-black rounded-l-3xl shadow-lg">
        <h1 className="text-xl font-semibold mb-4">Live Preview</h1>
        <div
          className="rounded bg-white p-4 shadow-inner min-h-[400px]"
          dangerouslySetInnerHTML={{ __html: htmlOutput }}
        />
      </section>
    </div>
  )
}
