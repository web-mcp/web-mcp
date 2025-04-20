import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { msgInvoker } from "@/utils/invoker"
import { Connection, InvokerFunc, type SessionState } from "@/types"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { sessionSubject } from "@/utils/subjects"
import { IconAnythingCopilot, IconGithub } from "@/components/svg"
import Panel from "@/components/connection/Panel"
import Indicator from "@/components/connection/Indicator"

export default function Popup() {
  const [state, setState] = useState(sessionSubject.value)
  const { t } = useTranslation()

  useEffect(() => {
    msgInvoker.add(InvokerFunc.ConnectionState, (value: SessionState) => {
      sessionSubject.next(value)
    })

    msgInvoker.invoke({
      func: InvokerFunc.GetConnectionState,
      reply: false,
    })

    return () => {
      msgInvoker.remove(InvokerFunc.ConnectionState)
    }
  }, [])

  useEffect(() => {
    const subscription = sessionSubject.subscribe((value) => {
      setState(value)
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <div className="flex flex-col min-w-[300px] min-h-[460px] w-full p-6">
      <Indicator state={state} />
      <Panel state={state} />
      <div className="pt-4">
        <ol className="list-decimal ms-4 space-y-2">
          <li>{t("tips.step1")}</li>
          <li>{t("tips.step2")}</li>
          <li>{t("tips.step3")}</li>
        </ol>
        <p className="mt-2">{t("tips.proposal")}</p>
      </div>

      <div className="flex items-center gap-6 justify-center mt-auto">
        <a
          href="https://github.com/web-mcp/web-mcp"
          target="_blank"
          className="flex items-center gap-1 text-sm"
        >
          <IconGithub className="size-4" />
          GitHub
        </a>
        <a
          href="https://ziziyi.com/anything-copilot"
          target="_blank"
          className="flex items-center gap-1 text-sm"
        >
          <IconAnythingCopilot className="size-4" />
          Anything Copilot
        </a>
      </div>
    </div>
  )
}
