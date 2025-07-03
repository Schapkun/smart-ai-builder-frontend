"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "../lib/supabaseClient"
import { RefreshCcw, Upload } from "lucide-react"

interface Version {
  id: string
  prompt: string
  page_route?: string
  html_preview: string
  html_live: string
  timestamp: string
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  html?: string
  explanation?: string
  hasChanges?: boolean
  loading?: boolean
}

export default function Home() {
  const [prompt, setPrompt] = useState("")
  const [versionId, setVersionId] = useState<string | null>(null)
  const [versions, setVersions] = useState<Version[]>([])
  const [htmlPreview, setHtmlPreview] = useState("")
  const [showLiveProject, setShowLiveProject] = useState(true)
  const [loadingPublish, setLoadingPublish] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const [currentPageRoute, setCurrentPageRoute] = useState("homepage")

  useEffect(() => {
    fetch(`https://smart-ai-builder-backend.onrender.com/preview/${currentPageRoute}`)
      .then(res => res.json())
      .then(data => {
        if (data.html) {
          setHtmlPreview(data.html)
          setShowLiveProject(false)
        }
      })
      .catch(err => console.error("Fout bij ophalen preview:", err))

    fetchVersions()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [chatHistory])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

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

    const onlyHtmlVersions = data.filter((v) => v.html_preview)
    setVersions(onlyHtmlVersions)
  }

  async function handleSubmit() {
    if (prompt.trim() === "") return

    const userInput = prompt
    const userMsg: ChatMessage = { role: "user", content: userInput }
    const loadingMsg: ChatMessage = { role: "assistant", content: "...", loading: true }
    setChatHistory((prev) => [...prev, userMsg, loadingMsg])
    setPrompt("")

    try {
      const res = await fetch("https://smart-ai-builder-backend.onrender.com/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userInput,
          page_route: currentPageRoute,
          chat_history: [...chatHistory, userMsg],
        }),
      })

      if (!res.ok) throw new Error("Backend fout: " + res.statusText)
      const data = await res.json()

      const instructions = data.instructions || {}
      const aiMsg: ChatMessage = {
        role: "assistant",
        content: instructions.message || "Ik heb je prompt ontvangen.",
        html: data.html || undefined,
        explanation: instructions.message || undefined,
        hasChanges: !!data.html,
        loading: false,
      }

      setChatHistory((prev) => [...prev.slice(0, -1), aiMsg])
      if (data.html) fetchVersions()
    } catch (e: any) {
      alert("Fout bij AI-aanroep: " + e.message)
    }
  }

  async function implementChange(html: string, originalPrompt: string) {
    console.log("⚡ implementChange AANGEROEPEN")
    const timestamp = new Date().toISOString()

    setHtmlPreview(html)
    setShowLiveProject(false)

    const { error } = await supabase.from("versions").insert([
      {
        prompt: originalPrompt,
        html_preview: html,
        timestamp,
        supabase_instructions: { bron: "chat-implementatie" },
        page_route: currentPageRoute,
      },
    ])

    if (!error) {
      fetchVersions()
      alert("Wijziging succesvol toegepast.")
    } else {
      alert("Fout bij opslaan wijziging: " + error.message)
    }
  }

  async function publishLive() {
    if (!versionId) {
      alert("Selecteer eerst een versie om live te zetten.")
      return
    }

    setLoadingPublish(true)
    try {
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
        alert("Fout bij publiceren: " + (publishData.error || publishData.message))
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
      <aside className="w-1/3 p-6 flex flex-col gap-4 border-r border-zinc-800">
        <h2 className="text-xl font-bold">Versies</h2>
        <div className="overflow-y-auto flex-1">
          {versions.map((v) => (
            <button
              key={v.timestamp}
              onClick={() => selectVersion(v)}
              className="text-left mb-2 p-2 rounded bg-zinc-800 hover:bg-zinc-700"
            >
              {v.prompt}
            </button>
          ))}
        </div>
        <button
          onClick={publishLive}
          className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
          disabled={loadingPublish}
        >
          {loadingPublish ? "Publiceren..." : "Publiceer live"}
        </button>
      </aside>

      <main className="flex-1 p-6 overflow-auto bg-white text-black rounded-l-3xl">
        <div className="mb-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="w-full p-2 border rounded"
            placeholder="Typ hier je prompt..."
          />
          <button
            onClick={handleSubmit}
            className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            Verstuur
          </button>
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">Chatgeschiedenis</h2>
          <div className="bg-zinc-100 text-black p-4 rounded h-64 overflow-y-auto">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className="mb-2">
                <strong>{msg.role === "user" ? "Jij" : "AI"}:</strong> {msg.content}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">Preview</h2>
          {!showLiveProject ? (
            <div
              className="w-full h-[50vh] rounded border p-4 overflow-auto"
              dangerouslySetInnerHTML={{ __html: htmlPreview }}
            />
          ) : (
            <iframe
              src="https://meester.app"
              title="Live Supabase Project"
              className="w-full h-[50vh] rounded shadow-inner border"
            />
          )}
        </div>
      </main>
    </div>
  )
}
