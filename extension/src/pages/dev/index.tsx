import { createRoot } from "react-dom/client"
import App from "@/components/App"
import Dev from "./Dev"

const div = document.querySelector("#app")
const root = createRoot(div)
root.render(
  <App>
    <Dev />
  </App>
)
