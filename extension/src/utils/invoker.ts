import { ExtMsgInvoker } from "@ziziyi/invoker"

class MessageInvoker extends ExtMsgInvoker {
  public currentSender: chrome.runtime.MessageSender | undefined = undefined

  
}

export const msgInvoker = new MessageInvoker("msg")
