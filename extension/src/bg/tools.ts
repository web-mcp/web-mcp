import { z } from "zod"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { TextResult } from "@/utils/tools"
import { msgInvoker } from "@/utils/invoker"
import { InvokerFunc } from "@/types"

export function registerBrowserTools(server: McpServer) {
  server.tool("switch-tab", { id: z.number() }, async ({ id }) => {
    const tab = await chrome.tabs.update(id, {
      active: true,
      selected: true,
    })
    return TextResult(`Success: ${tab.title}`)
  })

  server.tool("get-tabs", async () => {
    const tabs = await chrome.tabs.query({})
    const text = tabs
      .map((t) => `ID: ${t.id}\nTitle: ${t.title}\nURL: ${t.url}`)
      .join("\n\n")
    return TextResult(text)
  })

  server.tool("new-tab", { url: z.string() }, async ({ url }) => {
    const tab = await chrome.tabs.create({
      url,
    })
    await tabReady()
    return msgInvoker.invoke({
      tabId: tab.id,
      func: InvokerFunc.CallTools,
      args: ["page_snapshot", {}],
    })
  })

  server.tool("remove-tab", { ids: z.array(z.number()) }, async ({ ids }) => {
    await chrome.tabs.remove(ids)
    return TextResult("Done")
  })

  server.tool("wait", { seconds: z.number() }, async ({ seconds }) => {
    await new Promise((r) => setTimeout(r, seconds * 1000))
    return TextResult("Done")
  })
}

export function registerPageTools(server: McpServer) {
  const elementSchema = {
    element: z
      .string()
      .describe(
        "Human-readable element description used to obtain permission to interact with the element"
      ),
    ref: z.string().describe("Exact target element id from the page snapshot"),
  }

  server.tool(
    "page_snapshot",
    "Capture accessibility snapshot of the current page",
    async () => {
      const tab = await tabReady()
      return msgInvoker.invoke({
        tabId: tab.id,
        func: InvokerFunc.CallTools,
        args: ["page_snapshot", {}],
      })
    }
  )
  server.tool(
    "click",
    "Perform click on a web page",
    elementSchema,
    async ({ element, ref }) => {
      const tab = await tabReady()
      return msgInvoker.invoke({
        tabId: tab.id,
        func: InvokerFunc.CallTools,
        args: ["click", { element, ref }],
      })
    }
  )
  server.tool("dbclick", elementSchema, async ({ element, ref }) => {
    const tab = await tabReady()
    return msgInvoker.invoke({
      tabId: tab.id,
      func: InvokerFunc.CallTools,
      args: ["dbclick", { element, ref }],
    })
  })

  const typeSchema = {
    ...elementSchema,
    text: z.string().describe("Text to type into the element"),
  }

  server.tool(
    "type",
    "Type text into editable element",
    typeSchema,
    async ({ element, ref, text }) => {
      const tab = await tabReady()
      return msgInvoker.invoke({
        tabId: tab.id,
        func: InvokerFunc.CallTools,
        args: ["type", { element, ref, text }],
      })
    }
  )

  const keySchema = {
    ...elementSchema,
    key: z.string().describe("Key to press"),
  }

  server.tool("press_key", keySchema, async ({ element, ref, key }) => {
    const tab = await tabReady()
    return msgInvoker.invoke({
      tabId: tab.id,
      func: InvokerFunc.CallTools,
      args: ["press_key", { element, ref, key }],
    })
  })
}

async function tabReady() {
  const tabs = await chrome.tabs.query({ active: true })
  const tab = tabs[0]
  const url = tab.pendingUrl || tab.url
  if (!tab || !url.startsWith("http")) {
    throw Error(
      "The current tab is unavailable, Please open or switch to the target tab first"
    )
  }
  if (tab.status == "complete") {
    return tab
  }
  await new Promise<chrome.tabs.Tab>((r) => {
    const handleUpdated = (tabId: number, info: chrome.tabs.TabChangeInfo) => {
      if (tabId == tab.id && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(handleUpdated)
        r(tab)
      }
    }
    chrome.tabs.onUpdated.addListener(handleUpdated)
  })
}

export function insiderTools(server: McpServer) {
  server.tool("google_search", { q: z.string() }, async ({ q }) => {
    await chrome.search.query({
      disposition: "NEW_TAB",
      text: q,
    })
    return TextResult("")
  })

  server.tool(
    "send-notification",
    {
      id: z.string(),
      title: z.string().optional(),
      message: z.string().optional(),
    },
    async ({ id, title, message }) => {
      await chrome.notifications.create(id, {
        iconUrl: "/logo.png",
        type: "basic",
        title,
        message,
      })
      return TextResult("")
    }
  )

  server.tool(
    "download",
    { url: z.string(), filename: z.string().optional() },
    async ({ filename, url }) => {
      await chrome.downloads.download({
        url,
        filename,
      })
      return TextResult("started download")
    }
  )
}
