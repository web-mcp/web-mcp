import { snapshot } from "@/content/tools/snapshot"
import { useEffect, useRef, useState } from "react"

export default function DevPage() {
  const iframe = useRef<HTMLIFrameElement>(null)
  const [html, setHtml] = useState("")

  useEffect(() => {
    const frame = iframe.current
    if (!frame) return
    const p = new URLSearchParams(location.search)
    const url = p.get("url") || localStorage.getItem("_url")
    fetch(url)
      .then((res) => res.text())
      .then((html) => {
        frame.srcdoc = html
        return new Promise((r) => (frame.onload = r))
      })
      .then(() => {
        test()
      })
  }, [])

  useEffect(() => {
    const frame = iframe.current
    if (html && frame) {
      frame.srcdoc = html
      frame.onload = () => {
        test()
      }
    }
  }, [html])

  function test() {
    const doc = iframe.current.contentDocument
    snapshot(doc.body)
  }

  return (
    <div>
      <div className="flex gap-3 items-center">
        <button onClick={test}>Test</button>
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          rows={1}
          className="w-[300px] border"
        ></textarea>
      </div>
      <div>
        <iframe ref={iframe} className="w-full h-screen"></iframe>
      </div>
    </div>
  )
}
