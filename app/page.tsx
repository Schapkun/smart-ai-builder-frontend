async function implementChange(html: string, originalPrompt: string) {
  console.log("\u26a1 implementChange AANGEROEPEN")
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
    const successMsg: ChatMessage = {
      role: "assistant",
      content: "\ud83d\ude80 Wijziging succesvol toegepast.",
      loading: false,
    }
    setChatHistory((prev) => [...prev, successMsg])
  } else {
    const errorMsg: ChatMessage = {
      role: "assistant",
      content: `\u274c Fout bij opslaan wijziging: ${error.message}`,
      loading: false,
    }
    setChatHistory((prev) => [...prev, errorMsg])
  }
}
