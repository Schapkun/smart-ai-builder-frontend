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
  timestamp_local?: string
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

    const filtered = (data || []).filter((v) => v.html_preview && v.html_preview.trim() !== "")
    setVersions(filtered)
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
    } catch (e: any) {
      alert("Fout bij AI-aanroep: " + e.message)
    }
  }

  async function implementChange(html: string, originalPrompt: string) {
    console.log("⚡ implementChange AANGEROEPEN")
    const timestamp = new Date().toISOString()
    const timestamp_local = new Date().toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam", hour12: false })

    setHtmlPreview(html)
    setShowLiveProject(false)

    const { error } = await supabase.from("versions").insert([
      {
        prompt: originalPrompt,
        html_preview: html,
        timestamp,
        timestamp_local,
        supabase_instructions: { bron: "chat-implementatie" },
        page_route: currentPageRoute,
      },
    ])

    if (!error) {
      fetchVersions()
      const successMsg: ChatMessage = {
        role: "assistant",
        content: "🚀 Wijziging succesvol toegepast.",
        loading: false,
      }
      setChatHistory((prev) => [...prev, successMsg])
    } else {
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: `❌ Fout bij opslaan wijziging: ${error.message}`,
        loading: false,
      }
      setChatHistory((prev) => [...prev, errorMsg])
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
        <h1 className="text-3xl font-extrabold mb-4">Loveable Clone</h1>
        <div className="flex justify-between items-center mb-4">
          <button onClick={fetchVersions} className="bg-zinc-700 hover:bg-zinc-600 p-2 rounded-full">
            <RefreshCcw size={18} />
          </button>
          <button
            disabled={!versionId || loadingPublish}
            onClick={publishLive}
            className="bg-blue-600 hover:bg-blue-500 px-3 py-2 text-xs rounded-full flex items-center gap-1 disabled:opacity-50"
          >
            <Upload size={14} /> Publiceer live
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="flex flex-col gap-2">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg max-w-[95%] ${
                  msg.role === "user" ? "self-end bg-green-100 text-black" : "self-start bg-gray-100 text-black"
                }`}
              >
                <div className="whitespace-pre-line">{msg.content}</div>
                {msg.loading && <div className="text-xs italic text-zinc-500 mt-1 animate-pulse">AI is aan het typen...</div>}
                {msg.explanation && <div className="text-xs italic text-zinc-600 mt-1">{msg.explanation}</div>}
                {msg.hasChanges && msg.html && (
                  <button
                    onClick={() => implementChange(msg.html!, msg.content)}
                    className="mt-2 text-sm text-blue-600 underline"
                  >
                    Implementeer wijzigingen
                  </button>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            className="flex-grow bg-zinc-800 p-3 rounded text-white resize-none placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Typ hier je prompt..."
          />
          <button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-500 px-4 py-2 text-sm rounded-full font-medium"
          >
            Stuur
          </button>
        </div>

        <div className="mt-4">
          <h2 className="font-semibold text-sm text-zinc-400 mb-2">Version History</h2>
          <ul className="space-y-1 max-h-[150px] overflow-auto">
            {versions.map((v) => (
              <li
                key={v.id}
                className={`cursor-pointer px-3 py-2 rounded transition ${
                  v.timestamp === versionId ? "bg-zinc-700" : "hover:bg-zinc-700"
                }`}
                onClick={() => selectVersion(v)}
              >
                <time className="block text-xs text-zinc-500">
                  {new Date(v.timestamp).toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" })}
                </time>
                {v.timestamp_local && (
                  <time className="block text-xs text-zinc-400 italic">
                    Lokale tijd: {v.timestamp_local}
                  </time>
                )}
                <p className="truncate text-sm">{v.prompt}</p>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto bg-white text-black rounded-l-3xl shadow-inner">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-extrabold">Chat + Project Preview</h1>
          <button
            onClick={() => setShowLiveProject(!showLiveProject)}
            className="bg-zinc-200 hover:bg-zinc-300 text-sm px-4 py-2 rounded"
          >
            {showLiveProject ? "Toon preview" : "Toon live"}
          </button>
        </div>

        {!showLiveProject ? (
          <iframe
            srcDoc={htmlPreview}
            sandbox="allow-same-origin allow-scripts"
            className="w-full h-[85vh] rounded border"
          />
        ) : (
          <iframe
            src="https://meester.app"
            title="Live Supabase Project"
            className="w-full h-[85vh] rounded shadow-inner border"
          />
        )}
      </main>
    </div>
  )
}
