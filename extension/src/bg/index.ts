import { Connection, ContextMenuId, InvokerFunc } from "@/types"
import { session } from "./session"
import { msgInvoker } from "@/utils/invoker"
import { contentMainScript, contentScript } from "@/manifest"
import { EMPTY, finalize, interval, switchMap, tap } from "rxjs"
import { formatDuration } from "@/utils/util"

const __DEV__ = process.env.NODE_ENV == "development"

chrome.scripting.registerContentScripts([contentScript, contentMainScript])
chrome.runtime.onMessage.addListener(handleMessage)
chrome.runtime.onInstalled.addListener(handleInstalled)
chrome.contextMenus.onClicked.addListener(handleContextMenusClicked)
chrome.action.onClicked.addListener(handleActionClicked)
chrome.action.setBadgeText({ text: "" })

msgInvoker
  .add(InvokerFunc.Connect, session.connect)
  .add(InvokerFunc.Disconnect, session.disconnect)
  .add(InvokerFunc.GetConnectionState, () => {
    msgInvoker.invoke({
      tabId: msgInvoker.currentSender?.tab?.id,
      func: InvokerFunc.ConnectionState,
      args: [session.getState()],
    })
  })

session.connection$
  .pipe(
    tap(() => {
      msgInvoker.invoke({
        func: InvokerFunc.ConnectionState,
        args: [session.getState()],
      })
    }),
    switchMap((connection) => {
      if (connection == Connection.Connected) {
        return interval(1000).pipe(
          tap(() => {
            const duration = Date.now() - session.connectedAt
            chrome.action.setBadgeText({
              text: formatDuration(duration),
            })
          }),
          finalize(() => {
            chrome.action.setBadgeText({
              text: "",
            })
          })
        )
      } else {
        return EMPTY
      }
    })
  )
  .subscribe()

function handleMessage(message: any, sender: chrome.runtime.MessageSender) {
  console.log("[bg]: ", message.type, message)
  switch (message.type) {
    case msgInvoker.invokeMsgType:
      msgInvoker.handleReqMsg(message, sender)
      break
    case msgInvoker.resMsgType:
      msgInvoker.handleResMsg(message)
      break
  }
}

function handleInstalled({ reason }: chrome.runtime.InstalledDetails) {
  chrome.contextMenus.create({
    contexts: ["action"],
    id: "",
    title: "",
  })

  if (__DEV__) {
    chrome.contextMenus.create({
      contexts: ["action"],
      id: ContextMenuId.Dev,
      title: "DEV",
    })
  }

  chrome.tabs.onActivated.addListener(async (info) => {
    msgInvoker
      .invoke({
        tabId: info.tabId,
        func: InvokerFunc.PingContent,
        timeout: 300,
      })
      .catch(() => {
        chrome.scripting.executeScript({
          files: contentMainScript.js,
          target: { tabId: info.tabId },
        })
        chrome.scripting.executeScript({
          files: contentMainScript.js,
          target: { tabId: info.tabId },
          world: "MAIN",
        })
      })
  })
}

function handleContextMenusClicked(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
) {
  switch (info.menuItemId) {
    case ContextMenuId.Dev:
      chrome.tabs.create({ url: "/dev.html" })
      break
  }
}

function handleActionClicked(tab: chrome.tabs.Tab) {
  //
}
