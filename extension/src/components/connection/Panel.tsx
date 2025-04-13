import React, { useEffect, useState } from "react"
import { Input as AntInput, Select as AntSelect, Tooltip } from "antd"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { msgInvoker } from "@/utils/invoker"
import { Connection, InvokerFunc, SessionState } from "@/types"
import { Copy, LoaderCircle, Play, Power } from "lucide-react"

type Props = {
  state: SessionState
}

export default function Connect({ state }: Props) {
  const [proxyUrl, setProxyUrl] = useState("")
  const [token, setToken] = useState(crypto.randomUUID())

  const handleSelectChange = (value: string) => {
    if (state.connection != Connection.Connecting) {
      setProxyUrl(value)
    }
  }

  const handleConnect = async () => {
    const state = await msgInvoker.invoke({
      func: InvokerFunc.Connect,
      args: [proxyUrl, token],
    })
  }

  const handleDisconnect = async () => {
    await msgInvoker.invoke({
      func: InvokerFunc.Disconnect,
    })
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(state.serverUrl)
  }

  const selectAfter = (
    <AntSelect
      value=""
      onChange={handleSelectChange}
      popupMatchSelectWidth={false}
      dropdownStyle={{ maxHeight: "80vh" }}
      options={[
        {
          label: "Local",
          options: [
            {
              label: "http://localhost:6288/web/sse",
              value: "http://localhost:6288/web/sse",
            },
          ],
        },
        {
          label: "Offical",
          options: [
            {
              label: "Offical Cloudflare worker",
              value: "https://xxx.worker.dev",
            },
            {
              label: "Offical Onrender Server",
              value: "https://xxx.xxx.com",
            },
          ],
        },
        {
          label: "Community",
          options: [
            {
              label: "Offical Cloudflare worker",
              value: "https://xxx.worker.dev/",
            },
            {
              label: "Offical Onrender Server",
              value: "https://xxx.xxx.com/",
            },
          ],
        },
      ]}
    />
  )

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
            <Tooltip title="Copied!" trigger="click">
              <Button onClick={handleCopy}>
                <Copy />
              </Button>
            </Tooltip>
          </div>

          <Button className="w-full cursor-pointer" onClick={handleDisconnect}>
            <Power />
            Stop MCP Server
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <AntInput
            size="large"
            value={proxyUrl}
            disabled={state.connection == Connection.Connecting}
            placeholder="Enter Proxy URL"
            onChange={(e) => setProxyUrl(e.target.value)}
            addonAfter={selectAfter}
          />
          {state.connection == Connection.Connecting ? (
            <Button
              className="w-full cursor-pointer"
              onClick={handleDisconnect}
            >
              <LoaderCircle className="animate-spin" />
              Cancel Connect
            </Button>
          ) : (
            <Button
              disabled={!proxyUrl}
              className="w-full cursor-pointer"
              onClick={handleConnect}
            >
              <Play />
              Start MCP Server
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
