import { ContextMenuId, InvokerFunc } from "@/types"
import { session } from "./session"
import { msgInvoker } from "@/utils/invoker"

const __DEV__ = process.env.NODE_ENV == "development"

chrome.runtime.onMessage.addListener(handleMessage)
chrome.runtime.onInstalled.addListener(handleInstalled)
chrome.contextMenus.onClicked.addListener(handleContextMenusClicked)
chrome.action.onClicked.addListener(handleActionClicked)

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

session.connection$.subscribe(() => {
  msgInvoker.invoke({
    func: InvokerFunc.ConnectionState,
    args: [session.getState()],
  })
})

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
    //
  })
}

function handleContextMenusClicked(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
) {
  switch (info.menuItemId) {
    case ContextMenuId.Dev:
      chrome.tabs.create({ url: "/popup.html" })
      break
  }
}

function handleActionClicked(tab: chrome.tabs.Tab) {
  //
}
