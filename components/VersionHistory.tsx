"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

// ─── Supabase Setup ─────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Types ───────────────────────────────────────────────────────
interface Version {
  id: number
  timestamp: string
  prompt: string
  html: string
  supabase_instructions: string
}

// ─── Component ───────────────────────────────────────────────────
export default function VersionHistory({ onSelect }: { onSelect: (version: Version) => void }) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchVersions() {
      setLoading(true)
      const { data, error } = await supabase
        .from("versions")
        .select("id, timestamp, prompt, html_preview, supabase_instructions")
        .order("timestamp", { ascending: false })

      if (error) {
        console.error("Fout bij ophalen versies:", error)
      } else if (data) {
        // Handmatig html_preview → html mappen
        const mapped = data.map((item) => ({
          ...item,
          html: item.html_preview,
        }))
        setVersions(mapped)
      }

      setLoading(false)
    }

    fetchVersions()
  }, [])

  return (
    <div className="mt-4">
      <h2 className="font-medium text-sm text-zinc-400 mb-2">Restore History</h2>
      {loading && <p>Loading versions...</p>}
      <ul className="max-h-40 overflow-auto space-y-1">
        {versions.map((version) => (
          <li
            key={version.id}
            className="cursor-pointer rounded px-2 py-1 hover:bg-zinc-700"
            onClick={() => onSelect(version)}
          >
            {new Date(version.timestamp).toLocaleString()} — {version.prompt.slice(0, 30)}...
          </li>
        ))}
      </ul>
    </div>
  )
}
