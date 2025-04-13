import { createRoot } from "react-dom/client"
import App from "@/components/App"
import Popup from "./Popup"
import { msgInvoker } from "@/utils/invoker"

const div = document.querySelector("#app")
const root = createRoot(div)
root.render(
  <App>
    <Popup />
  </App>
)

msgInvoker.listen()

if (process.env.NODE_ENV == "development") {
  chrome.runtime.onMessage.addListener((message, sender) => {
    console.log("[popup] message: ", message, sender)
  })
}
