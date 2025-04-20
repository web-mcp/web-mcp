import { createContentRoot } from "@/utils/ext"
import { waitDomState } from "@ziziyi/dom"
import { createRoot } from "react-dom/client"
import Content from "./Content"
import { msgInvoker } from "@/utils/invoker"
import { snapshot } from "./tools/snapshot"
import { InvokerFunc } from "@/types"
import { handleToolCall } from "./tools"

function mountApp() {
  const { appRoot, restore } = createContentRoot({
    getParent: () => document.body,
  })

  const root = createRoot(appRoot)
  root.render(<Content />)

  setTimeout(() => {
    if (!appRoot.isConnected) {
      restore()
    }
  }, 2000)
}

async function run() {
  await waitDomState("complete", 3000).catch(() => {})
  mountApp()
}

if (!globalThis.__content_run_at_) {
  globalThis.__content_run_at_ = "" + Date.now()

  msgInvoker.add(InvokerFunc.PingContent, () => {})
  msgInvoker.add(InvokerFunc.CallTools, handleToolCall)
  msgInvoker.listen()
  run()
}

if (process.env.NODE_ENV === "development") {
  chrome.runtime.onMessage.addListener((message, sender) => {
    console.log("[content]: ", message, sender)
  })
}
