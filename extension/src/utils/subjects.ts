import { Subject, BehaviorSubject } from "rxjs"
import { Connection, SessionState } from "@/types"

export const sessionSubject = new BehaviorSubject<SessionState>({
  connection: Connection.Disconnected,
  serverUrl: "",
})
