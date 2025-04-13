import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js"
import { createMCPServer, ObservableMcpServer } from "./mcp"
import { BehaviorSubject, Subject } from "rxjs"
import { Connection, type SessionState } from "@/types"

export class Session {
  private url: URL
  private token: string
  private server: ObservableMcpServer
  private transport: SSEClientTransport
  private readonly _connection$ = new BehaviorSubject(Connection.Disconnected)
  public readonly connection$ = this._connection$.asObservable()
  private connectedAt = 0
  private timer: number | NodeJS.Timeout

  constructor() {
    this.connect = this.connect.bind(this)
    this.disconnect = this.disconnect.bind(this)
  }

  async connect(proxyUrl: string, token: string) {
    if (!token || !proxyUrl) {
      throw new Error("Invalid token or url")
    }

    if (this.transport) {
      throw new Error("Session already connected.")
    }

    const u = new URL(proxyUrl)
    u.searchParams.set("token", token)

    this.token = token
    this.url = u
    this._connection$.next(Connection.Connecting)
    this.transport = new SSEClientTransport(u, {})
    this.server = await createMCPServer()
    await this.server.connect(this.transport)
    this.connectedAt = Date.now()
    this.applyTimeoutPolicy()
    this._connection$.next(Connection.Connected)

    return this.getState()
  }

  async disconnect() {
    this._connection$.next(Connection.Disconnected)
    clearInterval(this.timer)

    if (this.server) {
      await this.server.close()
      this.server = null
    }
    if (this.transport) {
      await this.transport.close()
      this.transport = null
    }
  }

  getState(): SessionState {
    const { url, token } = this

    const connection = this._connection$.value
    const serverUrl = url
      ? `${url.origin}/sse?token=${encodeURIComponent(token)}`
      : ""

    return {
      connection,
      serverUrl,
    }
  }

  private applyTimeoutPolicy() {
    // this.server.receivedMessage$.subscribe(() => {})
  }
}

export const session = new Session()
