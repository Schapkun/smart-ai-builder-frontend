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
  const [currentPageRoute, setCurrentPageRoute] = useState("homepage")
  const [iframeUrl, setIframeUrl] = useState("https://meester.app")

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    fetchVersions()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [chatHistory])

  useEffect(() => {
    const baseUrl = showLiveProject ? "https://meester.app" : "https://preview-version.onrender.com/"
    setIframeUrl(baseUrl)
  }, [showLiveProject])

  useEffect(() => {
    const interval = setInterval(() => {
      const currentUrl = iframeRef.current?.contentWindow?.location.href
      if (currentUrl && currentUrl !== iframeUrl) {
        setIframeUrl(currentUrl)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [iframeUrl])

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

  return (
    <div className="flex h-screen bg-zinc-900 text-white">
      <aside className="w-1/3 p-6 flex flex-col gap-4 border-r border-zinc-800">
        <h1 className="text-3xl font-extrabold mb-4">Loveable Clone</h1>
        {/* Sidebar content blijft gelijk */}
      </aside>

      <main className="flex-1 p-8 overflow-auto bg-zinc-100 text-black rounded-l-3xl shadow-inner">
        <div className="flex justify-between items-center mb-4 bg-zinc-100 px-4 py-3 rounded">
          <p className="text-sm font-mono truncate max-w-[90%]">{iframeUrl}</p>
          <button
            onClick={() => setShowLiveProject(!showLiveProject)}
            className="bg-zinc-200 hover:bg-zinc-300 text-sm px-4 py-2 rounded"
          >
            {showLiveProject ? "Toon preview" : "Toon live"}
          </button>
        </div>

        <div className="bg-white border rounded shadow p-1">
          <iframe
            ref={iframeRef}
            src={iframeUrl}
            sandbox="allow-same-origin allow-scripts"
            className="w-full h-[85vh] rounded"
          />
        </div>
      </main>
    </div>
  )
}
