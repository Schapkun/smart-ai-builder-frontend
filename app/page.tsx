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
  showCode?: boolean
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
      .select("id, prompt, page_route, html_preview, html_live, timestamp, timestamp_local")
      .order("timestamp", { ascending: false })
      .limit(20)

    if (error) return console.error("Fout bij ophalen versies:", error)
    const filtered = (data || []).filter((v) => v.prompt?.trim())
    setVersions(filtered)

    const latest = filtered.find(v => v.page_route === currentPageRoute && v.html_preview)
    if (latest) {
      setHtmlPreview(latest.html_preview)
      setShowLiveProject(false)
    }
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
        explanation: instructions.message || undefined,
        html: data.html || undefined,
        hasChanges: !!data.html,
        loading: false,
        showCode: false,
      }

      setChatHistory((prev) => [...prev.slice(0, -1), aiMsg])

    } catch (e: any) {
      alert("Fout bij AI-aanroep: " + e.message)
    }
  }

  async function implementChange(html: string, originalPrompt: string) {
    const timestamp = new Date().toISOString()
    const timestamp_local = new Date().toLocaleString("sv-SE", {
      timeZone: "Europe/Amsterdam",
      hour12: false,
    })

    const newVersion = {
      prompt: originalPrompt,
      html_preview: html,
      timestamp,
      timestamp_local,
      supabase_instructions: JSON.stringify({ bron: "chat-implementatie" }),
      page_route: currentPageRoute,
    }

    setHtmlPreview(html)
    setShowLiveProject(false)

    const { error } = await supabase.from("versions").insert([newVersion])

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
    if (!versionId) return alert("Selecteer eerst een versie om live te zetten.")
    setLoadingPublish(true)

    try {
      const { data, error } = await supabase
        .from("versions")
        .select("id")
        .eq("timestamp", versionId)
        .single()

      if (error || !data) {
        alert("Kon versie niet vinden: " + error?.message)
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

  const iframeUrl = showLiveProject ? "https://meester.app" : "https://preview-version.onrender.com/"

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
                  <>
                    <button
                      onClick={() => implementChange(msg.html!, msg.content)}
                      className="mt-2 text-sm text-blue-600 underline"
                    >
                      Implementeer wijzigingen
                    </button>
                    <details className="mt-1">
                      <summary className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-700">Toon HTML-code</summary>
                      <pre className="bg-zinc-100 text-xs text-black p-2 mt-2 rounded overflow-auto max-h-64 whitespace-pre-wrap">
                        {msg.html}
                      </pre>
                    </details>
                  </>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 relative">
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
            Genereer code
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
                <p className="truncate text-sm">{v.prompt}</p>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto bg-zinc-100 text-black rounded-l-3xl shadow-inner">
        <div className="flex justify-between items-center mb-4 bg-zinc-100 px-4 py-3 rounded">
          <h1 className="text-3xl font-extrabold break-words max-w-[90%]">{iframeUrl}</h1>
          <button
            onClick={() => setShowLiveProject(!showLiveProject)}
            className="bg-zinc-200 hover:bg-zinc-300 text-sm px-4 py-2 rounded"
          >
            {showLiveProject ? "Toon preview" : "Toon live"}
          </button>
        </div>

        <div className="bg-white border rounded shadow p-1">
          <iframe
            src={iframeUrl}
            sandbox="allow-same-origin allow-scripts"
            className="w-full h-[85vh] rounded"
          />
        </div>
      </main>
    </div>
  )
}

