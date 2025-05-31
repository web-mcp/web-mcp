import React, { useEffect, useState } from "react"
import { Input as AntInput, Select as AntSelect, Tooltip } from "antd"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { msgInvoker } from "@/utils/invoker"
import { Connection, InvokerFunc, SessionState } from "@/types"
import { Copy, LoaderCircle, Play, Power } from "lucide-react"
import { getLocal, setLocal } from "@/utils/ext"
import { useTranslation } from "react-i18next"
import ProxyInput from "./ProxyInput"
import { randomUUID } from "@/utils/util"

type Props = {
  state: SessionState
}

export default function Connect({ state }: Props) {
  const [proxyUrl, setProxyUrl] = useState("https://web-mcp.koyeb.app/web/sse")
  const [tokenData, setTokenData] = useState({
    url: "",
    token: "",
  })
  const [copied, setCopied] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    getLocal({
      proxyUrl: "",
      token: "",
      tokenUrl: "",
    }).then(({ proxyUrl, token, tokenUrl }) => {
      proxyUrl && setProxyUrl(proxyUrl)
      setTokenData({
        url: tokenUrl,
        token: token,
      })
    })
  }, [])

  const handleConnect = async () => {
    let token = tokenData.url == proxyUrl ? tokenData.token : ""
    if (!token) {
      token = randomUUID()
    }

    const state = await msgInvoker.invoke({
      func: InvokerFunc.Connect,
      args: [proxyUrl, token],
    })

    setLocal({
      proxyUrl: proxyUrl,
      token: token,
      tokenUrl: proxyUrl,
    })
  }

  const handleDisconnect = async () => {
    await msgInvoker.invoke({
      func: InvokerFunc.Disconnect,
    })
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(state.serverUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1000)
  }

  return (
    <div className="my-4">
      {state.connection == Connection.Connected ? (
        <div className="space-y-4">
          <div className="flex gap-2 w-full">
            <div className="relative flex w-full min-w-0 border rounded-lg">
              <div className="absolute w-full px-4 py-1.5 text-base select-all truncate leading-normal">
                {state.serverUrl}
              </div>
            </div>
            <Tooltip title={t("copied") + "!"} open={copied}>
              <Button onClick={handleCopy}>
                <Copy />
              </Button>
            </Tooltip>
          </div>

          <Button className="w-full cursor-pointer" onClick={handleDisconnect}>
            <Power />
            {t("stopMcpServer")}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <ProxyInput
            value={proxyUrl}
            disabled={state.connection == Connection.Connecting}
            placeholder={t("enterProxyUrl")}
            onChange={(v) => setProxyUrl(v)}
          />
          {state.connection == Connection.Connecting ? (
            <Button
              className="w-full cursor-pointer"
              onClick={handleDisconnect}
            >
              <LoaderCircle className="animate-spin" />
              {t("cancelConnection")}
            </Button>
          ) : (
            <Button
              disabled={!proxyUrl}
              className="w-full cursor-pointer"
              onClick={handleConnect}
            >
              <Play />
              {t("runMcpServer")}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
