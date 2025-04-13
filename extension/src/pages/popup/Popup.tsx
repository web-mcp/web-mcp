import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { msgInvoker } from "@/utils/invoker"
import { Connection, InvokerFunc, type SessionState } from "@/types"
import { useEffect, useState } from "react"
import Panel from "@/components/connection/Panel"
import { sessionSubject } from "@/utils/subjects"
import Indicator from "@/components/connection/Indicator"

export default function Popup() {
  const [state, setState] = useState(sessionSubject.value)
  const [token, setToken] = useState("token")

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
    <div className="min-w-[300px] min-h-[460px] w-full p-6">
      <Indicator state={state} />
      <Panel state={state} />
      <div>
        <p>
          We recommend using a local or free, self-hosted proxy service for a
          more stable and private connection.
        </p>
      </div>
    </div>
  )
}
