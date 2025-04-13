import { ConfigProvider } from "antd"
import { PropsWithChildren } from "react"

export default function AntdProvider({ children }: PropsWithChildren) {
  return (
    <ConfigProvider
      theme={{
        token: {
          // colorPrimary: "",
        },
        components: {
          Input: {
            paddingBlockLG: 5,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  )
}
