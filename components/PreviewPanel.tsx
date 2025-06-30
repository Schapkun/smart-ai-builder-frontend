"use client"

interface PreviewPanelProps {
  html: string
}

export default function PreviewPanel({ html }: PreviewPanelProps) {
  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Live Preview</h1>
      <div
        className="rounded bg-white p-6 shadow-inner min-h-[500px] prose max-w-none overflow-auto"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  )
}
