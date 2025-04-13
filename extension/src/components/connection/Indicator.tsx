import { cn } from "@/lib/utils"
import { Connection, type SessionState } from "@/types"

type Props = {
  state: SessionState
}
export default function Indicator({ state }: Props) {
  return (
    <div className="my-4">
      <div className="flex gap-3 items-center justify-center">
        <div
          className={cn(
            "relative size-4 rounded-full before:absolute before:inset-0 before:bg-green-500/50",
            "before:rounded-full before:animate-ping",
            state.connection == Connection.Connected
              ? "bg-green-500"
              : "bg-gray-400 before:hidden"
          )}
        />
        <div className="text-lg font-bold">WEB MCP SERVER</div>
      </div>
    </div>
  )
}
