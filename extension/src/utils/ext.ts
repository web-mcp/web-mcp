export function createContentRoot({
  doc = document,
  shadow = true,
  shadowRootMode = "closed",
  styleLinks = [],
  style = "",
  tagName = "div",
  getParent,
}: {
  doc?: Document
  shadow?: boolean
  shadowRootMode?: "closed" | "open"
  styleLinks?: string[]
  style?: string
  getParent: () => HTMLElement
  tagName?: string
}) {
  const parent = getParent()
  const outter: HTMLElement = doc.createElement(tagName)
  parent.appendChild(outter)
  let container = outter
  if (parent.querySelector("div") == outter) {
    container = doc.createElement("div")
    outter.appendChild(container)
  }

  const root = !shadow
    ? container
    : container.attachShadow({ mode: shadowRootMode })
  const appRoot = doc.createElement("div")
  appRoot.id = "app"

  styleLinks.forEach((href) => {
    const link = doc.createElement("link")
    link.rel = "stylesheet"
    link.href = href
    root.appendChild(link)
  })

  if (style) {
    const styleEl = doc.createElement("style")
    // not .xml page
    if (styleEl instanceof HTMLStyleElement) {
      styleEl.innerHTML = style
      root.appendChild(styleEl)
    }
  }

  root.appendChild(appRoot)

  const restore = () => {
    const parent = getParent()
    console.log("[Content] restore", outter.isConnected, container.isConnected)
    if (!outter.isConnected) {
      parent.appendChild(outter)
    }
    if (container != outter && !container.isConnected) {
      outter.appendChild(container)
    }
  }

  return {
    outter,
    container,
    root,
    appRoot,
    restore,
  }
}

type UpdatedOption = {
  tabId: number
  status: string
  timeout?: number
}

export async function tabUpdated({ tabId, status, timeout }: UpdatedOption) {
  return new Promise<void>((r) => {
    const handleUpdate = (id: number, info: chrome.tabs.TabChangeInfo) => {
      console.log(id, info)
      if (id === tabId && info.status === status) {
        chrome.tabs.onUpdated.removeListener(handleUpdate)
        r()
      }
    }
    setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(handleUpdate)
      r()
    }, timeout || 30 * 1000)
    chrome.tabs.onUpdated.addListener(handleUpdate)
  })
}

export function getLocal<T extends Record<string, any>>(key: string | T) {
  return chrome.storage.local.get(key) as Promise<T>
}

export function setLocal<T extends Record<string, any>>(key: T) {
  return chrome.storage.local.set(key) as Promise<void>
}

export function getSession<T extends Record<string, any>>(key: string | T) {
  const storageArea = chrome.storage.session || chrome.storage.local
  return storageArea.get(key) as Promise<T>
}

export function setSession<T extends Record<string, any>>(key: T) {
  const storageArea = chrome.storage.session || chrome.storage.local
  return storageArea.set(key) as Promise<void>
}
