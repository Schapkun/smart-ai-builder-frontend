"use client"

import { useState, useEffect } from "react"
import { supabase } from "../lib/supabaseClient"

interface Version {
  id: string
  prompt: string
  html_preview: string
  html_live: string
  timestamp: string
}

export default function Home() {
  const [prompt, setPrompt] = useState("")
  const [versionId, setVersionId] = useState<string | null>(null)
  const [versions, setVersions] = useState<Version[]>([])
  const [htmlPreview, setHtmlPreview] = useState("")
  const [showLiveProject, setShowLiveProject] = useState(true)
  const [loadingPublish, setLoadingPublish] = useState(false)

  useEffect(() => {
    fetchVersions()
  }, [])

  async function fetchVersions() {
    const { data, error } = await supabase
      .from("versions")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(20)

    if (error) {
      console.error("Fout bij ophalen versies:", error)
      return
    }
    setVersions(data || [])
  }

  async function handleSubmit() {
    try {
      const res = await fetch("https://smart-ai-builder-backend.onrender.com/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
      if (!res.ok) throw new Error("Backend fout: " + res.statusText)
      const data = await res.json()

      setHtmlPreview(data.html || "")
      setVersionId(data.version_timestamp || null)
      setShowLiveProject(false)

      // Nieuwe versie opslaan in Supabase met preview
      await supabase.from("versions").insert([
        {
          prompt,
          html_preview: data.html,
          timestamp: data.version_timestamp,
        },
      ])

      fetchVersions()
    } catch (e: any) {
      alert("Fout bij AI-aanroep: " + e.message)
    }
  }

  async function publishLive() {
    if (!versionId) {
      alert("Selecteer eerst een versie om live te zetten.")
      return
    }

    setLoadingPublish(true)
    try {
      // Zoek versie op met timestamp (of pas aan naar id als dat handiger is)
      const { data, error } = await supabase
        .from("versions")
        .select("id")
        .eq("timestamp", versionId)
        .single()

      if (error || !data) {
        alert("Kon versie niet vinden: " + error?.message)
        setLoadingPublish(false)
        return
      }

      const publishRes = await fetch("https://smart-ai-builder-backend.onrender.com/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version_id: data.id }),
      })

      const publishData = await publishRes.json()
      if (publishRes.ok) {
        alert("Live versie succesvol bijgewerkt!")
        setShowLiveProject(true)
        fetchVersions()
      } else {
        alert("Fout bij publiceren: " + publishData.error || publishData.message)
      }
    } catch (err: any) {
      alert("Fout bij publiceren: " + err.message)
    }
    setLoadingPublish(false)
  }

  function selectVersion(v: Version) {
    setPrompt(v.prompt)
    setHtmlPreview(v.html_preview)
    setVersionId(v.timestamp)
    setShowLiveProject(false)
  }

  return (
    <div className="flex h-screen bg-zinc-900 text-white">
      {/* Left panel */}
      <aside className="w-1/3 p-6 flex flex-col gap-4 border-r border-zinc-800">
        <h1 className="text-3xl font-extrabold">Loveable Clone</h1>

        <label htmlFor="prompt" className="font-semibold">Prompt</label>
        <textarea
          id="prompt"
          className="flex-grow bg-zinc-800 p-4 rounded resize-none text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Typ hier je prompt..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          className="mt-4 bg-green-600 hover:bg-green-500 px-6 py-3 rounded text-lg font-semibold transition"
          onClick={handleSubmit}
        >
          Execute
        </button>

        <button
          disabled={!versionId || loadingPublish}
          onClick={publishLive}
          className={`mt-4 px-6 py-3 rounded text-lg font-semibold transition ${versionId && !loadingPublish ? 'bg-blue-600 hover:bg-blue-500' : 'bg-zinc-700 cursor-not-allowed'}`}
        >
          {loadingPublish ? "Publiceren..." : "Publiceer live"}
        </button>

        <div>
          <h2 className="font-semibold text-sm text-zinc-400 mb-2">Version History</h2>
          <ul className="space-y-1 max-h-[220px] overflow-auto">
            {versions.map((v) => (
              <li
                key={v.id}
                className="cursor-pointer px-3 py-2 rounded hover:bg-zinc-700 transition"
                onClick={() => selectVersion(v)}
              >
                <time dateTime={v.timestamp} className="block text-xs text-zinc-500">
                  {new Date(v.timestamp).toLocaleString()}
                </time>
                <p className="truncate text-sm">{v.prompt}</p>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Right panel */}
      <main className="flex-1 p-8 overflow-auto bg-white text-black rounded-l-3xl shadow-inner">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-extrabold">Live Project Preview</h1>
          <button
            onClick={() => setShowLiveProject(!showLiveProject)}
            className="bg-zinc-200 hover:bg-zinc-300 text-sm px-4 py-2 rounded"
          >
            {showLiveProject ? "Toon preview" : "Toon live"}
          </button>
        </div>

        {showLiveProject ? (
          <iframe
            src="https://meester.app"
            title="Live Supabase Project"
            className="w-full h-[85vh] rounded shadow-inner border"
          />
        ) : (
          <div
            className="w-full h-[85vh] rounded border p-4 overflow-auto"
            dangerouslySetInnerHTML={{ __html: htmlPreview }}
          />
        )}
      </main>
    </div>
  )
}
