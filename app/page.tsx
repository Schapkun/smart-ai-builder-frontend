"use client"

import { useState } from "react"

export default function Home() {
  const [prompt, setPrompt] = useState("")
  const [htmlOutput, setHtmlOutput] = useState("<p>Voer een prompt in en klik op Execute.</p>")

  const handleSubmit = async () => {
    setHtmlOutput("<p>Laden...</p>")
    // Hier je fetch naar backend en html ophalen (zoals eerder)
  }

  return (
    <div className="flex h-screen bg-zinc-900 text-white">
      {/* Linker paneel - prompt input */}
      <section className="w-1/3 p-6 bg-zinc-900 flex flex-col">
        <h1 className="text-2xl font-bold mb-4">Prompt</h1>
        <textarea
          className="flex-grow bg-zinc-800 rounded p-4 resize-none text-white"
          placeholder="Typ je prompt hier..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          className="mt-4 bg-green-600 hover:bg-green-500 px-4 py-2 rounded"
          onClick={handleSubmit}
        >
          Execute
        </button>
      </section>

      {/* Rechter paneel - live preview */}
      <section className="w-2/3 p-6 bg-white text-black overflow-auto rounded-l-3xl shadow-inner">
        <h1 className="text-2xl font-bold mb-4">Live Preview</h1>
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlOutput }}
        />
      </section>
    </div>
  )
}
