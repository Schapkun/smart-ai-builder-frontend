"use client"

import { useState } from "react"
import PromptInput from "../components/PromptInput"
import PreviewPanel from "../components/PreviewPanel"
import VersionHistory from "../components/VersionHistory"
import Sidebar from "../components/Sidebar"

export default function Home() {
  const [prompt, setPrompt] = useState("")
  const [htmlOutput, setHtmlOutput] = useState("<p>Voer een prompt in en klik op Execute.</p>")
  const [supabaseOutput, setSupabaseOutput] = useState("")
  const [version, setVersion] = useState("")
  const [showVersionHistory, setShowVersionHistory] = useState(false)

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
    } catch (e: any) {
      setHtmlOutput(`<p class="text-red-600">Fout bij AI-aanroep: ${e.message}</p>`)
    }
  }

  return (
    <div className="flex h-screen bg-zinc-900 text-white">
      <Sidebar
        prompt={prompt}
        setPrompt={setPrompt}
        onSubmit={handleSubmit}
        supabaseOutput={supabaseOutput}
        version={version}
        toggleVersionHistory={() => setShowVersionHistory(!showVersionHistory)}
      />

      <main className="flex-1 p-6 overflow-auto bg-white text-black rounded-l-3xl shadow-inner">
        <PreviewPanel html={htmlOutput} />

        {showVersionHistory && (
          <VersionHistory
            onSelect={(version) => {
              setPrompt(version.prompt)
              setHtmlOutput(version.html)
              setSupabaseOutput(version.supabase_instructions)
              setVersion(version.timestamp)
              setShowVersionHistory(false)
            }}
          />
        )}
      </main>
    </div>
  )
}
