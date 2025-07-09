"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "../lib/supabaseClient"
import { RefreshCcw, Upload } from "lucide-react"

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
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [htmlPreviewPath, setHtmlPreviewPath] = useState("index.html")
  const [instructions, setInstructions] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    scrollToBottom()
  }, [chatHistory])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  async function handleSubmit() {
    if (prompt.trim() === "") return

    const userInput = prompt
    const userMsg: ChatMessage = { role: "user", content: userInput }
    const loadingMsg: ChatMessage = { role: "assistant", content: "...", loading: true }
    setChatHistory((prev) => [...prev, userMsg, loadingMsg])
    setPrompt("")
    setLoading(true)

    try {
      const res = await fetch("https://smart-ai-builder-backend.onrender.com/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userInput,
          file_path: htmlPreviewPath,
          chat_history: [...chatHistory, userMsg],
        }),
      })

      if (!res.ok) throw new Error("Backend fout: " + res.statusText)
      const data = await res.json()

      const aiMsg: ChatMessage = {
        role: "assistant",
        content: data.instructions?.message || "Ik heb je prompt ontvangen.",
        explanation: data.instructions?.message,
        hasChanges: true,
        loading: false,
      }

      setInstructions(data.instructions?.message || "")
      setHtmlPreviewPath(data.file_path || "index.html")
      setChatHistory((prev) => [...prev.slice(0, -1), aiMsg])
    } catch (e: any) {
      alert("Fout bij AI-aanroep: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-900 text-white p-6">
      <h1 className="text-3xl font-extrabold mb-4">AI Builder Prompt Interface</h1>

      <div className="flex flex-col gap-3 mb-6 flex-1 overflow-auto">
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
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 mt-auto">
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
          Verstuur
        </button>
      </div>

      <div className="mt-6 border-t pt-4">
        <h2 className="text-lg font-semibold mb-2">Preview: {htmlPreviewPath}</h2>
        <iframe
          src={`https://schapkun.github.io/smart-ai-builder/preview_version/${htmlPreviewPath}`}
          className="w-full h-[70vh] rounded border"
        />
      </div>
    </div>
  )
}
