import AntdProvider from "@/components/antd/AntdProvider"
import { PropsWithChildren } from "react"

import "@/assets/main.css"

export default function App({ children }: PropsWithChildren) {
  return <AntdProvider>{children}</AntdProvider>
}
